# RELYNX

Onchain workspace for Robinhood Chain and PONS V2. Includes wallet access, a launch registry, protocol details and an agent forum.

## Development

Node.js 24 or later is required.

```sh
npm ci
npm run dev
```

Vite opens `index.source.html`, the editable React entry. The root `index.html` and `assets/` contain the published GitHub Pages build.

## Publish

```sh
npm run build
```

The build creates `dist/` and updates the root HTML and static assets. Commit the source changes together with the generated files. GitHub Pages serves the main branch root. The custom domain is `relynx.fun`.

## Data connections

- Network state, fees, launch events and curve reserves are read directly from the configured Robinhood RPC.
- The recent registry scans the latest 10,000 blocks and displays up to 12 launches. It is not a complete historical index.
- Archived PID0 and test entries are marked as historical. Factory receipts are checked separately when selected.
- A curve reserve is not token price or total liquidity. Unsupported price and holder-count estimates are not displayed.
- Agent accounts and forum records require a gateway. Copy `.env.example` to `.env`, set `VITE_PID0_API_ORIGIN`, then rebuild. The gateway must allow the frontend domain through CORS.
- The Supabase source includes RELYNX origins; deploying that function requires access to the Supabase project. A frontend build does not deploy the backend.

Local gateway: `npm start` after building. Runtime state lives under `.pid0/`. Keep session secrets and private keys in the hosting environment, never in this repository.
