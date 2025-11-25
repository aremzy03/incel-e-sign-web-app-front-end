# Deployment Guide - Render

This guide walks you through deploying the INCEL E-Sign frontend application to Render.

## Prerequisites

- A Render account (sign up at [render.com](https://render.com))
- Your backend API URL (if deploying backend separately)
- Git repository with your code (GitHub, GitLab, or Bitbucket)

## Quick Start

1. **Connect Repository**
   - Log in to Render dashboard
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Select this repository

2. **Configure Service**
   - **Name:** `incel-esign-frontend` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your production branch)
   - **Root Directory:** Leave empty (or specify if in subdirectory)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter (free tier) or higher

3. **Environment Variables**
   Set the following in Render dashboard → Environment:

   **Required:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-backend-api.com/api
   NEXTAUTH_SECRET=<generate-secret-here>
   NEXTAUTH_URL=https://your-app.onrender.com
   ```

   **Optional:**
   ```
   ALLOWED_ORIGINS=https://your-app.onrender.com,https://www.your-domain.com
   HEALTH_CHECK_BACKEND=false
   ENABLE_LOGGING=false
   ```

4. **Health Check**
   - **Health Check Path:** `/api/health`
   - Render will automatically monitor this endpoint

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your application
   - First deployment may take 5-10 minutes

## Environment Variables Setup

### Generating NEXTAUTH_SECRET

Generate a secure secret using one of these methods:

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Using Render Dashboard:**
- Render can auto-generate secrets
- Go to Environment → Add Environment Variable
- Use "Generate" option for NEXTAUTH_SECRET

### Setting NEXTAUTH_URL

After your first deployment, Render will provide a URL like:
```
https://incel-esign-frontend.onrender.com
```

Update the `NEXTAUTH_URL` environment variable with this exact URL (including `https://`).

### Setting NEXT_PUBLIC_API_URL

Point this to your backend API:
- If backend is on Render: `https://your-backend-service.onrender.com/api`
- If backend is elsewhere: `https://api.yourdomain.com/api`
- For local development: `http://localhost:8000/api`

### Setting ALLOWED_ORIGINS

For production, set this to your frontend URL(s):
```
ALLOWED_ORIGINS=https://your-app.onrender.com
```

For multiple origins (e.g., with custom domain):
```
ALLOWED_ORIGINS=https://your-app.onrender.com,https://www.yourdomain.com
```

## Using render.yaml (Alternative Method)

If you prefer configuration as code:

1. The `render.yaml` file is already configured in the repository
2. In Render dashboard, go to "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect and use `render.yaml`
5. You'll still need to set environment variables in the dashboard

## Custom Domain Setup

1. In Render dashboard, go to your service → Settings
2. Click "Add Custom Domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Update `NEXTAUTH_URL` and `ALLOWED_ORIGINS` with your custom domain

## Health Check Configuration

The application includes a health check endpoint at `/api/health`:

- **Basic Check:** Returns service status
- **Backend Check:** Set `HEALTH_CHECK_BACKEND=true` to also verify backend connectivity

Render automatically monitors this endpoint. If it returns non-200 status, Render will restart the service.

## Build and Deployment

### Build Process

1. Render installs dependencies: `npm install`
2. Runs build: `npm run build`
3. Starts production server: `npm start`

### Build Time

- First build: ~5-10 minutes
- Subsequent builds: ~3-5 minutes (with caching)

### Build Logs

Monitor build progress in Render dashboard:
- Go to your service → Logs
- Watch for build errors or warnings
- Common issues:
  - Missing environment variables
  - Build timeout (increase if needed)
  - Memory issues (upgrade plan)

## Post-Deployment Verification

After deployment, verify:

1. **Health Endpoint**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Homepage**
   - Visit `https://your-app.onrender.com`
   - Should load without errors

3. **Authentication**
   - Test login flow
   - Verify session management

4. **API Connectivity**
   - Test API calls from frontend
   - Check browser console for errors

5. **Static Assets**
   - Verify images, fonts, and PDF worker load
   - Check Network tab in browser DevTools

6. **Security Headers**
   - Use [SecurityHeaders.com](https://securityheaders.com) to verify
   - Should see A+ rating with proper headers

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Ensure all required env vars are set in Render dashboard

**Error: Build timeout**
- Solution: Upgrade to a higher plan or optimize build process

**Error: Out of memory**
- Solution: Upgrade plan or optimize dependencies

### Application Crashes

**Check logs:**
- Render dashboard → Service → Logs
- Look for error messages

**Common issues:**
- Invalid `NEXTAUTH_SECRET` format
- Incorrect `NEXTAUTH_URL` (must match deployed URL exactly)
- Backend API unreachable
- Missing environment variables

### Health Check Fails

**Verify endpoint:**
```bash
curl https://your-app.onrender.com/api/health
```

**If 404:**
- Check health check path is set to `/api/health`
- Verify route exists in codebase

**If 500:**
- Check application logs
- Verify environment variables are set correctly

### Slow Performance

**Render Free Tier:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Consider upgrading to paid plan for always-on service

**Optimizations:**
- Enable compression (already configured)
- Use CDN for static assets
- Optimize bundle size (use `npm run analyze`)

## Auto-Deploy Configuration

Render supports auto-deployment from Git:

1. **Automatic Deploys:**
   - Enabled by default
   - Deploys on push to connected branch
   - Can disable in Settings → Auto-Deploy

2. **Manual Deploys:**
   - Go to Manual Deploy → Deploy latest commit
   - Useful for testing before enabling auto-deploy

3. **Deploy Hooks:**
   - Can trigger deployments via webhooks
   - Useful for CI/CD integration

## Monitoring and Logs

### Viewing Logs

1. **Real-time Logs:**
   - Render dashboard → Service → Logs
   - Shows live application output

2. **Build Logs:**
   - Available during build process
   - Saved for 7 days (free tier)

3. **Metrics:**
   - CPU and memory usage
   - Request count and latency
   - Available in dashboard

### Setting Up Alerts

1. Go to Service → Alerts
2. Configure email/Slack notifications
3. Set thresholds for:
   - Health check failures
   - High error rates
   - Resource usage

## Cost Considerations

### Free Tier Limitations

- **Spins down** after 15 minutes inactivity
- **750 hours/month** total runtime
- **512 MB RAM**
- **Build timeouts** may occur on large builds

### Paid Plans

- **Starter:** $7/month - Always on, 512 MB RAM
- **Standard:** $25/month - 2 GB RAM, better performance
- **Pro:** Custom pricing - Higher limits, better support

## Security Best Practices

1. **Environment Variables:**
   - Never commit secrets to Git
   - Use Render's secure environment variable storage
   - Rotate secrets regularly

2. **HTTPS:**
   - Enabled by default on Render
   - Custom domains automatically get SSL

3. **CORS:**
   - Set `ALLOWED_ORIGINS` to specific domains
   - Don't use wildcard (`*`) in production

4. **Security Headers:**
   - Already configured in `next.config.js`
   - Verify with SecurityHeaders.com

## Rollback

If deployment fails:

1. Go to Service → Events
2. Find previous successful deployment
3. Click "Rollback to this deploy"
4. Service will revert to previous version

## Support

- **Render Documentation:** [render.com/docs](https://render.com/docs)
- **Render Support:** Available in dashboard
- **Application Issues:** Check logs and error messages

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up staging environment (optional)
4. Configure CI/CD pipeline (optional)
5. Set up database/backend services (if needed)

---

**Last Updated:** 2024
**Render Platform:** Web Service
**Node.js Version:** 20.x LTS

