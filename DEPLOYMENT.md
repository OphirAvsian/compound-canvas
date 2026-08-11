# Deploy Compound Canvas to Vercel and Render

## Architecture

```text
Browser
  -> Vercel: Next.js, Ketcher, Mol*
  -> Render: FastAPI and RDKit Docker container
```

PostgreSQL, Redis, Celery, docking, and project persistence are not part of this
deployment.

## 1. Deploy the Render backend

Use the root `render.yaml` blueprint, or create the service manually with the
same settings:

1. Create a new Render Web Service from `OphirAvsian/compound-canvas`.
2. Select Docker runtime.
3. Set root directory to `api`.
4. Set Dockerfile path to `./Dockerfile`.
5. Set health-check path to `/health`.
6. Use the free instance type for testing.
7. Set the production variables shown below.
8. Confirm both `/health` and `/ready` return HTTP 200.

The container starts Uvicorn on Render's provided `PORT`. Do not set `PORT`
manually and do not deploy the PostgreSQL, Redis, or worker services from
`docker-compose.yml`.

Required Render variables:

```text
CC_CORS_ORIGINS=["https://compound-canvas.vercel.app","https://compoundcanvas.com","https://www.compoundcanvas.com"]
CC_MAX_REQUEST_BYTES=131072
CC_RATE_LIMIT_REQUESTS=20
CC_RATE_LIMIT_WINDOW_SECONDS=60
CC_CONFORMER_TIMEOUT_SECONDS=20
CC_CONFORMER_MAX_CONCURRENCY=2
CC_TRUST_PROXY_HEADERS=true
```

## 2. Connect the Vercel frontend

1. Open the existing Compound Canvas project in Vercel.
2. Set `NEXT_PUBLIC_API_URL` to the verified Render HTTPS domain.
3. Redeploy production.
4. If using a custom domain, add it to Vercel and add the matching exact origin
   to `CC_CORS_ORIGINS` on Render.

## Post-deployment smoke test

1. Open the production URL in a private window.
2. Confirm the page title says Compound Canvas.
3. Confirm the header reports `RDKit online`.
4. Generate aspirin or caffeine and confirm Mol* renders the returned SDF.
5. Confirm invalid chemistry produces a readable validation error.
6. Confirm repeated rapid requests eventually receive HTTP 429.
7. Confirm protein and docking content remains labeled illustrative or
   unavailable.

## Operational notes

- Use one Render instance for the current process-local rate and concurrency
  controls.
- Monitor `/health`; use `/ready` when checking application readiness.
- Free Render services can sleep after inactivity. The first request after
  sleeping may be slow.
- Request IDs are returned in `X-Request-ID` and included in JSON logs.
- Docking can be slower than conformer generation. Keep one web service for
  limited testing and monitor timeouts before broader sharing.
