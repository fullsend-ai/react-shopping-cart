# Agent instructions

## Dependency updates

### TypeScript is held at 4.9

- `typescript` is pinned to `^4.9.5` because `react-scripts@5.0.1` declares
  a `typescript` peer range of `^3.2.1 || ^4`, and its toolchain
  (fork-ts-checker, `@typescript-eslint`) needs the 4.x compiler API. A
  TypeScript 7 bump was merged and reverted for this reason (#57, #60).
  Dependabot ignores `typescript >=5` (`.github/dependabot.yml`).
- Every `@types/*` bump, and every dependency that ships its own `.d.ts`
  files (for example `styled-components`), must still type-check under
  TypeScript 4.9.

### How to check a typings version

1. Before choosing a version, look at what the package declares:
   - `npm view <pkg>@<version> typeScriptVersion` gives the oldest
     TypeScript the DefinitelyTyped authors support.
   - `npm view <pkg> dist-tags` shows the `ts4.9` tag, which is the newest
     release published for TypeScript 4.9.

   Use the `ts4.9` tag (or a version at or below it) when recommending a
   version. Do not recommend a bare major such as "22.x".

2. The declared `typeScriptVersion` is advisory. Some packages on `main`
   declare 5.x and still type-check under 4.9 (for example
   `@types/react@19.3.0`, which `react@19` needs). The authoritative check is
   `npm run typecheck`.
3. Do not trust a plain `tsc` / `tsc --noEmit` run. `tsconfig.json` sets
   `skipLibCheck: true`, which hides errors inside `.d.ts` files.
   `@types/node@22.20.5` passed plain `tsc` (#61) but fails with TS2502
   when lib checking is on (#66, #67).

### Pinned versions

- `@types/node` is pinned exactly to the newest `ts4.9` release, currently
  `22.9.3` (#66, #67). Dependabot ignores `@types/node >22.9.3`.
- `@types/jest` stays on 27.x to match the `jest@27` runtime shipped by
  `react-scripts@5`. Its `ts4.9` tag is 29.5.14. `@types/jest@30.0.0` fails
  `npm run typecheck` (TS2726 in its bundled `jest-mock` typings).

### `npm run typecheck`

`npm run typecheck` runs `tsc --project tsconfig.typecheck.json`. That
config extends `tsconfig.json` with `skipLibCheck: false`, so third-party
typings are checked too. `build` and `start` keep using `tsconfig.json`
unchanged.

There is one scoped exception. `styled-components` 6.5 and later (6.6.0 on
`main`) uses the global `NoInfer` type, which only exists in TypeScript
5.4+. `typecheck/ts4.9-shims.d.ts` declares the same fallback type that
styled-components exports. Only the typecheck config loads it. Delete the
shim when TypeScript is raised to 5.4 or later.

Do not use `NoInfer` in `src`. The shim makes it pass `npm run typecheck`,
but `build`, `start` and `test` do not load the shim and fail with TS2304.
The `npm run build` step of the validation commands below catches this.

### Validating a dependency PR

Run all four separately and report each result, including
`npm run typecheck`, in the PR body. Run the last three even if an earlier
one fails, so one failure does not hide the others (stop only if `npm ci`
fails):

```sh
npm ci
npm run typecheck
npm run build
CI=true npm test
```

The repo has no build/test CI (#7, #36). The `security` workflow only runs a
secret scan and `npm audit`, so a green `security` check does not mean the
build passed.

### Exit condition

When `react-scripts` is replaced or TypeScript 5 or later is otherwise
allowed, relax these together:

- the `typescript` and `@types/node` Dependabot ignore rules (see the
  comments in `.github/dependabot.yml`)
- the `@types/node` pin
- the shim in `typecheck/ts4.9-shims.d.ts`, but only once the installed
  TypeScript is 5.4 or later. TypeScript 5.0–5.3 has no built-in `NoInfer`,
  so removing the shim earlier brings back the TS2304 errors.
