# RELYNX

A compact Solana workspace for SOL balances, SPL assets, recent transactions and local token drafts.

## Run

Requires Node.js 24 or later.

```sh
npm ci
npm run dev
```

The editable HTML entry is `index.source.html`. The root `index.html` and `assets/` are the published GitHub Pages build.

## Build and publish

```sh
npm run build
npm run test:data
```

The build updates `dist/` and the root static files. Commit source and generated files together. GitHub Pages serves the main branch root at `relynx.fun`.

## Solana integration

- Phantom and Solflare public-address connections, including account-change and disconnect events.
- SOL balance, SPL Token and Token-2022 accounts, and the latest five transaction signatures.
- Network slot, epoch and sampled transactions per second. Unavailable values remain unavailable.
- Exact string-based SPL token amount formatting and grouping across token accounts.
- No old EVM contract calls are used by the frontend.

Set `VITE_SOLANA_RPC_URL` in a local `.env` file to use a browser-accessible Solana mainnet RPC endpoint, then rebuild. Public RPC endpoints can rate limit requests. Do not put server credentials in a browser environment variable.

## Drafts and workflow

Token details are saved in local browser storage. Saving a draft does not create a mint, spend SOL or submit a transaction. Onchain launch support requires a selected Solana program and transaction builder.

The four-step workflow is an interactive illustration, separate from live balances. The two editable introduction graphics are `public/solana-workspace.svg` and `public/solana-flow.svg`.

## Verification

Data tests cover precise balances, duplicate account aggregation, partial RPC failures and zero TPS samples. Browser checks cover six widths, wallet connection with test responses, draft storage, keyboard dismissal and workflow selection. Real wallet transactions were not submitted.

References: [Solana token account RPC](https://solana.com/docs/rpc/http/gettokenaccountsbyowner), [SOL balance RPC](https://solana.com/docs/rpc/http/getbalance), [Phantom connections](https://docs.phantom.com/solana/establishing-a-connection).
