# Deployment Playbook — Railway + Vercel on Replit

A reference guide for deploying monorepo projects with a Railway API backend and Vercel frontend, built in Replit's pnpm workspace.

---

## Stack Overview

| Layer | Platform | Notes |
|-------|----------|-------|
| Frontend | Vercel | Auto-deploys from GitHub `main` |
| Backend API | Railway | Express + Node 18, triggered via GitHub or GraphQL |
| Repo | GitHub | Connected via Replit GitHub integration |
| DNS | Registrar (e.g. Squarespace) | A + CNAME records pointing to Vercel |

---

## Credentials & Tokens

Store these as Replit secrets (never hardcode):
- `RAILWAY_TOKEN` — from Railway dashboard → Account → Tokens
- `VERCEL_TOKEN` — from Vercel dashboard → Settings → Tokens

In `code_execution`, they're available as `RAILWAY_TOKEN` and `VERCEL_TOKEN` after loading from secrets via the environment-secrets skill.

---

## Railway

### Key IDs to note for each project
```
Project ID:     (from Railway URL or GraphQL)
Environment ID: (usually "production")
Service ID:     (the specific service)
```

Find them via GraphQL:
```js
{ projects { edges { node { id name environments { edges { node { id name services { edges { node { id name } } } } } } } } } }
```

