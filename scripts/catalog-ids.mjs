#!/usr/bin/env node
// Catalog id helper (issue #120). Replaces the gh/jq/grep pipelines that
// AGENTS.md used to spell out for picking a product id and for reviewing a
// catalog PR.
//
//   node scripts/catalog-ids.mjs next-id [--exclude-pr <n>]
//   node scripts/catalog-ids.mjs pr-ids <n>
//
// Other open PRs are untrusted input. The output is built only from numbers
// (PR numbers, ids, hunk line ranges) and fixed labels. Patch text, titles
// and branch names are never printed. Any API error exits non-zero, so a
// failure cannot be mistaken for "no claims".

import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PRODUCTS_PATH = 'src/static/json/products.json';
export const BASE_REF = 'main';
// An id more than this far above the highest id on main is an outlier: it
// is reported for a person and not used for the next id.
export const OUTLIER_MARGIN = 20;
export const PER_PAGE = 100;
// The REST "list pull request files" endpoint stops at 3000 files.
export const MAX_FILES = 3000;
const MAX_PR_PAGES = 50;

// --- pure parsing -------------------------------------------------------

// Ids of the products in a parsed products.json.
export function mainIds(products) {
  const list = products && products.data && products.data.products;
  if (!Array.isArray(list)) {
    throw new Error(`${PRODUCTS_PATH} on ${BASE_REF} has no data.products`);
  }
  return list.map((p) => {
    if (!p || !Number.isSafeInteger(p.id) || p.id < 0) {
      throw new Error(`${PRODUCTS_PATH} on ${BASE_REF} has a non-integer id`);
    }
    return p.id;
  });
}

