# MealDrama Deployment Checklist

## Pre-Flight

- [ ] `npm run validate-env` passes
- [ ] `npm test` passes (all tests green)
- [ ] `npm run build` succeeds with no errors
- [ ] `.env.production` matches `.env.example` (no missing keys)
- [ ] All secrets configured in deployment platform (Vercel dashboard → Environment Variables):
  - `VITE_API_URL` → production backend URL
- [ ] `vercel.json` rewrites are in place for client-side routing
- [ ] Git branch is `main` and up-to-date with `origin/main`
- [ ] No uncommitted changes (`git status` is clean)

## Deploy

```bash
# Vercel CLI (requires login)
vercel --prod

# Or: push to main → GitHub Actions builds → Vercel auto-deploys from main branch
git push origin main
```

## Post-Deploy

- [ ] Navigate to deployed URL → app loads without 404
- [ ] Hard refresh on a sub-route (e.g., `/plan`, `/pulse`) → SPA routing serves correctly
- [ ] API calls reach the backend (`VITE_API_URL` resolves)
- [ ] Environment variables are injected (check browser DevTools → `import.meta.env.VITE_API_URL`)
- [ ] Assets load with correct cache headers (immutable for hashed files)
- [ ] OfflineBanner shows when backend is unreachable
- [ ] ErrorBoundary catches any runtime errors

## Rollback

```bash
# Vercel CLI: list deployments, find the previous stable one
vercel list
# Promote the previous deployment
vercel promote <deployment-url-or-id> --yes

# Git revert (if code change caused the issue)
git revert HEAD
git push origin main
```

## Environment Variable Rotation

1. Update the value in Vercel dashboard → Settings → Environment Variables
2. Trigger a new deployment (push to main or `vercel --prod`)
3. Verify new env var is picked up in the build logs
4. Test the affected feature

## Branch Protection Rules (GitHub)

Configure in repository Settings → Branches → Add rule for `main`:

- [ ] Require pull request before merging
- [ ] Require status checks to pass before merging (`CI / build`)
- [ ] Require branches to be up-to-date
- [ ] Do not allow bypassing the above settings
