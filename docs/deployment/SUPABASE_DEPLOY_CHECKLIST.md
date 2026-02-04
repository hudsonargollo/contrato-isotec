# Supabase Production Deployment - Quick Checklist

Use this checklist to ensure all steps are completed when deploying the database to production.

## Pre-Deployment

- [ ] Supabase CLI installed (`supabase --version`)
- [ ] Supabase account created
- [ ] Production project created/identified
- [ ] Database password saved securely
- [ ] Project reference ID noted

## Deployment Steps

### 1. Link Project
```bash
supabase link --project-ref <your-project-ref>
```
- [ ] Project linked successfully
- [ ] `.supabase/` directory created

### 2. Push Migrations
```bash
supabase db push
```
- [ ] All 6 migrations applied
- [ ] No errors in output

### 3. Verify Schema
- [ ] `profiles` table exists
- [ ] `contracts` table exists
- [ ] `contract_items` table exists
- [ ] `audit_logs` table exists
- [ ] `verification_codes` table exists
- [ ] All indexes created
- [ ] RLS enabled on all tables

### 4. Configure Backups
- [ ] Point-in-Time Recovery enabled (if Pro plan)
- [ ] Backup schedule verified
- [ ] Retention period set (7+ days)

### 5. Create Admin User
- [ ] Admin user created in Authentication
- [ ] User ID copied
- [ ] Profile record created in `profiles` table
- [ ] Role set to `super_admin`

### 6. Update Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` updated
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` updated
- [ ] `SUPABASE_SERVICE_ROLE_KEY` updated (keep secret!)
- [ ] Variables added to Cloudflare Pages
- [ ] Application redeployed

### 7. Test Connection
- [ ] CLI connection test passed
- [ ] Application can connect
- [ ] Admin login works
- [ ] Test contract creation works

### 8. Security Configuration
- [ ] RLS policies verified
- [ ] SSL enforced
- [ ] JWT expiry configured
- [ ] Rate limiting enabled
- [ ] CORS settings reviewed

### 9. Monitoring Setup
- [ ] Database metrics reviewed
- [ ] Alerts configured (if available)
- [ ] Error tracking enabled

## Post-Deployment

- [ ] Documentation updated
- [ ] Team notified
- [ ] Credentials shared securely
- [ ] Backup tested (optional but recommended)
- [ ] Performance baseline established

## Quick Commands Reference

```bash
# Check status
supabase status

# List migrations
supabase migration list --linked

# Connect to database
supabase db connect --linked

# Generate types
supabase gen types typescript --linked > lib/supabase/database.types.ts

# Create backup
supabase db dump --linked -f backup-$(date +%Y%m%d).sql
```

## Rollback Plan

If something goes wrong:

1. **Immediate**: Restore from PITR (Settings → Database → Backups)
2. **Manual**: Run backup SQL file
3. **Migration**: Use `supabase migration repair` to revert

## Success Criteria

✅ All migrations applied without errors
✅ RLS policies active and tested
✅ Admin user can sign in
✅ Test contract can be created
✅ Backups configured
✅ Monitoring active

## Next Steps

After database deployment:
1. Complete Task 17.1 - Configure GitHub Actions
2. Complete Task 17.2 - Configure Cloudflare Pages
3. Run end-to-end tests
4. Monitor for 24 hours
5. Document any issues

---

**Task**: 17.3 Deploy Supabase database
**Requirements**: 14.5
**Status**: Ready for deployment
