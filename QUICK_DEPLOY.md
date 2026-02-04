# ⚡ Quick Deploy Guide

**For:** ISOTEC Photovoltaic Contract System  
**Target:** Production deployment in < 15 minutes

---

## 🚀 Option 1: Vercel (Fastest - 5 minutes)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variables in Vercel Dashboard
# Go to: Project Settings → Environment Variables
# Add all variables from .env.local.example
```

**Environment Variables to Add:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nao-responda@clubemkt.digital
SMTP_PASS=Advance1773
SMTP_FROM=nao-responda@clubemkt.digital
SMTP_FROM_NAME=ISOTEC
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Custom Domain:**
- Add `contratofacil.clubemkt.digital` in Vercel Dashboard
- Configure DNS: CNAME → cname.vercel-dns.com

---

## 🔷 Option 2: Cloudflare Pages (10 minutes)

```bash
# 1. Build the project
npm run build

# 2. Install Cloudflare adapter
npm install -D @cloudflare/next-on-pages

# 3. Build for Cloudflare
npx @cloudflare/next-on-pages

# 4. Deploy via Cloudflare Dashboard
# - Connect your Git repository
# - Set build command: npm run build
# - Set build output: .next
# - Add environment variables
```

**Build Settings:**
```
Build command: npm run build
Build output directory: .next
Root directory: /
Node version: 18
```

---

## 🐳 Option 3: Docker (15 minutes)

```bash
# 1. Create Dockerfile (already provided below)
# 2. Build image
docker build -t isotec-contracts .

# 3. Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name isotec-contracts \
  isotec-contracts

# 4. Verify
curl http://localhost:3000
```

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

---

## 📋 Pre-Deployment Checklist

```bash
# 1. Verify tests pass
npm test

# 2. Verify build works
npm run build

# 3. Check environment variables
cat .env.local.example

# 4. Verify Supabase connection
# Test in Supabase dashboard

# 5. Verify SMTP credentials
# Test email sending
```

---

## 🗄️ Database Setup (5 minutes)

```bash
# Option A: Supabase CLI
cd supabase
supabase db push

# Option B: Manual (in Supabase SQL Editor)
# Run migrations in order:
# 1. 20240101000001_create_profiles_table.sql
# 2. 20240101000002_create_contracts_table.sql
# 3. 20240101000003_create_contract_items_table.sql
# 4. 20240101000004_create_audit_logs_table.sql
# 5. 20240101000005_create_verification_codes_table.sql
```

---

## ✅ Post-Deployment Verification (5 minutes)

```bash
# 1. Check homepage
curl https://your-domain.com

# 2. Test wizard
# Open: https://your-domain.com/wizard

# 3. Test email (create test contract)
# Use wizard to create contract
# Request signature
# Check email delivery

# 4. Verify database
# Check Supabase dashboard for new records

# 5. Check logs
# Monitor for errors in first 24 hours
```

---

## 🔧 Quick Fixes

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Email Not Sending
```bash
# Verify SMTP credentials
echo $SMTP_HOST
echo $SMTP_USER

# Test SMTP connection
telnet mail.clubemkt.digital 587
```

### Database Connection Issues
```bash
# Verify Supabase URL
echo $NEXT_PUBLIC_SUPABASE_URL

# Test connection in Supabase dashboard
# Check RLS policies are active
```

### Environment Variables Not Loading
```bash
# Vercel: Redeploy after adding variables
vercel --prod

# Cloudflare: Rebuild after adding variables

# Docker: Recreate container
docker stop isotec-contracts
docker rm isotec-contracts
docker run -d -p 3000:3000 --env-file .env.production isotec-contracts
```

---

## 📞 Emergency Rollback

### Vercel
```bash
vercel rollback
```

### Cloudflare
```
# Use dashboard to rollback to previous deployment
```

### Docker
```bash
# Stop current container
docker stop isotec-contracts

# Start previous version
docker run -d -p 3000:3000 isotec-contracts:previous
```

---

## 🎯 Success Indicators

After deployment, verify:
- ✅ Homepage loads without errors
- ✅ Wizard is accessible
- ✅ Can create test contract
- ✅ Email verification works
- ✅ Contract signature completes
- ✅ No errors in logs

---

## 📚 Full Documentation

For detailed information, see:
- `PRODUCTION_DEPLOYMENT.md` - Complete deployment guide
- `PRODUCTION_READY.md` - System status and features
- `README.md` - Project overview
- `API.md` - API documentation

---

**Estimated Time:** 5-15 minutes depending on platform  
**Difficulty:** Easy  
**Status:** ✅ Ready to deploy

🚀 **Choose your platform and deploy now!**
