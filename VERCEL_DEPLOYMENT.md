## Vercel Deployment Guide

This guide walks you through deploying the INCEL E‑Sign frontend application to **Vercel** using the GitHub integration.

---

## 1. Prerequisites

- Vercel account ([https://vercel.com](https://vercel.com))
- GitHub repository containing this project
- Backend API URL (for `NEXT_PUBLIC_API_URL`)

---

## 2. Import the Project into Vercel

1. Log in to the Vercel dashboard.
2. Click **New Project**.
3. Choose **Import Git Repository** and select this repo.
4. Select the branch you want to deploy from (typically `main`).

Vercel should automatically detect **Next.js** as the framework.

---

## 3. Build & Output Settings

You can generally accept the defaults:

- **Framework Preset**: `Next.js`
- **Build Command**: `npm run build`
- **Install Command**: `npm install` (or your preferred package manager)
- **Output Directory**: `.next` (Next.js default)

No custom `dist` or `out` folder is required; do **not** change the output directory.

---

## 4. Configure Environment Variables

In Vercel → **Project** → **Settings** → **Environment Variables**, add:

```env
# NextAuth configuration
NEXTAUTH_URL=https://your-project-name.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Backend API URL
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api

# Optional configuration
ALLOWED_ORIGINS=https://your-project-name.vercel.app
HEALTH_CHECK_BACKEND=false
ENABLE_LOGGING=false
```

### 4.1. Generating `NEXTAUTH_SECRET`

Use one of:

```bash
openssl rand -base64 32
```

or:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Paste the value into the **NEXTAUTH_SECRET** field in Vercel.

### 4.2. Environment Scopes

Vercel supports separate values per environment:

- **Development** – used for `vercel dev` and local previews.
- **Preview** – for preview deployments from non‑main branches.
- **Production** – for the main branch deployment.

At a minimum, set the variables for **Production**. You can reuse the same values for **Preview** if desired.

---

## 5. Deploy

1. After configuring environment variables, click **Deploy**.
2. Vercel will:
   - Install dependencies (`npm install`)
   - Build the app (`npm run build`)
   - Host it on a URL like `https://your-project-name.vercel.app`

Subsequent pushes to the configured branch will trigger automatic deployments.

---

## 6. Custom Domain (Optional)

1. In Vercel → **Project** → **Domains**, click **Add**.
2. Enter your custom domain (e.g. `app.yourdomain.com`).
3. Follow the DNS instructions Vercel provides.
4. Once the domain is active:
   - Update `NEXTAUTH_URL` to use your custom domain.
   - Optionally update `ALLOWED_ORIGINS` to include the custom domain.

---

## 7. Health Check & Monitoring

This frontend exposes a simple health endpoint at:

- `GET /api/health`

You can use this endpoint in your monitoring system (or Vercel’s checks / external uptime monitors) to validate that the frontend is responding.

For backend health checks, set `HEALTH_CHECK_BACKEND=true` and ensure the backend URL in `NEXT_PUBLIC_API_URL` is reachable from the Vercel runtime.

---

## 8. Troubleshooting

- **Build fails locally**: run `npm run build` and fix issues before deploying.
- **Missing environment variables**: confirm they are set for the correct environment scope in Vercel.
- **Auth callback issues**:
  - Ensure `NEXTAUTH_URL` matches the deployed URL exactly (including `https://`).
  - Verify your NextAuth provider configuration on the backend.
- **CORS issues**:
  - Check `ALLOWED_ORIGINS` includes your Vercel / custom domain.

For more general deploy troubleshooting guidance, see Vercel’s docs: [https://vercel.com/docs](https://vercel.com/docs).



