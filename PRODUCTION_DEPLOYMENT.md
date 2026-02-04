# Production Deployment Guide

**Project:** ISOTEC Photovoltaic Contract System  
**Target:** contratofacil.clubemkt.digital/isotec  
**Date:** February 4, 2024

## ✅ Pre-Deployment Checklist

### 1. Build Verification
- [x] TypeScript compilation successful
- [x] All 231 unit tests passing
- [x] Production build successful
- [x] No blocking errors (only warnings)

### 2. Environment Variables Required

Create these environment variables in your production environment:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# SMTP Email Configuration
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nao-responda@clubemkt.digital
SMTP_PASS=Advance1773
SMTP_FROM=nao-responda@clubemkt.digital
SMTP_FROM_NAME=ISOTEC

# Application URL
NEXT_PUBLIC_APP_URL=https://contratofacil.clubemkt.digital/isotec

# GOV.BR OAuth (Optional - for future)
GOVBR_CLIENT_ID=
GOVBR_CLIENT_SECRET=
GOVBR_REDIRECT_URI=https://contratofacil.clubemkt.digital/isotec/api/signatures/govbr/callback
```

### 3. Database Setup

Run migrations in Supabase:

```bash
# Navigate to Supabase project
cd supabase

# Run migrations in order
# 1. Create profiles table
# 2. Create contracts table
# 3. Create contract_items table
# 4. Create audit_logs table
# 5. Create verification_codes table
```

Or use Supabase CLI:

```bash
supabase db push
```

### 4. DNS Configuration

Ensure DNS is configured for:
- `contratofacil.clubemkt.digital` → Your hosting provider
- Subdomain routing for `/isotec` path

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from the list above
   - Ensure they're available for Production environment

3. **Configure Custom Domain:**
   - Add `contratofacil.clubemkt.digital` as custom domain
   - Configure path-based routing for `/isotec`

### Option 2: Cloudflare Pages

1. **Build Configuration:**
   ```
   Build command: npm run build
   Build output directory: .next
   Root directory: /
   ```

2. **Environment Variables:**
   - Add all variables in Cloudflare Pages settings
   - Ensure SMTP credentials are secure

3. **Deploy:**
   ```bash
   npm run build
   npx @cloudflare/next-on-pages
   ```

### Option 3: Docker + VPS

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Build and Run:**
   ```bash
   docker build -t isotec-contracts .
   docker run -p 3000:3000 --env-file .env.production isotec-contracts
   ```

## 📋 Post-Deployment Verification

### 1. Smoke Tests

Test these critical paths:

- [ ] Homepage loads: `https://contratofacil.clubemkt.digital/isotec`
- [ ] Wizard accessible: `/isotec/wizard`
- [ ] Can create contract (test with dummy data)
- [ ] Contract view loads: `/isotec/contracts/[uuid]`
- [ ] Email sending works (test verification code)
- [ ] Email verification works
- [ ] Contract signature completes successfully

### 2. Email Deliverability

Test email delivery:

```bash
# Use test endpoint (create temporarily)
curl -X POST https://contratofacil.clubemkt.digital/isotec/api/signatures/email/send \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","contractId":"test-id"}'
```

Check:
- [ ] Emails arrive in inbox (not spam)
- [ ] HTML renders correctly
- [ ] Links work correctly
- [ ] Verification codes are valid

### 3. Database Connectivity

Verify:
- [ ] Can create contracts
- [ ] Can read contracts
- [ ] Can update contract status
- [ ] Audit logs are created
- [ ] RLS policies are active

### 4. Performance

Monitor:
- [ ] Page load times < 3s
- [ ] API response times < 500ms
- [ ] No memory leaks
- [ ] No console errors

## 🔒 Security Checklist

### Environment Variables
- [ ] All secrets stored securely (not in code)
- [ ] SMTP credentials encrypted
- [ ] Supabase keys rotated if exposed
- [ ] No `.env.local` in version control

### API Security
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Authentication required for admin routes
- [ ] Input validation on all endpoints

### Database Security
- [ ] RLS policies active
- [ ] Service role key secured
- [ ] No public write access
- [ ] Audit logs immutable

## 📊 Monitoring Setup

### 1. Error Tracking

Set up error monitoring:
- Sentry
- LogRocket
- Datadog

### 2. Performance Monitoring

Track:
- Page load times
- API response times
- Database query performance
- Email delivery rates

### 3. Uptime Monitoring

Use:
- UptimeRobot
- Pingdom
- StatusCake

### 4. Email Monitoring

Track:
- Delivery rate
- Bounce rate
- Spam complaints
- Open rates (optional)

## 🔄 Rollback Plan

If deployment fails:

1. **Immediate Rollback:**
   ```bash
   # Vercel
   vercel rollback
   
   # Cloudflare
   # Use dashboard to rollback to previous deployment
   ```

2. **Database Rollback:**
   ```bash
   # Revert migrations if needed
   supabase db reset
   ```

3. **DNS Rollback:**
   - Point domain back to previous deployment
   - Update environment variables if needed

## 📝 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error logs for 24 hours
- [ ] Test all critical paths
- [ ] Verify email delivery
- [ ] Check database performance

### Short-term (Week 1)
- [ ] Set up monitoring dashboards
- [ ] Configure alerts
- [ ] Document any issues
- [ ] Optimize slow queries

### Medium-term (Month 1)
- [ ] Review performance metrics
- [ ] Optimize based on usage patterns
- [ ] Plan feature improvements
- [ ] Update documentation

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All smoke tests pass
- ✅ No critical errors in logs
- ✅ Email delivery rate > 95%
- ✅ Page load times < 3s
- ✅ API response times < 500ms
- ✅ Zero downtime during deployment

## 📞 Support Contacts

- **Technical Issues:** Check logs and documentation
- **Email Issues:** Verify SMTP credentials
- **Database Issues:** Check Supabase dashboard
- **DNS Issues:** Contact hosting provider

## 🔗 Useful Links

- **Production URL:** https://contratofacil.clubemkt.digital/isotec
- **Supabase Dashboard:** https://app.supabase.com
- **Email Provider:** mail.clubemkt.digital
- **Repository:** [Your Git Repository]

## 📚 Additional Documentation

- `README.md` - Project overview
- `DEVELOPMENT.md` - Development guide
- `API.md` - API documentation
- `MVP_STATUS.md` - Feature status
- `SMTP_INTEGRATION.md` - Email setup
- `docs/EMAIL_SETUP.md` - Detailed email guide

---

**Last Updated:** February 4, 2024  
**Version:** 1.0.0-mvp  
**Status:** ✅ Ready for Production Deployment
