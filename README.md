# BridgeAI

BridgeAI is an early prototype for making complex public notices easier to
understand. The current screen only checks pasted text for a character limit.
It does not explain or verify notices, contact public services, or save or send
the text.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

In one terminal, start the frontend:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal. In a second terminal,
start the backend:

```sh
npm run dev:server
```

The backend health check is available at
`http://localhost:3000/api/health`. For example:

```sh
curl http://localhost:3000/api/health
```

It returns `{"status":"ok"}` when the backend is running. Set `PORT` to use
another local port, such as `PORT=4000 npm run dev:server`.

## Available commands

- `npm run dev` starts the local development server.
- `npm run dev:server` starts the local Express backend.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves that build locally.
- `npm run lint` checks the JavaScript source.

This is not a production service. Do not paste personal or sensitive
information into the prototype. No analysis, external verification, or data
persistence is implemented yet.
