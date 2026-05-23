# Deployment

## Pre-Deployment Checklist

Run these checks before publishing:

```bash
npm install
npm run build
```

Confirm:

- The app builds without errors.
- `.env.local` is not committed.
- `.env.example` contains only safe placeholder values.
- Screenshots are added under `docs/screenshots/` if this is for a portfolio showcase.
- The README links point to the deployed URL and repository URL.

## Environment Variables

The app works without environment variables for the local MVP. Optional Supabase sync uses:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only configure these in the hosting provider if Supabase-backed features are enabled.

## Deploying To Vercel

1. Push the repository to GitHub.
2. Open Vercel and import the GitHub repository.
3. Keep the default Vite configuration:
   - Framework preset: `Vite`
   - Install command: `npm install`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables if using Supabase.
5. Deploy.

## Deploying To Netlify

1. Create a new Netlify project from the GitHub repository.
2. Use:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add Supabase environment variables only if needed.
4. Deploy.

## Deploying To Any Static Host

```bash
npm run build
```

Upload the `dist/` folder to any static hosting provider.

## Portfolio Launch Notes

- Replace placeholder screenshot paths in `README.md` with real images.
- Add the live URL near the top of the README after deployment.
- Keep the MVP scope focused: curriculum, SQL practice, roadmap, projects, and interview prep.
- Avoid adding new features during deployment cleanup.