const ADDED_ID = /^\+\s*\{?\s*"id"\s*:\s*(\d+)\s*(?:,|\}|$)/;
// Text on an added line that may set an id in a form ADDED_ID does not
// read: an "id" token anywhere (after another key, a repeated key, a
// non-integer value, trailing text, a key whose colon is on the next line),
// a key spelled with a \u escape (followed by its colon or ending the line),
// or a line that starts with a colon (the value of a key on the line
// before). It fails closed: such a line makes the ids unknown.
const MAYBE_ID = /"id"|"[^"]*\\u[0-9a-fA-F]{4}[^"]*"\s*(?::|$)|^\+\s*:/;
const HUNK = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

// Added ids and bare hunk ranges in one file's patch. Returns numbers only,
// plus `unreadable`: whether an added line may set an id it could not read.
export function parsePatch(patch) {
  const ids = new Set();
  const hunks = [];
  let unreadable = false;
  for (const line of patch.split('\n')) {
    const id = ADDED_ID.exec(line);
    // The rest of the line is checked too: JSON keeps the last of two
    // "id" keys, so a second one would hide the real id.
    if (id && !MAYBE_ID.test(line.slice(id[0].length))) {
      ids.add(Number(id[1]));
      continue;
    }
    if (line.startsWith('+') && MAYBE_ID.test(line)) {
      unreadable = true;
      continue;
    }
    const h = HUNK.exec(line);
    if (h) {
      const range = (start, len) =>
        len === undefined
          ? `${Number(start)}`
          : `${Number(start)},${Number(len)}`;
      hunks.push(`-${range(h[1], h[2])} +${range(h[3], h[4])}`);
    }
  }
  return { ids: [...ids].sort((a, b) => a - b), hunks, unreadable };
}

// What a PR's file list says about products.json.
//   { changes: false }                      - the PR does not touch it
//   { changes: true, unknown: <reason> }    - its ids cannot be read
//   { changes: true, ids, hunks }           - added ids and hunk ranges
export function productsClaim(files, truncated) {
  const entry = files.find((f) => f && f.filename === PRODUCTS_PATH);
  if (!entry) {
    return truncated
      ? { changes: true, unknown: 'file list truncated at 3000 files' }
      : { changes: false };
  }
  if (typeof entry.patch !== 'string') {
    return { changes: true, unknown: 'patch not available' };
  }
  const { ids, hunks, unreadable } = parsePatch(entry.patch);
  if (unreadable) return { changes: true, unknown: 'unreadable id line' };
  return { changes: true, ids, hunks };
}

// Applies the id policy from AGENTS.md "Adding a catalog product" step 2.
//   ids:       ids on main
//   claims:    [{ number, ids }] for every open PR whose ids are readable
//   excludePr: the caller's own PR. Its ids are judged keep or move (with a
//              replacement id) instead of being counted as another claim.
export function decide({ ids, claims, excludePr }) {
  const onMain = new Set(ids);
  const mainMax = ids.length ? Math.max(...ids) : -1;
  const limit = mainMax + OUTLIER_MARGIN;
  const others = claims.filter((c) => c.number !== excludePr);

  const outliers = [];
  const takenByMain = [];
  const byId = new Map();
  let highest = mainMax;
  for (const c of others) {
    for (const id of c.ids) {
      if (id > limit) {
        outliers.push({ number: c.number, id });
      } else if (onMain.has(id)) {
        takenByMain.push({ number: c.number, id });
      } else {
        highest = Math.max(highest, id);
        byId.set(id, [...(byId.get(id) || []), c.number]);
      }
    }
  }
  const contested = [...byId.entries()]
    .filter(([, prs]) => prs.length > 1)
    .map(([id, prs]) => {
      const sorted = [...prs].sort((a, b) => a - b);
      return { id, keeps: sorted[0], move: sorted.slice(1) };
    })
    .sort((a, b) => a.id - b.id);

  let own = null;
  const mine = claims.find((c) => c.number === excludePr);
  if (mine) {
    own = mine.ids.map((id) => {
      if (onMain.has(id)) {
        return { id, keep: false, why: 'on main', alsoClaimedBy: [] };
      }
      if (id > limit) {
        return { id, keep: false, why: 'outlier', alsoClaimedBy: [] };
      }
      const prs = byId.get(id) || [];
      const lower = prs.filter((n) => n < excludePr);
      if (lower.length) {
        const why = `claimed by #${Math.min(...lower)}`;
        return { id, keep: false, why, alsoClaimedBy: [] };
      }
      const higher = prs.filter((n) => n > excludePr).sort((a, b) => a - b);
      return { id, keep: true, alsoClaimedBy: higher };
    });
    // The ids the excluded PR keeps are taken too. Each id it must move gets
    // its own replacement past every other claim, so a PR that adds several
    // products never ends up with a duplicate.
    for (const o of own) if (o.keep) highest = Math.max(highest, o.id);
    for (const o of own) if (!o.keep) o.to = ++highest;
  }
  const nextId = highest + 1;
  return { mainMax, limit, nextId, outliers, takenByMain, contested, own };
}

// --- API access (through an injected api(path) function) ---------------

async function pages(api, path, maxPages) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const items = await api(`${path}${sep}per_page=${PER_PAGE}&page=${page}`);
    if (!Array.isArray(items)) {
      throw new Error(`unexpected API response for ${path}`);
    }
    all.push(...items);
    if (items.length < PER_PAGE) return { items: all, truncated: false };
  }
  return { items: all, truncated: true };
}

export async function fetchMainIds(api) {
  const products = await api(
    `repos/{owner}/{repo}/contents/${PRODUCTS_PATH}?ref=${BASE_REF}`,
    { raw: true },
  );
  return mainIds(products);
}

export async function fetchOpenPrs(api) {
  const { items, truncated } = await pages(
    api,
    'repos/{owner}/{repo}/pulls?state=open',
    MAX_PR_PAGES,
  );
  if (truncated) throw new Error('too many open PRs to list');
  return items.map((pr) => {
    if (!pr || !Number.isSafeInteger(pr.number)) {
      throw new Error('unexpected API response for the open PR list');
    }
    return pr.number;
  });
}

export async function fetchPrClaim(api, number) {
  const { items, truncated } = await pages(
    api,
    `repos/{owner}/{repo}/pulls/${number}/files`,
    MAX_FILES / PER_PAGE,
  );
  return productsClaim(items, truncated);
}

// --- output -------------------------------------------------------------

const list = (xs) => xs.join(', ');

function claimLines(number, claim) {
  if (!claim.changes) return [`#${number}: does not change products.json`];
  if (claim.unknown) return [`#${number}: ids unknown (${claim.unknown})`];
  return [
    `#${number}: ids ${claim.ids.length ? list(claim.ids) : 'none'}`,
    `  hunks ${claim.hunks.length ? list(claim.hunks) : 'none'}`,
  ];
}

