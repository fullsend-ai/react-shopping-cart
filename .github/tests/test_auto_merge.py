"""Run the workflow's actual shell steps against a stateful GitHub API double.

Run: python3 -m unittest discover -s .github/tests -v
No credentials or third-party Python packages are needed.
"""

import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import textwrap
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / 'workflows/auto-merge.yml'
SHA = 'a' * 40
LOW = '<!-- finding:f_603fb0f3e3350fae -->\n**[low]** design-direction\n\nDescription.'
BOT = {'login': 'fullsend-ai-review', '__typename': 'Bot'}


def thread(body=LOW, author=None, resolved=False):
    return {
        'id': 'PRRT_low', 'isResolved': resolved, 'viewerCanResolve': True,
        'comments': {
            'totalCount': 1, 'pageInfo': {'hasNextPage': False},
            'nodes': [{'author': BOT if author is None else author, 'body': body}],
        },
    }


# Only GitHub is doubled. bash, jq, the guards, and reporting code are real.
FAKE_GH = r'''#!/usr/bin/env python3
import json, os, subprocess, sys
from pathlib import Path
p = Path(os.environ['FAKE_GH_STATE'])
s = json.loads(p.read_text())
a = sys.argv[1:]
s.setdefault('calls', []).append(a)
def save(): p.write_text(json.dumps(s))
def die(message):
    save()
    print(message, file=sys.stderr)
    sys.exit(1)
def option(key): return a[a.index(key)+1]
def field(key):
    for i, arg in enumerate(a):
        if arg in ('-f', '-F', '--field', '--raw-field') and a[i+1].startswith(key+'='):
            return a[i+1].split('=', 1)[1]
    raise AssertionError(('missing field', key, a))
def emit(value):
    save()
    if '--jq' in a:
        r = subprocess.run(['jq', '-r', option('--jq')], input=json.dumps(value), text=True)
        sys.exit(r.returncode)
    print(json.dumps(value))
if a[:2] == ['pr', 'view']:
    if s.get('view_error'): die('GitHub unavailable')
    name = option('--json')
    if name == 'headRefOid':
        s['head_reads'] = s.get('head_reads', 0) + 1
        emit({'headRefOid': s.get('moved_sha') if s.get('move_after_guards') and s['head_reads'] > 1 else s['head']})
    elif name == 'reviews': emit({'reviews': s['reviews']})
    elif name == 'changedFiles': emit({'changedFiles': s['expected_files']})
    else: die('unexpected PR view: '+name)
elif a[:2] == ['pr', 'merge']:
    assert '--squash' in a and option('--match-head-commit') == s['head']
    s.setdefault('effects', []).append('merge')
    if s.get('merge_error'): die('the base branch policy prohibits the merge')
    emit({})
elif a[:2] == ['pr', 'edit']:
    assert option('--remove-label') == 'ready-for-merge'
    s.setdefault('effects', []).append('remove-label')
    if s.get('label_error'): die('label API unavailable')
    s['ready'] = False
    emit({})
elif a[:2] == ['api', 'graphql']:
    query = field('query')
    if 'mutation' in query:
        assert 'resolveReviewThread' in query
        tid = field('thread_id')
        s.setdefault('effects', []).append('resolve:'+tid)
        if s.get('resolve_error'): die('Resource not accessible by integration')
        t = next(t for t in s['threads'] if t['id'] == tid)
        if not s.get('resolve_noop'): t['isResolved'] = True
        emit({'data': {'resolveReviewThread': {'thread': {'id': tid, 'isResolved': t['isResolved']}}}})
    else:
        assert field('owner') == 'fullsend-ai'
        assert field('name') == 'react-shopping-cart'
        assert field('number') == '104'
        # Reject a query that drops a field the safety decision relies on.
        for required in ('headRefOid', 'totalCount', 'hasNextPage', 'isResolved', 'viewerCanResolve', '__typename', 'body'):
            assert required in query, required
        s['thread_reads'] = s.get('thread_reads', 0) + 1
        if s.get('graphql_error'): die('GraphQL unavailable')
        if s.get('graphql_payload') is not None: emit(s['graphql_payload'])
        else:
            threads = s['threads']
            if s.get('new_thread_after_resolve') and s['thread_reads'] > 1:
                threads = threads + [s['new_thread_after_resolve']]
            emit({'data': {'repository': {'pullRequest': {
                'headRefOid': s.get('thread_head', s['head']),
                'reviewThreads': {'totalCount': s.get('thread_count', len(threads)),
                    'pageInfo': {'hasNextPage': s.get('more_threads', False)}, 'nodes': threads},
            }}}})
elif a[0] == 'api':
    endpoint = next(x for x in a[1:] if x.startswith('repos/'))
    base = 'repos/fullsend-ai/react-shopping-cart'
    if endpoint == base+'/pulls/104/files': emit(s['files'])
    elif endpoint == base+'/issues/104/comments':
        if '--method' in a:
            assert option('--method') == 'POST'
            body = field('body')
            s.setdefault('comments', []).append({'id': 12, 'user': {'login': 'github-actions[bot]', 'type': 'Bot'}, 'body': body})
            s.setdefault('effects', []).append('report')
            if s.get('late_label_during_report'): s['ready'] = True
            emit({})
        else:
            if s.get('comment_error'): die('comments unavailable')
            assert '--paginate' in a and '--slurp' in a
            emit([s.get('comments', [])])
    elif endpoint == base+'/issues/comments/12':
        assert option('--method') == 'PATCH'
        s['comments'][0]['body'] = field('body')
        s.setdefault('effects', []).append('update-report')
        emit({})
    else: die('unexpected API endpoint: '+endpoint)
else: die('unexpected gh invocation: '+repr(a))
'''


class AutoMergeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        gh = self.root / 'gh'
        gh.write_text(FAKE_GH)
        gh.chmod(0o755)
        self.state = {
            'head': SHA, 'reviews': [], 'files': [{'filename': 'src/product.tsx'}],
            'expected_files': 1, 'threads': [], 'ready': True,
        }
        self.scripts = [textwrap.dedent(block) for block in re.findall(
            r'^        run: \|\n((?:(?:          .*|)\n?)*)', WORKFLOW.read_text(), re.M)]
        self.env = {
            **os.environ, 'PATH': str(self.root)+os.pathsep+os.environ['PATH'],
            'FAKE_GH_STATE': str(self.root/'state.json'),
            'GITHUB_OUTPUT': str(self.root/'output'),
            'GITHUB_REPOSITORY': 'fullsend-ai/react-shopping-cart',
            'GITHUB_REPOSITORY_OWNER': 'fullsend-ai',
            'GITHUB_RUN_ID': '99', 'GITHUB_SERVER_URL': 'https://github.com',
            'PR_URL': 'https://github.com/fullsend-ai/react-shopping-cart/pull/104',
            'PR_NUMBER': '104', 'REVIEW_SHA': SHA,
        }

    def run_workflow(self):
        statefile = Path(self.env['FAKE_GH_STATE'])
        statefile.write_text(json.dumps(self.state))
        Path(self.env['GITHUB_OUTPUT']).write_text('')
        result = subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', self.scripts[0]],
                                env=self.env, text=True, capture_output=True)
        self.reason = Path(self.env['GITHUB_OUTPUT']).read_text().removeprefix('reason=').strip()
        self.report_result = None
        if result.returncode and len(self.scripts) > 1:
            self.report_result = subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', self.scripts[1]],
                env={**self.env, 'FAILURE_REASON': self.reason}, text=True, capture_output=True)
        self.state = json.loads(statefile.read_text())
        self.logs = result.stdout + result.stderr
        return result.returncode

    def assert_blocked(self, reason):
        self.assertNotEqual(self.run_workflow(), 0, self.logs)
        self.assertNotIn('merge', self.state.get('effects', []), self.logs)
        self.assertIsNotNone(self.report_result)
        self.assertEqual(self.report_result.returncode, 0, self.report_result.stdout+self.report_result.stderr)
        self.assertFalse(self.state['ready'], self.logs)
        self.assertEqual(len(self.state.get('comments', [])), 1, self.logs)
        self.assertIn(reason.lower(), self.state['comments'][0]['body'].lower())
        self.assertIn('/actions/runs/99', self.state['comments'][0]['body'])

    def test_zero_threads_merges_exact_commit_without_reporting(self):
        self.assertEqual(self.run_workflow(), 0, self.logs)
        self.assertEqual(self.state['effects'], ['merge'])
        self.assertGreaterEqual(self.state.get('thread_reads', 0), 2)

    def test_low_finding_resolves_then_merges(self):
        self.state['threads'] = [thread()]
        self.assertEqual(self.run_workflow(), 0, self.logs)
        self.assertEqual(self.state['effects'], ['resolve:PRRT_low', 'merge'])

    def test_only_exact_bot_low_finding_headers_qualify(self):
        cases = [
            thread(body=LOW.replace('[low]', '['+sev+']')) for sev in ('info', 'medium', 'high', 'critical', 'LOW', 'low-ish')
        ] + [
            thread(body='**[low]** no finding marker'),
            thread(body=LOW.replace('<!-- finding:', '<!-- invalid:')),
            thread(body='Explanation\n'+LOW),
            thread(body='<!-- finding:f_603fb0f3e3350fae -->\n**[medium]** issue\n\n'+LOW),
            thread(author={'login': 'fullsend-ai-review', '__typename': 'User'}),
            thread(author={'login': 'someone-else', '__typename': 'Bot'}),
            thread(author={'login': 'fullsend-ai-review[bot]', '__typename': 'Bot'}),
            thread(author={'login': 'maintainer', '__typename': 'User'}),
        ]
        for case in cases:
            with self.subTest(case=case):
                self.setUp()
                self.state['threads'] = [case]
                self.assert_blocked('unresolved')
                self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_human_reply_prevents_resolution(self):
        t = thread()
        t['comments']['nodes'].append({'author': {'login': 'human', '__typename': 'User'}, 'body': 'Please keep open'})
        t['comments']['totalCount'] = 2
        self.state['threads'] = [t]
        self.assert_blocked('unresolved')
        self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_mixed_severities_resolves_low_and_reports_medium(self):
        medium = thread(body=LOW.replace('[low]', '[medium]'))
        medium['id'] = 'PRRT_medium'
        self.state['threads'] = [thread(), medium]
        self.assert_blocked('unresolved')
        self.assertIn('resolve:PRRT_low', self.state['effects'])
        self.assertNotIn('resolve:PRRT_medium', self.state['effects'])

    def test_oversized_and_empty_comment_connections_stay_open(self):
        for patch in ({'totalCount': 101}, {'pageInfo': {'hasNextPage': True}}, {'nodes': [], 'totalCount': 0}, {'totalCount': 2}):
            with self.subTest(patch=patch):
                self.setUp()
                t = thread()
                t['comments'].update(patch)
                self.state['threads'] = [t]
                self.assert_blocked('unresolved')
                self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_existing_guards_block_before_any_thread_mutation(self):
        cases = [({'head': 'b'*40}, 'head')]
        cases += [({'reviews': [{'author': {'login': 'human'}, 'state': state}]}, 'veto') for state in ('CHANGES_REQUESTED', 'DISMISSED')]
        cases += [({'files': [{'filename': f}]}, 'path') for f in ('package.json', '.github/workflows/test.yml', 'src/.env', 'src/AGENTS.md', 'src/CLAUDE.local.md', 'docs/README.md', 'README.md.bak')]
        cases += [({'files': [{'filename': 'src/safe.ts', 'previous_filename': '.github/old.yml'}]}, 'path'),
                  ({'expected_files': None}, 'count'), ({'expected_files': 2}, 'incomplete')]
        for patch, reason in cases:
            with self.subTest(patch=patch):
                self.setUp()
                self.state.update(patch)
                self.state['threads'] = [thread()]
                self.assert_blocked(reason)
                self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_graphql_failure_or_truncation_blocks_and_reports(self):
        for patch in ({'graphql_error': True}, {'more_threads': True}, {'thread_count': 101},
                      {'thread_count': 1}, {'graphql_payload': {'data': {'repository': None}}},
                      {'graphql_payload': {'errors': [{'message': 'partial result'}]}}, {'thread_head': 'b'*40}):
            with self.subTest(patch=patch):
                self.setUp()
                self.state.update(patch)
                self.assert_blocked('thread')

    def test_resolve_denied_or_ineffective_blocks_merge(self):
        for patch in ({'resolve_error': True}, {'resolve_noop': True}):
            with self.subTest(patch=patch):
                self.setUp()
                self.state['threads'] = [thread()]
                self.state.update(patch)
                self.assert_blocked('resol')

    def test_head_move_after_path_checks_prevents_resolution(self):
        self.state.update(move_after_guards=True, moved_sha='b'*40, threads=[thread()])
        self.assert_blocked('head')
        self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_new_unresolved_thread_at_final_read_blocks_merge(self):
        self.state['new_thread_after_resolve'] = thread(body='Human question')
        self.assert_blocked('unresolved')

    def test_retries_update_one_comment_and_ignore_forged_markers(self):
        self.state['files'] = [{'filename': 'package.json'}]
        self.assert_blocked('path')
        self.state['ready'] = True
        self.assert_blocked('path')
        self.assertIn('update-report', self.state['effects'])
        self.state['comments'][0]['user'] = {'login': 'human', 'type': 'User'}
        self.run_workflow()
        self.assertEqual(len(self.state['comments']), 2)

    def test_api_and_merge_errors_produce_useful_failure_reports(self):
        for patch, reason in (({'view_error': True}, 'head'), ({'merge_error': True}, 'merge')):
            with self.subTest(patch=patch):
                self.setUp()
                self.state.update(patch)
                self.assertNotEqual(self.run_workflow(), 0)
                self.assertFalse(self.state['ready'])
                self.assertIn(reason, self.state['comments'][0]['body'].lower())

    def test_label_arriving_during_failure_report_is_removed(self):
        self.state.update(files=[{'filename': 'package.json'}], late_label_during_report=True)
        self.assert_blocked('path')
        self.assertEqual(self.state['effects'][-1], 'remove-label')

    def test_allowlisted_paths_and_previously_resolved_threads_merge(self):
        for filename in ('src/product.tsx', 'public/index.html', 'firebase.json', 'README.md'):
            with self.subTest(filename=filename):
                self.setUp()
                self.state['files'] = [{'filename': filename}]
                self.state['threads'] = [thread(body='Human question', resolved=True)]
                self.assertEqual(self.run_workflow(), 0, self.logs)
                self.assertEqual(self.state['effects'], ['merge'])

    def test_adversarial_unrelated_file_still_blocks_after_remediation(self):
        self.state.update(files=[
            {'filename': 'src/remediation.tsx', 'patch': '+direct remediation\n+extra unrelated edit'},
            {'filename': '.github/workflows/unrelated.yml', 'patch': '+unrelated workflow change'},
        ], expected_files=2, threads=[thread()])
        self.assert_blocked('path')
        self.assertNotIn('resolve:PRRT_low', self.state['effects'])

    def test_late_ready_label_is_removed_only_for_failed_current_head(self):
        self.state['files'] = [{'filename': 'package.json'}]
        self.assert_blocked('path')
        self.assertEqual(len(self.scripts), 3, 'Missing late-label cleanup step')
        for sha, author, expected_ready in (
            (SHA, 'github-actions[bot]', False),
            ('b'*40, 'github-actions[bot]', True),
            (SHA, 'human', True),
        ):
            with self.subTest(sha=sha, author=author):
                self.state['head'] = sha
                self.state['comments'][0]['user'] = {'login': author, 'type': 'Bot' if author.endswith('[bot]') else 'User'}
                self.state['ready'] = True
                Path(self.env['FAKE_GH_STATE']).write_text(json.dumps(self.state))
                r = subprocess.run(['bash', '-e', '-o', 'pipefail', '-c', self.scripts[2]],
                                   env=self.env, text=True, capture_output=True)
                self.assertEqual(r.returncode, 0, r.stdout+r.stderr)
                self.state = json.loads(Path(self.env['FAKE_GH_STATE']).read_text())
                self.assertEqual(self.state['ready'], expected_ready)
                self.assertEqual(len(self.state['comments']), 1)

    def test_label_failure_does_not_prevent_comment(self):
        self.state.update(files=[{'filename': 'package.json'}], label_error=True)
        self.assertNotEqual(self.run_workflow(), 0)
        self.assertEqual(len(self.state['comments']), 1)
        self.assertNotEqual(self.report_result.returncode, 0)

    def test_comment_api_failure_does_not_prevent_label_removal(self):
        self.state.update(files=[{'filename': 'package.json'}], comment_error=True)
        self.assertNotEqual(self.run_workflow(), 0)
        self.assertFalse(self.state['ready'])
        self.assertNotEqual(self.report_result.returncode, 0)


if __name__ == '__main__':
    unittest.main()
