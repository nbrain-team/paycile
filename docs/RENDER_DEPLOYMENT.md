# Render Deployment Guide for Paycile

## 🚀 Quick Deployment Using Blueprint (Recommended)

### Step 1: Prepare Your Repository
```bash
# Commit and push the render.yaml file
git add render.yaml
git commit -m "Add Render blueprint configuration"
git push origin main
```

### Step 2: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repo: `https://github.com/nbrain-team/paycile`
4. Click **"Apply"**
5. Render will create all services automatically

### Step 3: Update Environment Variables
After deployment, you'll need to update the URLs:

1. **Find your service URLs** (they'll look like):
   - Backend: `https://paycile-api-xxxx.onrender.com`
   - Frontend: `https://paycile-frontend-xxxx.onrender.com`

2. **Update Backend Environment Variables:**
   - Go to Backend service → Environment
   - Update `FRONTEND_URL` with your actual frontend URL
   - Add `OPENAI_API_KEY` with your OpenAI API key

3. **Update Frontend Environment Variables:**
   - Go to Frontend service → Environment
   - Update `VITE_API_URL` with your actual backend URL
   - Redeploy the frontend after updating

### Step 4: Initialize Database
1. Go to your PostgreSQL database in Render
2. Click on "Connect" → "External Connection"
3. Copy the external database URL
4. Run these commands locally:

```bash
# Initialize schema
psql "your-external-database-url" -f database/schema.sql

# Load seed data
psql "your-external-database-url" -f database/seed.sql
```

## 🔧 Manual Deployment (Alternative)

If you prefer to set up services individually:

### 1. Create PostgreSQL Database
- New → PostgreSQL
- Name: `paycile-db`
- Region: Oregon
- Plan: Starter

### 2. Create Backend Service
- New → Web Service
- Connect repo, set root directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables:
  ```
  NODE_ENV=production
  DATABASE_URL=[Internal Database URL from step 1]
  JWT_SECRET=[Click Generate]
  PORT=3001
  OPENAI_API_KEY=[Your OpenAI API Key]
  FRONTEND_URL=[Will add after frontend deployment]
  ```

### 3. Create Frontend Service
- New → Static Site
- Connect repo, set root directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  ```
  VITE_API_URL=[Backend URL from step 2]
  ```
- Add Rewrite Rule: `/* → /index.html`

### 4. Update Cross-Service URLs
- Go back to Backend → Environment
- Update `FRONTEND_URL` with Frontend URL
- Redeploy both services

## 🔑 Environment Variables Summary

### Backend (.env)
```env
NODE_ENV=production
DATABASE_URL=postgresql://[from-render]
JWT_SECRET=[generated-by-render]
PORT=3001
OPENAI_API_KEY=sk-[your-openai-key]
FRONTEND_URL=https://[your-frontend].onrender.com
```

### Frontend
```env
VITE_API_URL=https://[your-backend].onrender.com
```

## 📝 Post-Deployment Checklist

- [ ] Database schema initialized
- [ ] Seed data loaded
- [ ] Backend health check: `https://[backend-url]/health`
- [ ] Frontend loads properly
- [ ] Login works with test credentials
- [ ] API calls from frontend work

## 🧪 Test Credentials

After seeding the database:
- **Admin:** admin@paycile.com / password123
- **Agent:** john.agent@paycile.com / password123
- **Client:** client1@example.com / password123

## 🛠️ Troubleshooting

### Frontend can't connect to backend
- Check VITE_API_URL is set correctly
- Ensure it starts with `https://`
- Redeploy frontend after changing env vars

### Database connection errors
- Verify DATABASE_URL is using internal connection
- Check database is in same region as backend

### Build failures
- Check Node version (should be 18+)
- Verify all dependencies are in package.json
- Check build logs for specific errors

## 🔄 Updates and Redeployment

Render auto-deploys on git push. To manually redeploy:
1. Go to service dashboard
2. Click "Manual Deploy" → "Deploy latest commit"

## 📊 Monitoring

- View logs: Service → Logs
- Check metrics: Service → Metrics
- Set up alerts: Settings → Notifications 