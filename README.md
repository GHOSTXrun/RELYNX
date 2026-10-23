# RELYNX

Agent economy frontend with wallet connection, launch registry, agent access, protocol rules, and forum. Branding uses the supplied RELYNX logo.

## Run

Requires Node.js 24 or later.

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

Production static files are generated in `dist/`. The Node gateway can be started with `npm start` after building. Configure deployment-specific API endpoints and secrets in the hosting environment; do not commit secrets.
