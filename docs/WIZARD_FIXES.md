# Wizard Fixes - February 4, 2026

## Issues Fixed

### 1. Changed "Unidade" to "Fabricante" in Equipment Step
**Location:** Step 4 (Equipment List)

**Changes:**
- Updated label from "Unidade" to "Fabricante"
- Changed placeholder from "un" to "Ex: RONMA SOLAR"
- Removed datalist with common units (un, kg, m, etc.)
- Updated default value from 'un' to empty string
- Updated review table header to show "Fabricante" instead of "Unidade"

**Files Modified:**
- `components/wizard/steps/Step4Equipment.tsx`
- `components/wizard/steps/Step7Review.tsx`

### 2. Improved Error Handling for Form Submission
**Location:** Step 7 (Review and Submit)

**Changes:**
- Added better error handling for API responses
- Filter out services with `included: false` before sending to API
- Properly format installation date as ISO string
- Added detailed console logging for debugging
- Improved error messages with try-catch for JSON parsing
- Show actual server error messages to user

**Files Modified:**
- `app/wizard/page.tsx`

### 3. Enhanced Google Maps Debugging
**Location:** Step 2 (Address - Map Component)

**Changes:**
- Added console logging to track Google Maps initialization
- Improved error messages for missing API key
- Added 'marker' and 'maps' to the libraries list
- Better error handling with descriptive messages
- Log API key prefix for verification (first 10 characters)

**Files Modified:**
- `lib/services/googlemaps.ts`
- `components/wizard/GoogleMapsLocationPicker.tsx`

## Testing Instructions

### Test Google Maps Loading:
1. Open browser console (F12)
2. Navigate to `/wizard`
3. Go to Step 2 (Address)
4. Check console for:
   - "Initializing Google Maps..."
   - "Loader created, importing libraries..."
   - "Libraries loaded successfully"
   - "Map created successfully"

If you see errors:
- Check that `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set in environment variables
- Verify the API key is valid and has Maps JavaScript API enabled
- Check browser console for specific error messages

### Test Form Submission:
1. Fill out all wizard steps
2. On Step 7 (Review), click "Criar Contrato"
3. Check browser console for:
   - "Submitting contract data:" with the full payload
   - "Response status:" with HTTP status code
   - "Response text:" with server response

If you see "Invalid response from server":
- Check the console logs for the actual response text
- Verify all required fields are filled
- Check that services array is not empty
- Ensure installation date is valid

## Environment Variables Required

Make sure these are set in Vercel:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Known Issues

### Google Maps Not Loading
**Possible Causes:**
1. API key not set or invalid
2. API key doesn't have Maps JavaScript API enabled
3. Domain restrictions on API key (Vercel domain not whitelisted)
4. Billing not enabled on Google Cloud project

**Solution:**
1. Go to Google Cloud Console
2. Enable Maps JavaScript API
3. Check API key restrictions
4. Add Vercel domain to allowed referrers
5. Ensure billing is enabled

### "Invalid response from server" Error
**Possible Causes:**
1. Server returning non-JSON response
2. Server error (500) with HTML error page
3. Network timeout
4. CORS issues

**Solution:**
- Check browser console for actual response text
- Check Vercel deployment logs for server errors
- Verify all environment variables are set correctly

## Deployment Status

- ✅ Code changes committed and pushed to GitHub
- ✅ Build passes locally
- ⏳ Waiting for Vercel deployment
- ⏳ Need to verify Google Maps loads in production
- ⏳ Need to test form submission in production

## Next Steps

1. Deploy to Vercel (should auto-deploy from GitHub)
2. Test Google Maps loading in production
3. Test form submission end-to-end
4. Verify contract creation and email sending
5. Test on mobile devices

---

**Commit:** 67f436f - "Improve error handling and Google Maps debugging"
**Date:** February 4, 2026
**Status:** Ready for production testing
