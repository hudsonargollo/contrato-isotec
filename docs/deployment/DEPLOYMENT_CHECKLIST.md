# ✅ Deployment Checklist

**Project:** ISOTEC Photovoltaic Contract System  
**Target:** GitHub → Cloudflare Pages  
**Date:** February 4, 2024

---

## 📋 Pre-Deployment (5 minutes)

### Code Quality
- [x] All tests passing (231/231)
- [x] Build successful (`npm run build`)
- [x] No blocking errors
- [x] TypeScript compiles
- [x] ESLint warnings only

### Security
- [ ] `.env.local` in `.gitignore`
- [ ] No sensitive data in code
- [ ] No API keys in repository
- [ ] Passwords not hardcoded
- [ ] `.env.local.example` updated

### Documentation
- [x] README.md complete
- [x] API.md documented
- [x] Deployment guides ready
- [x] Environment variables documented

---

## 🔐 Gather Credentials (5 minutes)

### Supabase
- [ ] Project URL: `https://kjgonoakapxleryjdhxb.supabase.co`
- [ ] Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- [ ] Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Google Maps
- [ ] API Key: `AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw`

### SMTP Email
- [ ] Host: `mail.clubemkt.digital`
- [ ] Port: `587`
- [ ] User: `nao-responda@clubemkt.digital`
- [ ] Password: `Advance1773`

### GitHub
- [ ] Account ready
- [ ] Repository name decided: `isotec-contract-system`

### Cloudflare
- [ ] Account ready
- [ ] Domain available: `contratofacil.clubemkt.digital`

---

## 📦 Step 1: GitHub Setup (5 minutes)

### Initialize Git
```bash
- [ ] git init
- [ ] git add .
- [ ] git commit -m "Initial commit - ISOTEC Contract System MVP"
```

### Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Name: `isotec-contract-system`
- [ ] Visibility: Private
- [ ] Do NOT initialize with README
- [ ] Click "Create repository"

### Push to GitHub
```bash
- [ ] git remote add origin https://github.com/YOUR_USERNAME/isotec-contract-system.git
- [ ] git branch -M main
- [ ] git push -u origin main
```

### Verify
- [ ] Repository visible on GitHub
- [ ] All files uploaded
- [ ] `.env.local` NOT in repository

---

## ☁️ Step 2: Cloudflare Pages (10 minutes)

### Connect Repository
- [ ] Go to https://dash.cloudflare.com
- [ ] Click "Workers & Pages"
- [ ] Click "Create application"
- [ ] Select "Pages" tab
- [ ] Click "Connect to Git"
- [ ] Authorize GitHub
- [ ] Select `isotec-contract-system`
- [ ] Click "Begin setup"

### Configure Build
- [ ] Framework: Next.js
- [ ] Build command: `npm run build`
- [ ] Build output: `.next`
- [ ] Root directory: `/`
- [ ] Node version: `18`

### Add Environment Variables

**Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Google Maps:**
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

**SMTP:**
- [ ] `SMTP_HOST`
- [ ] `SMTP_PORT`
- [ ] `SMTP_SECURE`
- [ ] `SMTP_USER`
- [ ] `SMTP_PASS`
- [ ] `SMTP_FROM`
- [ ] `SMTP_FROM_NAME`

**Application:**
- [ ] `NEXT_PUBLIC_APP_URL` (temporary: `https://isotec-contract-system.pages.dev`)

### Deploy
- [ ] Click "Save and Deploy"
- [ ] Wait for build (~2-3 minutes)
- [ ] Verify "Success" status

---

## 🌐 Step 3: Custom Domain (Optional - 5 minutes)

### Add Domain
- [ ] Go to project → "Custom domains"
- [ ] Click "Set up a custom domain"
- [ ] Enter: `contratofacil.clubemkt.digital`
- [ ] Click "Continue"

### Configure DNS
- [ ] Add CNAME record (if needed)
- [ ] Wait for DNS propagation (~5-10 minutes)
- [ ] Verify domain is active

### Update Environment
- [ ] Update `NEXT_PUBLIC_APP_URL` to custom domain
- [ ] Redeploy application

---

## 🗄️ Step 4: Database Setup (10 minutes)

**📖 See detailed guide:** `docs/deployment/SUPABASE_PRODUCTION_DEPLOY.md`  
**📋 Quick checklist:** `docs/deployment/SUPABASE_DEPLOY_CHECKLIST.md`

### Link Project
```bash
- [ ] supabase link --project-ref <your-project-ref>
```

### Push Migrations
```bash
- [ ] supabase db push
```

### Verify Deployment
```bash
- [ ] npm run verify:db
```

### Create Admin User
- [ ] Create user in Supabase Auth
- [ ] Create profile record with `super_admin` role
- [ ] Test admin login

### Configure Backups
- [ ] Enable Point-in-Time Recovery (if Pro plan)
- [ ] Verify backup schedule
- [ ] Set retention period (7+ days)

