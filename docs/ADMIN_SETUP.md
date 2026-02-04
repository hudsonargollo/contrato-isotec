# Admin User Setup Guide

This guide explains how to set up the admin user for the ISOTEC Photovoltaic Contract System.

## Admin Credentials

**Email:** `contato@clubemkt.digital`  
**Password:** `isotec1773`

---

## Setup Steps

### 1. Create Admin User in Supabase Auth

1. Go to [Supabase Dashboard](https://app.supabase.com/project/kjgonoakapxleryjdhxb/auth/users)
2. Click **"Add user"** → **"Create new user"**
3. Fill in the details:
   - **Email:** `contato@clubemkt.digital`
   - **Password:** `isotec1773`
   - **Auto Confirm User:** ✓ (check this box)
4. Click **"Create user"**
5. **Copy the User ID** (UUID) that appears

### 2. Create Admin Profile in Database

1. Go to [Supabase SQL Editor](https://app.supabase.com/project/kjgonoakapxleryjdhxb/sql/new)
2. Run this SQL (replace `USER_ID` with the UUID from step 1):

```sql
INSERT INTO public.profiles (id, email, full_name, role, mfa_enabled)
VALUES (
  'USER_ID'::uuid,
  'contato@clubemkt.digital',
  'Admin ISOTEC',
  'super_admin',
  false
);
```

### 3. Verify Setup

1. Go to the application: [Your App URL]
2. Click **"🔐 Login Admin"** on the homepage
3. Enter credentials:
   - Email: `contato@clubemkt.digital`
   - Password: `isotec1773`
4. Click **"Entrar"**
5. You should be redirected to the Admin Dashboard

---

## Troubleshooting

### "Email ou senha incorretos"

**Cause:** User not created in Supabase Auth or wrong credentials

**Solution:**
1. Verify user exists in [Supabase Auth Users](https://app.supabase.com/project/kjgonoakapxleryjdhxb/auth/users)
2. Check that "Email Confirmed" is ✓
3. Try resetting the password if needed

### "Access Denied" or Redirect Issues

**Cause:** Profile not created in database

**Solution:**
1. Check if profile exists:
```sql
SELECT * FROM public.profiles WHERE email = 'contato@clubemkt.digital';
```
2. If not found, run the INSERT query from Step 2 above

### Can't Access Admin Pages

**Cause:** RLS policies blocking access

**Solution:**
1. Verify the profile has `role = 'super_admin'`:
```sql
SELECT id, email, role FROM public.profiles WHERE email = 'contato@clubemkt.digital';
```
2. If role is wrong, update it:
```sql
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'contato@clubemkt.digital';
```

---

## Admin Features

Once logged in, you can:

- ✅ View all contracts
- ✅ Create new contracts via wizard
- ✅ Search and filter contracts
- ✅ View contract details and audit logs
- ✅ Download contract PDFs
- ✅ Export data (LGPD compliance)

---

## Security Notes

1. **Change the default password** after first login
2. **Enable MFA** for additional security (future feature)
3. **Never share admin credentials**
4. **Use strong, unique passwords**
5. **Regularly review audit logs**

---

## Quick Reference

| Item | Value |
|------|-------|
| Login URL | `/login` |
| Admin Dashboard | `/admin` |
| Contracts List | `/admin/contracts` |
| Create Contract | `/wizard` |
| Supabase Project | `kjgonoakapxleryjdhxb` |

---

**Last Updated:** February 4, 2026
