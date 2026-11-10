# ALNStudios Build Center

A private Next.js dashboard for browsing Minecraft Bedrock build artifacts in `AllensCreations/MCPE-Curseforges`.

## Features

- Responsive dark project library with search and category filters.
- Reads current package metadata from `builds/*/build_info.json` and source manifests.
- Displays the exact package files recorded in each build's metadata.
- Proxies downloads through a server-side GitHub API route; private repository URLs and tokens are not sent to the browser.
- No separate catalog database or manual project registration.

## Vercel project setup

1. Import `AllensCreations/MCPE-Curseforges` into Vercel.
2. Set **Root Directory** to `dashboard`.
3. Use the Next.js framework preset. Use Node.js 22 or newer.
4. Add the environment variables below to Production, Preview, and Development as appropriate.
5. In Vercel Project Settings -> Deployment Protection, enable **Vercel Authentication** for Production and Preview deployments. Keep protection enabled for every deployment environment that can access private build files.
6. Deploy only after reviewing and merging the pull request.

### Environment variables

| Name | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | Yes | Fine-grained GitHub token with read-only Contents access to this repository. Server-side only. |
| `GITHUB_OWNER` | No | Defaults to `AllensCreations`. |
| `GITHUB_REPO` | No | Defaults to `MCPE-Curseforges`. |
| `GITHUB_REF` | No | Defaults to `main`; set to a branch or tag only when intentionally previewing it. |

Never prefix the token with `NEXT_PUBLIC_`. Do not commit secrets to this repository.

## Security model

Vercel Authentication is the outer access gate. The catalog and download routes execute on the server and use `GITHUB_TOKEN` to read the private repository. Package downloads are allow-listed against the package names in the selected project's current `build_info.json`; arbitrary repository paths cannot be requested.

Do not disable Deployment Protection while this application is connected to a private repository. Vercel preview deployments must also remain protected because they use the same server-side credentials. The application deliberately does not implement its own login page; identity and access are managed by Vercel.

## Local development

From this directory:

```bash
npm install
GITHUB_TOKEN=your_read_only_token npm run dev
```

Open `http://localhost:3000`. The GitHub token is needed for the private catalog and downloads.