---

## 🧪 Step 5: Testing (10 minutes)

### Smoke Tests

**Homepage:**
- [ ] Open: `https://your-domain.pages.dev`
- [ ] Verify page loads
- [ ] No console errors
- [ ] ISOTEC branding visible

**Wizard:**
- [ ] Navigate to `/wizard`
- [ ] Verify all 7 steps load
- [ ] Test form validation
- [ ] Test CEP lookup
- [ ] Test Google Maps picker

**Contract Creation:**
- [ ] Fill wizard with test data
- [ ] Submit contract
- [ ] Verify redirect to contract view
- [ ] Note contract UUID

**Contract View:**
- [ ] Open contract URL
- [ ] Verify all data displays correctly
- [ ] Check equipment table
- [ ] Check services list
- [ ] Check financial info

**Email Signature:**
- [ ] Enter your email
- [ ] Click "Enviar Código"
- [ ] Check email inbox
- [ ] Verify code received
- [ ] Enter code
- [ ] Verify signature completes
- [ ] Check confirmation email

### Database Verification
- [ ] Go to Supabase dashboard
- [ ] Check `contracts` table has new record
- [ ] Check `contract_items` table has items
- [ ] Check `audit_logs` table has signature log
- [ ] Verify data integrity

### Email Verification
- [ ] Verification email received
- [ ] HTML renders correctly
- [ ] Code is readable
- [ ] Confirmation email received
- [ ] Links work correctly

---

## 📊 Step 6: Monitoring Setup (5 minutes)

### Cloudflare Analytics
- [ ] Enable analytics in dashboard
- [ ] Verify tracking is working
- [ ] Check initial metrics

### Error Tracking (Optional)
- [ ] Set up Sentry (if desired)
- [ ] Configure error alerts
- [ ] Test error reporting

### Uptime Monitoring (Optional)
- [ ] Set up UptimeRobot
- [ ] Configure alerts
- [ ] Test notifications

---

## 📝 Step 7: Documentation (5 minutes)

### Update URLs
- [ ] Update README.md with production URL
- [ ] Update API.md if needed
- [ ] Update environment variable docs

### Create Runbook
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Document common issues

### Share Access
- [ ] Share GitHub repository (if team)
- [ ] Share Cloudflare access (if team)
- [ ] Share Supabase access (if team)

---

## 🎉 Step 8: Go Live! (1 minute)

### Final Checks
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Email working
- [ ] Database connected
- [ ] Custom domain active (if configured)

### Announce
- [ ] Share URL with stakeholders
- [ ] Send test contract link
- [ ] Gather initial feedback

### Monitor
- [ ] Watch logs for 1 hour
- [ ] Check for errors
- [ ] Monitor performance
- [ ] Respond to issues

---

## 🔄 Post-Deployment (24 hours)

### Day 1
- [ ] Monitor error logs
- [ ] Check email delivery rate
- [ ] Verify database performance
- [ ] Test all critical paths
- [ ] Gather user feedback

### Week 1
- [ ] Review analytics
- [ ] Optimize slow queries
- [ ] Fix any bugs found
- [ ] Update documentation
- [ ] Plan improvements

---

## 🆘 Rollback Plan

### If Deployment Fails

**Cloudflare:**
- [ ] Go to "Deployments"
- [ ] Find last working deployment
- [ ] Click "..." → "Rollback"

**Database:**
- [ ] Revert migrations if needed
- [ ] Restore from backup

**DNS:**
- [ ] Point domain back to old deployment
- [ ] Wait for propagation

---

## 📞 Support Contacts

### Technical Issues
- **GitHub:** Check repository issues
- **Cloudflare:** Check dashboard logs
- **Supabase:** Check project logs

### Email Issues
- **SMTP:** Verify credentials
- **Delivery:** Check spam folder
- **Rate limits:** Check provider limits

### Database Issues
- **Connection:** Check Supabase status
- **RLS:** Verify policies
- **Performance:** Check query logs

---

## ✅ Success Criteria

Deployment is successful when:
- ✅ Application loads without errors
- ✅ All features work as expected
- ✅ Email delivery working
- ✅ Database connected
- ✅ No critical errors in logs
- ✅ Performance acceptable (< 3s page load)

---

## 📚 Reference Documents

- `SUPABASE_PRODUCTION_DEPLOY.md` - **Complete Supabase deployment guide**
- `SUPABASE_DEPLOY_CHECKLIST.md` - **Quick Supabase deployment checklist**
- `DEPLOY_GITHUB_CLOUDFLARE.md` - Detailed deployment guide
- `GIT_COMMANDS.md` - Git command reference
- `PRODUCTION_READY.md` - System status
- `QUICK_DEPLOY.md` - Quick deployment
- `README.md` - Project overview

---

**Checklist Version:** 1.0  
**Last Updated:** February 4, 2024  
**Status:** Ready to use

🚀 **Start checking boxes and deploy!**
