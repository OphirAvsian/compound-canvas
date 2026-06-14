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

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy the public prototype

The Next.js learning experience is ready for Vercel Hobby with no environment
variables. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the exact CLI and GitHub
deployment paths, verification checklist, and backend limitations.

The API can be run separately:

```bash
cd api
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The molecule API requires RDKit. The supported path is the API container or a
Python environment capable of installing the `api/requirements.txt` packages.
The browser never generates replacement coordinates when that service is
offline.

For the complete local stack:

```bash
docker compose up --build
```

## Product architecture

- `app/`: Next.js guided learning experience
- `api/app/main.py`: FastAPI molecule API and explicit unavailable-feature responses
- `api/app/worker.py`: Reserved Celery boundary for future scientific workloads
- `docker-compose.yml`: web, API, worker, PostgreSQL, and Redis

Scientific tools should run in isolated worker images. Their raw outputs should
be converted into interaction evidence and beginner-friendly explanations
before reaching the web client.

The FastAPI/RDKit service is not deployed on Vercel. Vercel hosts only the
Next.js frontend; conformer generation requires the separate backend.