### Trigger a redeploy
```js
fetch("https://backboard.railway.app/graphql/v2", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${RAILWAY_TOKEN}` },
  body: JSON.stringify({
    query: `mutation { environmentTriggersDeploy(input: {
      projectId: "YOUR_PROJECT_ID"
      environmentId: "YOUR_ENV_ID"
      serviceId: "YOUR_SERVICE_ID"
    }) }`
  })
});
```

### Poll deployment status
```js
{ deployments(input: { projectId: "..." serviceId: "..." environmentId: "..." }) {
    edges { node { id status } }
} }
// States: BUILDING → DEPLOYING → SUCCESS | FAILED | CRASHED
```
Poll every 15–20 seconds. Typical build takes 2–4 minutes.

### Get build logs for a failed deploy
```js
{ buildLogs(deploymentId: "FAILED_DEPLOY_ID" limit: 60) { message timestamp } }
```

### Read current env vars
```js
{ variables(projectId: "..." environmentId: "..." serviceId: "...") }
```

### Upsert a single env var (service level)
```js
mutation { variableUpsert(input: {
  projectId: "..."
  environmentId: "..."
  serviceId: "..."
  name: "VAR_NAME"
  value: "new-value"
}) }
```
**Always redeploy after changing env vars** — they don't hot-reload.

---

## Railway Build Gotchas

### 1. `esbuild` (or any build tool) must be in `dependencies`, not `devDependencies`
Railway sets `NODE_ENV=production` during install, which causes pnpm to **skip devDependencies entirely**. Any package used at build time must be in `dependencies`.

**Symptom:** `ERR_MODULE_NOT_FOUND: Cannot find package 'esbuild'`

**Fix in `package.json`:**
```json
{
  "dependencies": {
    "esbuild": "0.27.3"
  }
}
```

### 2. Use CJS bundle format, not ESM — externalize runtime deps
ESM esbuild bundles + pino-http cause Express sub-router mounting to silently fail on Railway's Node 18/22 runtime. All `/api/*` routes return 404 even though the server starts fine.

**`build.mjs` config that works:**
```js
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",                          // NOT "esm"
  outExtension: { ".js": ".cjs" },
  outdir: "dist",
  external: [                             // load from node_modules at runtime
    "express", "cors", "pino", "pino-http",
    "pino-pretty", "thread-stream",
    "*.node"
  ],
  sourcemap: true,
});
```

**`railway.toml`:**
```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install --no-frozen-lockfile && pnpm --filter @workspace/api-server build"

[deploy]
startCommand = "node --enable-source-maps artifacts/api-server/dist/index.cjs"
healthcheckPath = "/api/health"
healthcheckTimeout = 120
restartPolicyType = "on_failure"
```

### 3. Mount the health check directly on `app`, not in a sub-router
Railway's health check polls `/api/health`. Even with the CJS fix, sub-router path matching can silently fail for this route. Mount it directly:

```ts
// app.ts — do this BEFORE app.use("/api", router)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", router);
```

### 4. CORS — always include all domains
When you add a custom domain, add it to `CORS_ORIGIN` on Railway **and** redeploy. Use a comma-separated string. Also add a hardcoded fallback in code so it works even if the env var is misconfigured:

```ts
// app.ts
const DEFAULT_ORIGINS = [
  "https://yourapp.com",
  "https://www.yourapp.com",
  "https://yourapp.vercel.app",
];

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : DEFAULT_ORIGINS;

app.use(cors({ origin: corsOrigins, credentials: true }));
```

**Symptom of CORS misconfiguration:** API works on `yourapp.vercel.app` but not on `yourapp.com`. Browser network tab shows no `Access-Control-Allow-Origin` header on the response.

---

## Vercel

### Key IDs
```
Project ID: prj_XXXX  (from Vercel dashboard URL or API)
```

### Check latest deployment
```js
fetch(`https://api.vercel.com/v6/deployments?projectId=prj_XXX&limit=1`, {
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
})
// states: BUILDING → READY | ERROR | CANCELED
```

### Add/update an env var
```js
// Add new
fetch(`https://api.vercel.com/v10/projects/prj_XXX/env`, {
  method: "POST",
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    key: "VITE_API_BASE_URL",
    value: "https://your-api.railway.app",
    target: ["production", "preview"],
    type: "plain"
  })
});
```
**VITE_ vars are baked into the bundle at build time.** Changing them requires a Vercel redeploy.

### Add a custom domain to a Vercel project
```js
fetch(`https://api.vercel.com/v10/projects/prj_XXX/domains`, {
  method: "POST",
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ name: "yourapp.com" })
});
```

### Check if a domain is verified
```js
fetch(`https://api.vercel.com/v6/domains/yourapp.com/config`, {
  headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
})
// Look for: misconfigured: false, configuredBy: "A" or "CNAME"
```

---

## DNS Setup (for any registrar)

Point your custom domain to Vercel with these two records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| `A` | `@` (root/apex) | `76.76.21.21` | 3600 |
| `CNAME` | `www` | `cname.vercel-dns.com` | 3600 |

**For Squarespace:** Domains → your domain → DNS Settings → Custom Records. If an existing A record points to Squarespace, replace it (don't add a duplicate).

Propagation typically takes 5–30 minutes. Vercel provisions SSL automatically once DNS resolves.

---

## Frontend API URL Rule

In Vite/React frontends, **always use `VITE_API_BASE_URL` for backend calls**, never `BASE_URL`.

| Variable | What it is | Use for |
|----------|-----------|---------|
| `import.meta.env.BASE_URL` | Vite's base path (e.g. `/`) | Routing within the app |
| `import.meta.env.VITE_API_BASE_URL` | Your Railway backend URL | All `fetch()` calls to the API |

Set it in `main.tsx`:
```ts
import { setBaseUrl } from "@workspace/api-client-react";
setBaseUrl(import.meta.env.VITE_API_BASE_URL ?? null);
```

For any **manual** `fetch()` call (outside the api-client library):
```ts
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const res = await fetch(`${API_BASE}/api/your-endpoint?q=...`);
```

**Symptom of using `BASE_URL` by mistake:** Feature works on `yourapp.vercel.app` in testing but fails in production — calls go to the Vercel domain instead of Railway.

---

## Pushing Files to GitHub from Replit

Use `listConnections('github')` in `code_execution` to get a token, then push via the GitHub Contents API:

```js
const conns = await listConnections('github');
const token = conns[0].settings.access_token;
const headers = { Authorization: `Bearer ${token}`, "User-Agent": "my-agent", "Content-Type": "application/json" };

async function pushFile(path, content, message) {
  const getRes = await fetch(`https://api.github.com/repos/YOUR_ORG/YOUR_REPO/contents/${path}`, { headers });
  const { sha } = await getRes.json();
  const putRes = await fetch(`https://api.github.com/repos/YOUR_ORG/YOUR_REPO/contents/${path}`, {
    method: "PUT", headers,
    body: JSON.stringify({ message, content: Buffer.from(content).toString('base64'), sha })
  });
  const result = await putRes.json();
  return result.commit ? `✅ ${result.commit.sha.slice(0,8)}` : JSON.stringify(result);
}
```

Push files **sequentially** (not in parallel) to avoid SHA conflicts on the same repo.

---

## Vercel Build Gotchas

### Always push an updated `pnpm-lock.yaml` after any `package.json` change
Vercel runs `pnpm install --frozen-lockfile` by default. If `pnpm-lock.yaml` is out of sync with any `package.json` in the monorepo, the build fails immediately.

**Symptom:**
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" because
pnpm-lock.yaml is not up to date with artifacts/api-server/package.json

Error: Command "pnpm install --frozen-lockfile" exited with 1
```

**Fix:** Any time you change a `package.json` (add/move/remove a dependency), run `pnpm install` locally to regenerate the lockfile, then push `pnpm-lock.yaml` to GitHub along with the `package.json` change.

```bash
pnpm install --no-frozen-lockfile
# then commit and push pnpm-lock.yaml
```

This is especially easy to miss when moving a package between `dependencies` and `devDependencies` — the package doesn't get re-downloaded, but the lockfile structure changes and Vercel will reject it.

---

## Deployment Checklist — New Project

- [ ] Create Railway service, note Project/Environment/Service IDs
- [ ] Set Railway env vars: API keys, `CORS_ORIGIN`, `NODE_ENV=production`
- [ ] Ensure all build-time packages (esbuild, etc.) are in `dependencies`
- [ ] Use CJS bundle format with externalized express/pino/cors
- [ ] Mount `/api/health` directly on `app` (not sub-router)
- [ ] Set `railway.toml` buildCommand, startCommand, healthcheckPath
- [ ] Create Vercel project, note Project ID
- [ ] Set `VITE_API_BASE_URL` on Vercel pointing to Railway domain
- [ ] Add custom domains to Vercel via API
- [ ] Add DNS records at registrar (A + CNAME)
- [ ] Add all domains (custom + vercel subdomain) to `CORS_ORIGIN` on Railway
- [ ] Redeploy Railway after any env var change
- [ ] Verify: `curl -H "Origin: https://yourapp.com" https://your-api.railway.app/api/health` returns `access-control-allow-origin: https://yourapp.com`
