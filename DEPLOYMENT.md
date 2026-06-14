# Deploy Compound Canvas to Vercel and Railway

## Architecture

```text
Browser
  -> Vercel: Next.js, Ketcher, Mol*
  -> Railway: FastAPI and RDKit Docker container
```

PostgreSQL, Redis, Celery, docking, and project persistence are not part of this
deployment.

## 1. Deploy the Railway backend

1. Create a Railway project from `OphirAvsian/compound-canvas`.
2. Create one service with root directory `/api`.
3. Railway detects `api/Dockerfile`.
4. Set health-check path `/health`.
5. Generate a public Railway domain.
6. Set the production variables shown in `README.md`.
7. Confirm both `/health` and `/ready` return HTTP 200.

The container starts Uvicorn on Railway's provided `PORT`. Do not deploy the
PostgreSQL, Redis, or worker services from `docker-compose.yml`.

## 2. Connect the Vercel frontend

1. Open the existing Compound Canvas project in Vercel.
2. Set `NEXT_PUBLIC_API_URL` to the Railway HTTPS domain.
3. Redeploy production.
4. If using a custom domain, add it to Vercel and add the matching exact origin
   to `CC_CORS_ORIGINS` on Railway.

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

- Use one Railway replica for the current process-local rate and concurrency
  controls.
- Monitor `/health`; use `/ready` when checking application readiness.
- Set Railway spending alerts.
- Request IDs are returned in `X-Request-ID` and included in JSON logs.
- Do not add docking to the synchronous conformer process.
