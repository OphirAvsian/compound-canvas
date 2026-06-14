# Deploy Compound Canvas to Vercel

## What this deployment includes

The Vercel deployment publishes the interactive Next.js learning experience.
Ketcher and Mol* run in the browser, but real RDKit conformer generation
requires a separately hosted FastAPI service and a `NEXT_PUBLIC_API_URL`
pointing to its public HTTPS URL.

Vercel does not run the `api/` container, Celery worker, PostgreSQL, Redis, or
Docker Compose stack as part of this frontend project. RDKit and future
Vina/Gnina jobs belong on a separate compute host.

## Pre-deployment checklist

- [x] Next.js production build succeeds
- [x] TypeScript checking succeeds
- [x] Homepage is statically generated
- [ ] Public FastAPI/RDKit service deployed
- [ ] `NEXT_PUBLIC_API_URL` configured in Vercel
- [x] Container backend excluded from the Vercel frontend upload
- [x] Vercel-compatible `next build` command
- [x] Node.js 24 declared
- [x] `.vercel` and local environment files ignored
- [ ] Create or sign in to a Vercel Hobby account
- [ ] Deploy using the CLI or connect a Git repository
- [ ] Open the generated `*.vercel.app` URL in a private browser window
- [ ] Test analog selection, residue inspection, and docking completion
- [ ] Share the production URL with testers

## Fastest path: Vercel CLI

Run these commands from the repository root:

```powershell
npx vercel@latest login
npx vercel@latest --prod
```

For the setup questions:

1. Set up and deploy: `Y`
2. Scope: choose your personal account
3. Link to existing project: `N`
4. Project name: `compound-canvas`
5. Code directory: `./`
6. Override detected settings: `N`

Vercel detects Next.js, runs `npm install` and `npm run build`, then prints a
production URL similar to:

```text
https://compound-canvas.vercel.app
```

If that exact project name is taken, Vercel adds a suffix. The URL printed after
`Production:` is the one to share.

## Recommended path: GitHub automatic deployments

1. Create an empty GitHub repository named `compound-canvas`.
2. Initialize and push this folder:

```powershell
git init
git add .
git commit -m "Initial Compound Canvas MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/compound-canvas.git
git push -u origin main
```

3. Open <https://vercel.com/new>.
4. Import the `compound-canvas` GitHub repository.
5. Keep Framework Preset as `Next.js`.
6. Keep Root Directory as `./`.
7. Set `NEXT_PUBLIC_API_URL` to the public HTTPS URL of the FastAPI service.
8. Select the Hobby plan and click Deploy.

Every push to `main` then updates the production URL. Other branches and pull
requests receive separate preview URLs.

## Post-deployment smoke test

1. Open the production URL in a private window.
2. Confirm the page title says Compound Canvas.
3. Confirm the header reports `RDKit online`.
4. Generate a 3D conformer and confirm Mol* renders the returned molecule.
5. Confirm protein and docking content is clearly labeled illustrative or
   unavailable.
6. Confirm the page remains usable at phone and desktop widths.

## Free-tier note

Vercel Hobby is appropriate for personal, non-commercial testing. It is not the
right runtime for long scientific docking jobs: Hobby functions have limited
execution duration, while Celery/Vina/Gnina jobs need durable worker compute.
