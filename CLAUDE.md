# Project Rules

## Package Manager
- **Always use `pnpm`** — never use `npm` or `yarn`
- Use `pnpm install`, `pnpm run build`, `pnpm test`, etc.

## Node.js Version
- Use `nvm` for Node.js version management
- Run `nvm use` before any command if an `.nvmrc` file exists
- If the required version is not installed, run `nvm install` first

## Project Overview
- This is an **n8n community node package** (`n8n-nodes-claudeway`)
- It provides n8n nodes for interacting with Claudeway (Claude CLI HTTP Gateway)
- Written in TypeScript, compiled to CommonJS

## Build & Test
- `pnpm run build` — compile TypeScript + copy icons
- `pnpm run dev` — watch mode
- `pnpm test` — run Jest tests
- `pnpm run lint` — ESLint
- `pnpm run format` — Prettier

## Project Structure
- `nodes/` — n8n node definitions
- `credentials/` — n8n credential definitions
- `__tests__/` — Jest test files
- `dist/` — compiled output (gitignored)
