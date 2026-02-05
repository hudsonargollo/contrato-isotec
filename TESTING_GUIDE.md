# Testing Guide - ISOTEC Contract System

## Pre-Deployment Testing Checklist

### 1. Environment Variables Verification
Visit: `/test-maps`

**Expected Results:**
- ✅ "API Key is configured" message
- ✅ API key shows first 10 characters: `AIzaSyCYQ1...`
- ✅ All environment variables show "SET"

**If Failed:**
- Check Vercel environment variables
- Ensure `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw`
- Redeploy application

### 2. Google Maps Integration Test
Visit: `/wizard` → Step 2 (Address)

**Test Steps:**
1. Enter a valid Brazilian CEP (e.g., `01310-100`)
2. Click "Buscar Endereço"
3. Verify address fields are auto-filled
4. Check that Google Maps loads correctly
5. Click on the map to place a marker
6. Verify coordinates are displayed

**Expected Results:**
- ✅ CEP lookup works (ViaCEP integration)
- ✅ Google Maps loads without "Ops! Algo deu errado" error
- ✅ Map allows clicking to place markers
- ✅ Coordinates are displayed in format: `-23.55050000, -46.63330000`
- ✅ Marker can be dragged to adjust location

**If Failed:**
- Check browser console for errors
- Verify Google Maps API key is correct
- Ensure Maps JavaScript API is enabled in Google Cloud Console
- Check domain restrictions on API key

### 3. Complete Wizard Flow Test
Visit: `/wizard`

**Test Steps:**
1. **Step 1 - Contractor Info:**
   - Fill all required fields
   - Test CPF validation
   - Test email validation

2. **Step 2 - Address:**
   - Test CEP lookup
   - Test Google Maps integration
   - Place location marker

3. **Step 3 - Project Specs:**
   - Enter project KWp
   - Select installation date

4. **Step 4 - Equipment:**
   - Add equipment items
   - Verify "Fabricante" field (not "Unidade")
   - Test add/remove functionality

5. **Step 5 - Services:**
   - Select services from checklist
   - Verify pricing updates

6. **Step 6 - Financial:**
   - Enter contract value
   - Select payment method

7. **Step 7 - Review:**
   - Verify all data is displayed correctly
   - Check "Fabricante" column in equipment table
   - Submit contract

**Expected Results:**
- ✅ All steps navigate correctly
- ✅ Form validation works
- ✅ Data persists between steps
- ✅ Equipment shows "Fabricante" not "Unidade"
- ✅ Contract creation succeeds
- ✅ Redirects to contract view page

### 4. Contract Signature Test
After creating a contract:

**Test Steps:**
1. On contract view page, scroll to signature section
2. Enter email address
3. Click "Enviar Código"
4. Check email for verification code
5. Enter 6-digit code
6. Click "Verificar e Assinar"

**Expected Results:**
- ✅ Verification code email is sent
- ✅ Email includes PDF attachment of complete contract
- ✅ Code verification works
- ✅ Contract status updates to "Assinado"
- ✅ Confirmation email is sent with PDF attachment
- ✅ Success message is displayed

**If Failed:**
- Check SMTP configuration
- Verify email service logs
- Test with different email addresses
- Check spam/junk folders

### 5. Admin Panel Test
Visit: `/admin` (requires admin login)

**Test Steps:**
1. Login with admin credentials
2. Navigate to "Contratos" section
3. Verify contracts list displays
4. Test search functionality
5. Test status filtering
6. Click on contract to view details

**Expected Results:**
- ✅ Admin authentication works
- ✅ Contracts list loads correctly
- ✅ Search by name and CPF works
- ✅ Status filtering works
- ✅ Contract details page loads
- ✅ All contract information is displayed

### 6. PDF Generation Test
Visit any contract URL: `/contracts/[uuid]`

**Test Steps:**
1. Scroll to bottom of contract
2. Look for PDF download link or button
3. Click to download/view PDF
4. Verify PDF contains all contract information

**Expected Results:**
- ✅ PDF generates without errors
- ✅ PDF contains all contract data
- ✅ PDF formatting is correct
- ✅ ISOTEC branding is present

## Performance Testing

### 1. Page Load Speed
- Home page should load in < 2 seconds
- Wizard should load in < 3 seconds
- Admin panel should load in < 3 seconds

### 2. Mobile Responsiveness
Test on different screen sizes:
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1024px+ width)

**Expected Results:**
- ✅ All pages are responsive
- ✅ Touch targets are appropriate size
- ✅ Text is readable on all devices
- ✅ Navigation works on mobile

## Error Handling Testing

### 1. Network Errors
- Disconnect internet during form submission
- Verify error messages are displayed
- Verify retry functionality works

### 2. Invalid Data
- Submit forms with invalid data
- Verify validation messages
- Test edge cases (empty fields, special characters)

### 3. API Errors
- Test with invalid contract IDs
- Test with expired verification codes
- Verify appropriate error messages

## Browser Compatibility

Test on:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Security Testing

### 1. Authentication
- Verify admin routes require authentication
- Test unauthorized access attempts
- Verify session management

### 2. Data Validation
- Test SQL injection attempts
- Test XSS attempts
- Verify input sanitization

## Post-Deployment Verification

After successful deployment:

1. **Smoke Test:**
   - Visit home page
   - Complete one full wizard flow
   - Sign one contract
   - Check admin panel

2. **Monitor Logs:**
   - Check Vercel function logs
   - Check Supabase logs
   - Monitor error rates

3. **User Acceptance:**
   - Have stakeholders test the system
   - Collect feedback
   - Address any issues

## Troubleshooting Common Issues

### Google Maps Not Loading
1. Check API key configuration
2. Verify domain restrictions
3. Check billing status in Google Cloud
4. Enable required APIs (Maps JavaScript API, Geocoding API)

### Email Not Sending
1. Check SMTP configuration
2. Verify email credentials
3. Check spam folders
4. Test with different email providers

### Contract Creation Failing
1. Check Supabase connection
2. Verify database permissions
3. Check validation errors in console
4. Review API logs

### Admin Panel Not Loading
1. Verify authentication
2. Check admin user permissions
3. Review database queries
4. Check API endpoints

## Success Criteria

The system is ready for production when:
- ✅ All tests pass
- ✅ No critical errors in logs
- ✅ Performance meets requirements
- ✅ Security tests pass
- ✅ User acceptance is positive
- ✅ Documentation is complete

## Contact for Issues

If you encounter any issues during testing:
1. Check browser console for errors
2. Review this testing guide
3. Check deployment logs
4. Document the issue with steps to reproduce