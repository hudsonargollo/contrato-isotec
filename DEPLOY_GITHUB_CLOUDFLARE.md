# 🚀 Deploy: GitHub + Cloudflare Pages

**Project:** ISOTEC Photovoltaic Contract System  
**Method:** GitHub Repository → Cloudflare Pages  
**Time:** ~10 minutes  
**Difficulty:** Easy

---

## 📋 Prerequisites

- [ ] GitHub account
- [ ] Cloudflare account
- [ ] Git installed locally
- [ ] Project ready (build passing, tests passing)

---

## Step 1: Prepare Repository (2 minutes)

### 1.1 Initialize Git (if not already done)

```bash
# Check if git is initialized
git status

# If not initialized:
git init
git add .
git commit -m "Initial commit - ISOTEC Contract System MVP"
```

### 1.2 Create .gitignore (if not exists)

Verify `.gitignore` includes:
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.vercel
.env*.local
.env.production

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Misc
*.log
.cache/
```

### 1.3 Remove sensitive data from .env.local

**IMPORTANT:** Never commit `.env.local` with real credentials!

```bash
# Verify .env.local is in .gitignore
cat .gitignore | grep .env.local

# If you accidentally committed it:
git rm --cached .env.local
git commit -m "Remove sensitive env file"
```

---

## Step 2: Push to GitHub (3 minutes)

### 2.1 Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `isotec-contract-system` (or your choice)
3. Description: "ISOTEC Photovoltaic Contract System - MVP"
4. Visibility: **Private** (recommended) or Public
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### 2.2 Push Code to GitHub

```bash
# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/isotec-contract-system.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2.3 Verify Upload

- Go to your GitHub repository
- Verify all files are there
- Check that `.env.local` is **NOT** in the repository

---

## Step 3: Configure Cloudflare Pages (5 minutes)

### 3.1 Connect Repository

1. Go to https://dash.cloudflare.com
2. Click "Workers & Pages" in sidebar
3. Click "Create application"
4. Select "Pages" tab
5. Click "Connect to Git"
6. Select "GitHub"
7. Authorize Cloudflare to access your GitHub
8. Select repository: `isotec-contract-system`
9. Click "Begin setup"

### 3.2 Configure Build Settings

**Framework preset:** Next.js

**Build configuration:**
```
Production branch: main
Build command: npm run build
Build output directory: .next
Root directory: /
```

**Build settings:**
```
Node version: 18
Package manager: npm
```

### 3.3 Add Environment Variables

Click "Environment variables" and add:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw

# SMTP Email
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nao-responda@clubemkt.digital
SMTP_PASS=Advance1773
SMTP_FROM=nao-responda@clubemkt.digital
SMTP_FROM_NAME=ISOTEC

# Application URL (will update after deployment)
NEXT_PUBLIC_APP_URL=https://isotec-contract-system.pages.dev
```

**Important:** Set all variables for "Production" environment

### 3.4 Deploy

1. Click "Save and Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Cloudflare will show build logs in real-time

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain

1. In Cloudflare Pages dashboard, go to your project
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter: `contratofacil.clubemkt.digital`
5. Click "Continue"

### 4.2 Configure DNS

Cloudflare will provide DNS records. Add them to your domain:

**Option A: Domain already on Cloudflare**
- DNS records are added automatically
- Wait for propagation (~5 minutes)

**Option B: Domain on another provider**
- Add CNAME record:
  ```
  Type: CNAME
  Name: contratofacil
  Value: isotec-contract-system.pages.dev
  TTL: Auto
  ```

### 4.3 Update Environment Variable

After custom domain is active:

1. Go to "Settings" → "Environment variables"
2. Update `NEXT_PUBLIC_APP_URL`:
   ```
   NEXT_PUBLIC_APP_URL=https://contratofacil.clubemkt.digital
   ```
3. Click "Save"
4. Redeploy: "Deployments" → "..." → "Retry deployment"

---

## Step 5: Setup Database (5 minutes)

### 5.1 Run Supabase Migrations

**Option A: Supabase Dashboard (Easiest)**

1. Go to https://app.supabase.com
2. Select your project
3. Go to "SQL Editor"
4. Run migrations in order:

```sql
-- 1. Create profiles table
-- Copy content from: supabase/migrations/20240101000001_create_profiles_table.sql

-- 2. Create contracts table
-- Copy content from: supabase/migrations/20240101000002_create_contracts_table.sql

-- 3. Create contract_items table
-- Copy content from: supabase/migrations/20240101000003_create_contract_items_table.sql

-- 4. Create audit_logs table
-- Copy content from: supabase/migrations/20240101000004_create_audit_logs_table.sql

-- 5. Create verification_codes table
-- Copy content from: supabase/migrations/20240101000005_create_verification_codes_table.sql
```

**Option B: Supabase CLI**

```bash
cd supabase
supabase link --project-ref kjgonoakapxleryjdhxb
supabase db push
```

### 5.2 Verify Tables Created

1. In Supabase Dashboard, go to "Table Editor"
2. Verify these tables exist:
   - profiles
   - contracts
   - contract_items
   - audit_logs
   - verification_codes

---

## Step 6: Post-Deployment Verification (5 minutes)

### 6.1 Check Deployment Status

1. In Cloudflare Pages dashboard
2. Go to "Deployments"
3. Verify latest deployment shows "Success"
4. Note the deployment URL

### 6.2 Test Application

**Homepage:**
```bash
curl https://isotec-contract-system.pages.dev
# or
curl https://contratofacil.clubemkt.digital
```

**Test in Browser:**
1. Open: `https://your-domain.pages.dev`
2. Verify homepage loads
3. Go to `/wizard`
4. Verify wizard loads without errors

