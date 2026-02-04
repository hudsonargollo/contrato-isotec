# Deploy to Vercel - Complete Guide

## ⏱️ Total Time: 5 minutes

Your Next.js app is already configured and ready for Vercel. No code changes needed!

---

## Step 1: Sign Up / Sign In (1 minute)

1. Go to: **https://vercel.com**
2. Click **"Sign Up"** or **"Log In"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

---

## Step 2: Import Your Repository (1 minute)

1. On Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find and select: **`hudsonargollo/contrato-isotec`**
3. Click **"Import"**

---

## Step 3: Configure Project (2 minutes)

### Framework Preset
- Vercel will auto-detect: **Next.js** ✅
- Leave as is

### Build Settings
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### Root Directory
- Leave as: **`./`** (root)

---

## Step 4: Add Environment Variables (2 minutes)

Click **"Environment Variables"** and add these:

### Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjYyNzEsImV4cCI6MjA4NTgwMjI3MX0.21Ya1JlkVi_v1mQ4puMdukauqc4QcX59VqtnqWfELp8
```

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjI3MSwiZXhwIjoyMDg1ODAyMjcxfQ.Om0iqnkY-bdoPXV5__AgqhJWqASmnUCeGJhAVXmDvXk
```

### Google Maps
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw
```

### SMTP Email
```
SMTP_HOST=mail.clubemkt.digital
```

```
SMTP_PORT=587
```

```
SMTP_SECURE=false
```

```
SMTP_USER=nao-responda@clubemkt.digital
```

```
SMTP_PASS=Advance1773
```

```
SMTP_FROM=nao-responda@clubemkt.digital
```

```
SMTP_FROM_NAME=ISOTEC
```

### App URL (will update after deployment)
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important**: Make sure all variables are set for **Production**, **Preview**, and **Development** environments.

---

## Step 5: Deploy! (1 minute)

1. Click **"Deploy"**
2. Wait 1-2 minutes for build to complete
3. You'll see: **"Congratulations! Your project has been deployed"** 🎉

---

## Step 6: Get Your URL

After deployment completes:
1. Copy your deployment URL (e.g., `https://contrato-isotec.vercel.app`)
2. Go back to **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_APP_URL` with your actual URL
4. Click **"Save"**
5. Go to **Deployments** → Click **"..."** on latest deployment → **"Redeploy"**

---

## Step 7: Test Your Application

1. Visit your Vercel URL
2. Test the wizard: `/wizard`
3. Create a test contract
4. Test email signature flow
5. Verify database connection

---

## Step 8: Custom Domain (Optional)

### Add Your Domain

1. In Vercel project, go to **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `contratofacil.clubemkt.digital`
4. Click **"Add"**

### Configure DNS

Vercel will show you DNS records to add. In your DNS provider (Cloudflare):

**Option A: CNAME (Recommended)**
```
Type: CNAME
Name: contratofacil
Value: cname.vercel-dns.com
```

**Option B: A Record**
```
Type: A
Name: contratofacil
Value: 76.76.21.21
```

### Update Environment Variable

After domain is active:
1. Go to **Settings** → **Environment Variables**
2. Update `NEXT_PUBLIC_APP_URL` to: `https://contratofacil.clubemkt.digital`
3. Redeploy

---

## Automatic Deployments

Vercel automatically deploys when you push to GitHub:

- **Push to `main`** → Production deployment
- **Push to other branches** → Preview deployment
- **Pull requests** → Preview deployment with unique URL

---

## Monitoring & Logs

### View Logs
1. Go to your project in Vercel
2. Click **"Deployments"**
3. Click on any deployment
4. Click **"View Function Logs"** or **"Build Logs"**

### Analytics
1. Go to **Analytics** tab
2. View traffic, performance, and errors

---

## Updating Your Application

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push origin main

# Vercel automatically deploys! ✅
```

---

## Troubleshooting

### Build Failed
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Make sure code builds locally: `npm run build`

### Environment Variables Not Working
- Verify variables are set for all environments
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)

### Database Connection Issues
- Verify Supabase credentials
- Check Supabase project is active
- Test connection from Vercel Function Logs

### SMTP Not Working
- Verify SMTP credentials
- Check SMTP_PORT is set to `587`
- Verify SMTP_SECURE is `false`

### 404 Errors
- Check routes exist in your code
- Verify build completed successfully
- Check Function Logs for errors

---

## Performance Tips

### Enable Caching
Vercel automatically caches:
- Static assets
- API responses (with proper headers)
- Images (with Next.js Image component)

### Edge Functions
Your API routes run on Vercel's Edge Network automatically - no configuration needed!

### Image Optimization
Next.js Image component is automatically optimized by Vercel.

---

## Security

### Environment Variables
- Never commit `.env.local` to Git
- Use Vercel's environment variables UI
- Rotate secrets regularly

### HTTPS
- Automatic SSL certificates
- Force HTTPS (enabled by default)
- Free SSL for custom domains

---

## Costs

### Free Tier Includes:
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ GitHub integration
- ✅ Preview deployments

### Your Usage:
- Small contract system
- Low to medium traffic
- **Will stay within free tier** ✅

---

## Support

### Documentation
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs

### Community
- Vercel Discord: https://vercel.com/discord
- GitHub Discussions: https://github.com/vercel/next.js/discussions

---

## Summary

✅ **Your app is now live!**

- **Production URL**: `https://contrato-isotec.vercel.app`
- **Custom Domain**: `https://contratofacil.clubemkt.digital` (optional)
- **Automatic deployments**: Push to GitHub = Auto deploy
- **Free SSL**: Included
- **Global CDN**: Fast worldwide
- **Monitoring**: Built-in analytics

**Next Steps:**
1. Test your application thoroughly
2. Add custom domain (optional)
3. Share with users
4. Monitor analytics

🎉 **Congratulations! Your ISOTEC Contract System is live!**
