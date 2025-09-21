# Repository Guidelines

## Development Philosophy (最重要)
- 常にテスト駆動開発 (TDD) を採用し、失敗するテストから着手してコード品質を保証する。
- SOLID原則に基づいたオブジェクト指向設計を徹底し、責務分離・依存方向・拡張性を意識する。
- クリーンアーキテクチャを採用し、ドメイン層・ユースケース層・インフラ層を明確に切り分ける。
- ドメイン駆動設計 (DDD) を基盤に、ユビキタス言語とアグリゲートを意識したモデル化を行う。
- 再利用性と可読性を最優先に、コンポーネントやサービスを疎結合かつ明瞭なインターフェイスで構築する。
- 新規アーキテクチャ要素の追加時は `docs/` に設計をドキュメント化し、開発者が追随できる状態を保つ。

## Project Structure & Module Organization
The app is split between the React frontend in `src/react-app` and the edge worker API in `src/worker/index.ts` powered by Hono. Assets live under `src/react-app/assets`, while shared static files go in `public` and are copied by Vite. Root configs (`vite.config.ts`, `tsconfig*.json`, `wrangler.json`, `worker-configuration.d.ts`) control bundling and deployment. Keep new UI modules inside `src/react-app`, colocating component styles. Server utilities belong beside the worker entry or in auxiliary folders you create.

## Build, Test, and Development Commands
Use `npm install` (or `pnpm install`) to sync dependencies. `npm run dev` starts Vite at http://localhost:5173 with HMR. `npm run lint` runs ESLint and must be clean before PRs. `npm run build` performs the TypeScript project build plus Vite production bundle. `npm run preview` serves the built bundle for manual QA. `npm run check` compiles, bundles, and performs a Wrangler dry-run deploy—treat it as the preflight gate. `npm run cf-typegen` syncs Worker bindings, and `npm run deploy` publishes through Wrangler.

## Coding Style & Naming Conventions
The project is TypeScript-first with React 19 functional components. Follow the existing two-space indentation, trailing semicolons, and double-quoted imports. Components use PascalCase filenames (`UserCard.tsx`); hooks, utilities, and worker helpers use camelCase. Rely on ESLint (`eslint.config.js`) to flag deviations and run autofixable rules with `npm run lint -- --fix` before opening a PR.

## Testing Guidelines
No dedicated automated test suite exists yet. When adding tests, prefer Vitest for React modules and place specs under `src/react-app/__tests__` or next to the component (`Component.test.tsx`). Validate worker logic with integration checks that exercise Hono routes. Until frameworks are added, always execute `npm run check` and attach manual verification notes (screenshots or curl output) to PRs.

## Commit & Pull Request Guidelines
Commits follow the short imperative style already in history (for example, `Add worker routing`). Keep them focused and sign off with relevant context. Pull requests should include: a concise summary, linked issues, screenshots or logs for UI/API changes, the commands you ran (include `npm run check`), and any Wrangler environment updates (such as secrets added via `npx wrangler secret put`).

## Cloudflare Workers Tips
`wrangler.json` and `.wrangler` hold deployment metadata; avoid committing secrets. Use `wrangler dev` through `npm run dev` for local API testing, and regenerate binding types after schema changes. When adding new bindings, update `worker-configuration.d.ts` so type generation remains accurate.

## Documentation Maintenance
After any change under `docs/`, always review `docs/README.md`. If the updated content should appear there, revise `docs/README.md` immediately so it points to the latest files and reflects the current document structure.
