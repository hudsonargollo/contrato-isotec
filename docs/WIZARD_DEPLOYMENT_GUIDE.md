# Wizard Deployment Guide - February 4, 2026

## Issues Fixed

### 1. Middleware Blocking Public Contract Creation ✅
**Problem:** The middleware was blocking ALL requests to `/api/contracts`, including POST requests from the public wizard.

**Solution:**
- Modified middleware to only protect GET requests (admin-only contract listing)
- Allow POST requests without authentication (public contract creation)
- Updated middleware matcher to properly exclude API routes

**Files Modified:**
- `middleware.ts`

### 2. Google Maps Not Loading ⚠️
**Problem:** Google Maps shows error "Ops! Algo deu errado"

**Root Cause:** The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable is not set in Vercel.

**Solution:** Add the environment variable in Vercel Dashboard.

**Test Page Created:** `/test-maps` - Visit this page to verify if the API key is configured.

### 3. Changed "Unidade" to "Fabricante" ✅
**Problem:** Equipment field was labeled "Unidade" but should be "Fabricante"

**Solution:**
- Updated label from "Unidade" to "Fabricante"
- Changed placeholder to "Ex: RONMA SOLAR"
- Updated review table header

**Files Modified:**
- `components/wizard/steps/Step4Equipment.tsx`
- `components/wizard/steps/Step7Review.tsx`

## Current Status

### ✅ Working
- Wizard navigation (all 7 steps)
- Form validation
- CEP lookup (ViaCEP integration)
- Equipment list management
- Services checklist
- Financial information
- Review and data display
- Public contract creation (POST /api/contracts)

### ⚠️ Needs Configuration
- Google Maps API key in Vercel
- All other environment variables

### 🔧 To Test
- End-to-end contract creation
- Email signature flow
- PDF generation

## Vercel Deployment Checklist

### 1. Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjYyNzEsImV4cCI6MjA4NTgwMjI3MX0.21Ya1JlkVi_v1mQ4puMdukauqc4QcX59VqtnqWfELp8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqZ29ub2FrYXB4bGVyeWpkaHhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIyNjI3MSwiZXhwIjoyMDg1ODAyMjcxfQ.Om0iqnkY-bdoPXV5__AgqhJWqASmnUCeGJhAVXmDvXk

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw

# SMTP
SMTP_HOST=mail.clubemkt.digital
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=nao-responda@clubemkt.digital
SMTP_PASS=Advance1773
SMTP_FROM=nao-responda@clubemkt.digital
SMTP_FROM_NAME=ISOTEC

# App URL
NEXT_PUBLIC_APP_URL=https://contratofacil.clubemkt.digital
```

### 2. Google Maps API Configuration

The Google Maps API key needs to have the following APIs enabled in Google Cloud Console:

1. **Maps JavaScript API** - For the interactive map
2. **Geocoding API** - For address to coordinates conversion
3. **Places API** - For address autocomplete (if needed)

**API Key Restrictions:**
- Application restrictions: HTTP referrers
- Add your Vercel domains:
  - `https://contratofacil.clubemkt.digital/*`
  - `https://contratofacil.vercel.app/*`
  - `https://*.vercel.app/*` (for preview deployments)

### 3. Verify Deployment

After deploying, test the following:

1. **Test Google Maps API Key:**
   - Visit: `https://your-domain.vercel.app/test-maps`
   - Should show "✓ API Key is configured"

2. **Test Wizard:**
   - Visit: `https://your-domain.vercel.app/wizard`
   - Fill out all 7 steps
   - Verify Google Maps loads in Step 2
   - Submit the form in Step 7
   - Should redirect to contract view page

3. **Test Contract Creation:**
   - Open browser console (F12)
   - Check for any errors
   - Verify contract is created in Supabase

## Troubleshooting

### Google Maps Shows "Ops! Algo deu errado"

**Possible Causes:**
1. API key not set in Vercel environment variables
2. API key doesn't have Maps JavaScript API enabled
3. Domain not whitelisted in API key restrictions
4. Billing not enabled on Google Cloud project

**Solution:**
1. Visit `/test-maps` to check if API key is configured
2. Go to Google Cloud Console
3. Enable Maps JavaScript API
4. Check API key restrictions
5. Add Vercel domain to allowed referrers
6. Ensure billing is enabled

### 405 Method Not Allowed Errors

**Possible Causes:**
1. Old deployment cached
2. Middleware configuration issue
3. API route not handling method correctly

**Solution:**
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Vercel deployment logs
4. Verify middleware is deployed correctly

### Contract Creation Fails

**Possible Causes:**
1. Missing environment variables
2. Supabase connection issue
3. Validation errors
4. Database permissions

**Solution:**
1. Check browser console for error messages
2. Verify all environment variables are set
3. Check Vercel function logs
4. Test Supabase connection with verification script

## Testing Checklist

- [ ] Visit `/test-maps` - API key should be configured
- [ ] Visit `/wizard` - Page loads without errors
- [ ] Step 1: Fill contractor information
- [ ] Step 2: CEP lookup works, Google Maps loads
- [ ] Step 3: Project specifications
- [ ] Step 4: Add equipment items (Fabricante field)
- [ ] Step 5: Select services
- [ ] Step 6: Enter financial information
- [ ] Step 7: Review all data, submit form
- [ ] Contract created successfully
- [ ] Redirected to contract view page
- [ ] Email sent (if configured)

## Files Changed

### Middleware
- `middleware.ts` - Allow public contract creation

### Wizard Components
- `components/wizard/steps/Step4Equipment.tsx` - Changed Unidade to Fabricante
- `components/wizard/steps/Step7Review.tsx` - Updated table header
- `app/wizard/page.tsx` - Improved error handling

### Google Maps
- `lib/services/googlemaps.ts` - Added debugging logs
- `components/wizard/GoogleMapsLocationPicker.tsx` - Enhanced error messages

### Test Pages
- `app/test-maps/page.tsx` - NEW: Test page for API key verification

### Documentation
- `docs/WIZARD_FIXES.md` - Detailed fix documentation
- `docs/WIZARD_DEPLOYMENT_GUIDE.md` - This file

## Deployment Commands

```bash
# Build locally to verify
npm run build

# Commit changes
git add -A
git commit -m "Fix wizard issues and add deployment guide"
git push origin main

# Vercel will auto-deploy from GitHub
# Or manually deploy:
vercel --prod
```

## Support

If you encounter issues:

1. Check browser console for errors
2. Check Vercel function logs
3. Visit `/test-maps` to verify API key
4. Review this guide for troubleshooting steps
5. Check Supabase logs for database errors

---

**Last Updated:** February 4, 2026  
**Status:** Ready for production deployment  
**Commit:** 3cca9f1 - "Add Google Maps test page and fix middleware matcher"
