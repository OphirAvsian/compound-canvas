# Compound Canvas

Compound Canvas is a browser-first educational drug-discovery workspace for
students with no prior computational chemistry experience. Phase 1 provides a
real molecule-to-3D workflow while clearly separating calculated results from
curated lessons and capabilities that have not been implemented.

## Phase 1 milestone

Phase 1 turns a student's editable 2D chemical structure into real,
coordinate-backed molecular data:

1. Edit a molecule in the embedded Ketcher structure editor.
2. Export its chemical graph as SMILES and Molfile data.
3. Send the structure to the FastAPI/RDKit service.
4. Generate one deterministic ETKDGv3 conformer with explicit hydrogens.
5. Minimize the conformer with MMFF94, falling back to UFF when required.
6. Render the returned SDF coordinates interactively in Mol*.
7. Inspect formula, molecular weight, cLogP, hydrogen-bond counts, and
   rotatable bonds.

The interface includes beginner guidance, backend readiness reporting, useful
loading and error states, retry behavior, and a warning whenever molecule edits
make the visible 3D result outdated.

### Scientific honesty

**Calculated from the student's molecule**

- Ketcher molecular graph and SMILES/Molfile export
- RDKit ETKDGv3 3D coordinate generation
- Explicit hydrogen addition and MMFF94 or UFF minimization
- Molecular descriptors returned by RDKit
- Mol* visualization of the exact returned SDF coordinates

**Educational only**

- The current EGFR protein graphic
- Curated residue and active-site explanations

**Not implemented**

- Coordinate-backed protein loading or preparation
- Automated active-site detection
- Ligand protonation and tautomer enumeration
- Docking poses, scores, or protein-ligand interactions
- Project persistence, molecule comparison, reports, and sharing

One generated conformer is a plausible starting geometry, not proof of the
molecule's preferred shape in solution or when bound to a protein. Force-field
energy is not a docking score. Unimplemented API routes return
`501 Not Implemented` and never return fabricated scientific evidence.

### Phase 1 architecture

- Next.js, React, TypeScript, and Tailwind CSS
- Ketcher for browser-based molecular editing
- FastAPI and RDKit for molecular validation and conformer generation
- Mol* for coordinate-backed 3D ligand visualization
- Docker Compose for the local scientific service boundary
- Vitest and pytest coverage for frontend API behavior and RDKit generation

### Verification

- Next.js production build passes
- TypeScript type checking passes
- Frontend unit tests pass
- RDKit and FastAPI tests pass
- Aspirin and the guided starting molecule generate real SDF coordinates
- End-to-end browser verification confirms the FastAPI response renders in Mol*

### Next milestone

Phase 2 begins with a real protein workspace: PDB/mmCIF loading in Mol*,
coordinate-backed residue inspection, and a curated active-site lesson based on
actual experimental structure coordinates. Docking remains out of scope until
protein and ligand preparation are scientifically explicit.

## Local development

```bash
npm install
docker compose up --build api
```

In another terminal:

```bash
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
npm run dev
```

Open `http://localhost:3000`. Verify the API independently at:

```text
http://127.0.0.1:8000/health
http://127.0.0.1:8000/ready
```

The API container honors Railway's `PORT` environment variable and defaults to
port `8000` locally.

## Public deployment: Vercel + Railway

The production architecture uses Vercel for Next.js and Railway for the
FastAPI/RDKit Docker service.

### Railway backend

1. Create a Railway service from this GitHub repository.
2. Set the service root directory to `/api`.
3. Deploy with `api/Dockerfile`.
4. Set the health-check path to `/health`.
5. Keep Railway's generated `PORT`; the image reads it automatically.
6. Optionally add `api.compoundcanvas.com` as a custom domain.

Recommended Railway variables:

```text
CC_CORS_ORIGINS=["https://compound-canvas.vercel.app","https://compoundcanvas.com","https://www.compoundcanvas.com"]
CC_MAX_REQUEST_BYTES=131072
CC_RATE_LIMIT_REQUESTS=20
CC_RATE_LIMIT_WINDOW_SECONDS=60
CC_CONFORMER_TIMEOUT_SECONDS=20
CC_CONFORMER_MAX_CONCURRENCY=2
CC_TRUST_PROXY_HEADERS=true
```

### Vercel frontend

Set this Vercel production environment variable to the Railway HTTPS URL:

```text
NEXT_PUBLIC_API_URL=https://api.compoundcanvas.com
```

Redeploy the frontend after changing it because `NEXT_PUBLIC_API_URL` is
embedded at build time.

### Public API safeguards

- Exact-origin CORS allowlist
- 128 KiB conformer request limit
- Per-IP fixed-window rate limit
- Two concurrent RDKit calculations per process
- 20-second server response deadline
- Request IDs and JSON request logs
- Railway-compatible liveness and readiness endpoints

Rate and concurrency limits are process-local. They are appropriate for one
Railway replica used for friend testing; a shared limiter and durable queue are
required before horizontal scaling or docking.

## Product architecture

- `app/`: Next.js guided learning experience
- `api/app/main.py`: FastAPI molecule API and explicit unavailable-feature responses
- `api/app/middleware.py`: request limits, rate limiting, request IDs, and logs
- `api/app/services/execution.py`: bounded RDKit execution and timeout boundary
- `api/app/worker.py`: reserved, unused boundary for future scientific workloads
- `docker-compose.yml`: web, API, worker, PostgreSQL, and Redis

Scientific tools should run in isolated worker images. Their raw outputs should
be converted into interaction evidence and beginner-friendly explanations
before reaching the web client.

Vercel hosts only the Next.js frontend. RDKit runs in the separate Railway
container.