const USAGE = [
  'usage: catalog-ids.mjs next-id [--exclude-pr <n>]',
  '       catalog-ids.mjs pr-ids <n>',
].join('\n');

function prNumber(value) {
  return /^[1-9]\d*$/.test(value || '') ? Number(value) : null;
}

export async function run(argv, { api, out, err }) {
  const [command, ...rest] = argv;
  try {
    const prArg = prNumber(rest[0]);
    if (command === 'pr-ids' && rest.length === 1 && prArg !== null) {
      claimLines(prArg, await fetchPrClaim(api, prArg)).forEach((l) => out(l));
      return 0;
    }
    if (command !== 'next-id') {
      err(USAGE);
      return 2;
    }
    let excludePr = null;
    if (rest.length) {
      excludePr = rest[0] === '--exclude-pr' ? prNumber(rest[1]) : null;
      if (rest.length !== 2 || excludePr === null) {
        err(USAGE);
        return 2;
      }
    }

    const ids = await fetchMainIds(api);
    const numbers = (await fetchOpenPrs(api)).sort((a, b) => a - b);
    const lines = [];
    const claims = [];
    let unknown = 0;
    let excluded = null;
    for (const number of numbers) {
      const claim = await fetchPrClaim(api, number);
      if (number === excludePr) excluded = claim;
      if (!claim.changes) continue;
      if (!claim.unknown) claims.push({ number, ids: claim.ids });
      if (number === excludePr) continue;
      if (claim.unknown) unknown++;
      lines.push(...claimLines(number, claim));
    }
    const d = decide({ ids, claims, excludePr });
    // The next id (and so every replacement id, which is below it) must not
    // be an id this script would itself call an outlier.
    if (d.nextId > d.limit) {
      throw new Error(
        `no free id within ${OUTLIER_MARGIN} of the highest id on ${BASE_REF} (${d.mainMax}); ask a person`,
      );
    }

    out(`highest id on ${BASE_REF}: ${d.mainMax}`);
    const label = excludePr ? ` (excluding #${excludePr})` : '';
    out(`open PRs changing products.json${label}:`);
    (lines.length ? lines : ['none']).forEach((l) => out(`  ${l}`));
    for (const c of d.contested) {
      out(
        `contested: id ${c.id} kept by #${c.keeps}, move ${c.move.map((n) => `#${n}`).join(', ')}`,
      );
    }
    for (const t of d.takenByMain) {
      out(`id already on ${BASE_REF}: #${t.number} id ${t.id}`);
    }
    for (const o of d.outliers) {
      out(`outlier, not counted: #${o.number} id ${o.id}`);
    }
    if (excludePr) {
      const self = `excluded PR #${excludePr}`;
      if (!excluded) {
        out(`${self}: not open`);
      } else if (excluded.unknown) {
        out(`${self}: ids unknown (${excluded.unknown})`);
      } else if (d.own && d.own.length) {
        for (const o of d.own) {
          const verdict = o.keep ? 'keep' : `move (${o.why}) to ${o.to}`;
          const higher = o.alsoClaimedBy.map((n) => `#${n}`).join(', ');
          out(
            `${self}: id ${o.id} ${verdict}${higher ? `, ${higher} must move` : ''}`,
          );
        }
      } else {
        out(`${self}: no id claimed`);
      }
    }
    if (unknown)
      out(`PRs with unknown ids: ${unknown} (name them in the PR body)`);
    out(`next id: ${d.nextId}`);
    return 0;
  } catch (e) {
    err(`catalog-ids: ${e.message}`);
    return 1;
  }
}

// --- gh CLI wiring ------------------------------------------------------

export function ghApi(path, { raw = false } = {}) {
  const args = ['api'];
  if (raw) args.push('-H', 'Accept: application/vnd.github.raw+json');
  args.push(path);
  let text;
  try {
    text = execFileSync('gh', args, {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } catch (e) {
    throw new Error(`gh api ${path.split('?')[0]} failed`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`gh api ${path.split('?')[0]} returned invalid JSON`);
  }
}

function invokedDirectly() {
  try {
    return (
      realpathSync(process.argv[1]) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch (e) {
    return false;
  }
}

if (invokedDirectly()) {
  run(process.argv.slice(2), {
    api: async (path, opts) => ghApi(path, opts),
    out: (line) => console.log(line),
    err: (line) => console.error(line),
  }).then((code) => {
    process.exitCode = code;
  });
}
