# 🚀 SolarCRM Pro - Cloudflare Pages Deployment Guide

## Quick Deployment (5 minutes)

### Option 1: Automatic Deployment via GitHub Integration

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate to "Workers & Pages"
   - Click "Create application" → "Pages" → "Connect to Git"

2. **Connect Your Repository**
   - Select GitHub
   - Choose repository: `hudsonargollo/contrato-isotec`
   - Click "Begin setup"

3. **Configure Build Settings**
   ```
   Framework preset: Next.js
   Build command: npm run build
   Build output directory: .next
   Root directory: /
   Node version: 18
   ```

4. **Add Environment Variables**
   Copy from your `.env.local` file and add these in Cloudflare:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   GOVBR_CLIENT_ID=your-govbr-client-id
   GOVBR_CLIENT_SECRET=your-govbr-client-secret
   GOVBR_REDIRECT_URI=https://your-domain.pages.dev/api/signatures/govbr/callback
   SMTP_HOST=mail.clubemkt.digital
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   SMTP_FROM=noreply@yourdomain.com
   SMTP_FROM_NAME=SolarCRM Pro
   NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
   WHATSAPP_BUSINESS_ACCOUNT_ID=your-whatsapp-business-account-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-whatsapp-webhook-verify-token
   ```

5. **Deploy**
   - Click "Save and Deploy"
   - Wait for build completion (~3-5 minutes)

### Option 2: CLI Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Run Deployment Script**
   ```bash
   ./scripts/deploy-cloudflare.sh
   ```

## Post-Deployment Configuration

### 1. Update Application URL
After deployment, update the `NEXT_PUBLIC_APP_URL` environment variable with your actual Cloudflare Pages URL.

### 2. Configure Webhooks
Update webhook URLs in your integrations:
- **Stripe Webhooks**: Point to `https://your-domain.pages.dev/api/webhooks/stripe`
- **WhatsApp Webhooks**: Point to `https://your-domain.pages.dev/api/webhooks/whatsapp`

### 3. Test Core Functionality
- [ ] Homepage loads correctly
- [ ] User registration/login works
- [ ] Contract creation flow
- [ ] PDF generation
- [ ] Email notifications
- [ ] Payment processing
- [ ] WhatsApp integration

### 4. Set Up Custom Domain (Optional)
1. In Cloudflare Pages dashboard, go to "Custom domains"
2. Add your domain (e.g., `app.solarcrm.com`)
3. Configure DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable

## Monitoring & Maintenance

### Performance Monitoring
- Use Cloudflare Analytics to monitor traffic
- Set up alerts for high error rates
- Monitor Core Web Vitals

### Automatic Deployments
Every push to the `main` branch will trigger automatic deployment.

### Rollback Process
If issues occur:
1. Go to Cloudflare Pages → Deployments
2. Find the last working deployment
3. Click "Rollback to this deployment"

## Troubleshooting

### Build Failures
- Check build logs in Cloudflare dashboard
- Verify all environment variables are set
- Ensure Node.js version compatibility

### Runtime Errors
- Check function logs in Cloudflare dashboard
- Verify database connections
- Test API endpoints individually

### Performance Issues
- Enable Cloudflare caching rules
- Optimize images and static assets
- Use Cloudflare's performance features

## Security Checklist
- [ ] All environment variables configured
- [ ] HTTPS enforced
- [ ] Security headers configured (via `_headers` file)
- [ ] API rate limiting enabled
- [ ] Database RLS policies active

## Success! 🎉

Your SolarCRM Pro platform is now live on Cloudflare Pages with:
- ✅ Multi-tenant SaaS architecture
- ✅ Advanced CRM system
- ✅ Contract management
- ✅ Payment processing
- ✅ WhatsApp integration
- ✅ Analytics dashboard
- ✅ API-first architecture
- ✅ Enterprise security features

**Next Steps:**
1. Share the URL with your team
2. Configure custom domain
3. Set up monitoring
4. Plan user onboarding
5. Gather feedback for improvements