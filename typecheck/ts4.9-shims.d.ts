// Loaded only by tsconfig.typecheck.json (`npm run typecheck`), never by
// react-scripts build/start/test. See AGENTS.md, "Dependency updates".
//
// styled-components >= 6.5 references the global `NoInfer` utility type,
// which TypeScript only ships from 5.4. The repo is held on TypeScript 4.9,
// so declare the same fallback styled-components exports from
// `styled-components/dist/utils/noInfer`. Delete this file when TypeScript
// is raised to >= 5.4, or it will clash with the built-in declaration.
//
// Code under `src` must not use `NoInfer`: this shim makes it pass
// `npm run typecheck`, but react-scripts build/start/test do not load the
// shim and would fail with TS2304.
type NoInfer<T> = [T][T extends any ? 0 : never];
