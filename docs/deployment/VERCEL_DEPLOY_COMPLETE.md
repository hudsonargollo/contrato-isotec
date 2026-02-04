# Vercel Deployment Guide - Complete

## Prerequisites
- Vercel account
- GitHub repository connected
- Supabase project configured
- All environment variables ready

## Step 1: Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Google Maps (Required)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

### SMTP Email (Required)
```
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=ISOTEC
```

### Application (Required)
```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Step 2: Deploy via CLI

```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Step 3: Deploy via GitHub (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
4. Add all environment variables
5. Click "Deploy"

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify all required variables are present
- Check build logs in Vercel dashboard

### Runtime Errors
- Check Supabase connection
- Verify API keys are correct
- Check function logs in Vercel

## Post-Deployment

1. Test the application
2. Create admin user in Supabase
3. Test contract creation
4. Test email signatures
5. Monitor for errors

## Success Criteria

✅ Application builds successfully
✅ All pages load without errors
✅ Supabase connection works
✅ Email sending works
✅ Google Maps loads correctly