### 6.3 Test Contract Creation

1. Fill out wizard with test data:
   - CPF: 123.456.789-09 (test CPF)
   - CEP: 01310-100 (Av. Paulista, São Paulo)
   - Use dummy data for other fields

2. Submit contract
3. Verify redirect to contract view
4. Note the contract UUID

### 6.4 Test Email Signature

1. On contract page, enter your email
2. Click "Enviar Código"
3. Check your email for verification code
4. Enter code and verify signature completes

### 6.5 Check Logs

In Cloudflare Pages:
1. Go to "Deployments"
2. Click on latest deployment
3. Click "View logs"
4. Verify no errors

---

## 🔧 Troubleshooting

### Build Fails

**Check build logs in Cloudflare:**
```
Common issues:
- Missing environment variables
- Node version mismatch
- Dependency installation failed
```

**Solution:**
```bash
# Locally verify build works
npm run build

# Check Node version
node --version  # Should be 18.x

# Clear cache and rebuild in Cloudflare
# Settings → Build & deployments → Clear cache
```

### Environment Variables Not Loading

**Verify variables are set:**
1. Cloudflare Pages → Settings → Environment variables
2. Check "Production" environment
3. Redeploy after adding variables

### Email Not Sending

**Check SMTP credentials:**
```bash
# Test SMTP connection
telnet mail.clubemkt.digital 587

# Verify environment variables in Cloudflare
# Settings → Environment variables → SMTP_*
```

### Database Connection Issues

**Verify Supabase credentials:**
1. Check `NEXT_PUBLIC_SUPABASE_URL`
2. Check `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Verify RLS policies are active
4. Check Supabase project is not paused

### Custom Domain Not Working

**Check DNS:**
```bash
# Verify DNS propagation
dig contratofacil.clubemkt.digital

# Check CNAME record
nslookup contratofacil.clubemkt.digital
```

**Wait for propagation:**
- DNS changes can take 5-60 minutes
- Clear browser cache
- Try incognito mode

---

## 🔄 Continuous Deployment

### Automatic Deployments

Every push to `main` branch triggers automatic deployment:

```bash
# Make changes
git add .
git commit -m "Update feature X"
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Runs build
# 3. Deploys if successful
```

### Preview Deployments

Every pull request gets a preview URL:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git push origin feature/new-feature

# Create PR on GitHub
# Cloudflare creates preview deployment
# Test at: https://abc123.isotec-contract-system.pages.dev
```

### Rollback

If deployment has issues:

1. Go to Cloudflare Pages → Deployments
2. Find previous working deployment
3. Click "..." → "Rollback to this deployment"

---

## 📊 Monitoring

### Cloudflare Analytics

1. Go to Cloudflare Pages → Analytics
2. Monitor:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Request count

### Error Tracking

**Add Sentry (Optional):**

```bash
npm install @sentry/nextjs

# Configure in next.config.ts
# Add SENTRY_DSN to environment variables
```

### Performance Monitoring

**Cloudflare Web Analytics:**
1. Enable in Cloudflare dashboard
2. Add tracking script to pages
3. Monitor Core Web Vitals

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] Code pushed to GitHub
- [x] `.env.local` not in repository
- [x] Build passing locally
- [x] Tests passing

### Cloudflare Setup
- [x] Repository connected
- [x] Build settings configured
- [x] Environment variables added
- [x] First deployment successful

### Database
- [x] Migrations run
- [x] Tables created
- [x] RLS policies active

### Testing
- [x] Homepage loads
- [x] Wizard accessible
- [x] Contract creation works
- [x] Email sending works
- [x] Signature flow completes

### Optional
- [ ] Custom domain configured
- [ ] DNS propagated
- [ ] SSL certificate active
- [ ] Monitoring setup

---

## 🎉 Success!

Your ISOTEC Contract System is now live on Cloudflare Pages!

**URLs:**
- **Production:** https://isotec-contract-system.pages.dev
- **Custom Domain:** https://contratofacil.clubemkt.digital (if configured)
- **GitHub:** https://github.com/YOUR_USERNAME/isotec-contract-system

**Next Steps:**
1. Share URL with stakeholders
2. Monitor for 24 hours
3. Gather feedback
4. Plan next features

---

## 📚 Additional Resources

- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages
- **Next.js on Cloudflare:** https://developers.cloudflare.com/pages/framework-guides/nextjs
- **GitHub Actions:** https://docs.github.com/actions
- **Supabase Docs:** https://supabase.com/docs

---

**Deployment Method:** GitHub + Cloudflare Pages  
**Estimated Time:** 10-15 minutes  
**Difficulty:** Easy  
**Status:** ✅ Production Ready

🚀 **Your app is live!**
