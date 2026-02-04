# Deployment Architecture

## Current Deployment (ISOTEC Single Tenant)

This photovoltaic contract system is being developed as the first tenant for a multi-tenant SaaS platform.

### Production URL
- **Primary URL**: `contratofacil.clubemkt.digital/isotec`
- **Platform Base**: `contratofacil.clubemkt.digital`
- **Platform Name**: ContratoFacil

### Architecture Overview

```
contratofacil.clubemkt.digital/
├── isotec/                    # ISOTEC tenant (this project)
│   ├── dashboard/            # Admin dashboard
│   ├── contracts/[uuid]      # Public contract view
│   └── api/                  # API routes
└── [future-tenants]/         # Additional tenants (to be developed)
```

## Multi-Tenant SaaS Development

The multi-tenant architecture will be developed **at the end of this spec** and will include:

### Planned Features
1. **Tenant Isolation**
   - Separate database schemas or row-level tenant filtering
   - Tenant-specific branding and configuration
   - Isolated data and user management

2. **Tenant Management**
   - Tenant registration and onboarding
   - Custom domain support (e.g., isotec.contratofacil.com)
   - Tenant-specific settings and customization

3. **Shared Infrastructure**
   - Single Next.js application serving all tenants
   - Shared authentication system with tenant context
   - Centralized billing and subscription management

4. **Routing Strategy**
   - Path-based routing: `/[tenant]/...`
   - Subdomain routing: `[tenant].contratofacil.clubemkt.digital`
   - Custom domain support

### Current Implementation (Single Tenant)

For now, the application is being developed as a single-tenant system for ISOTEC:
- All routes are tenant-agnostic
- No tenant context in database queries
- Direct deployment without multi-tenant middleware

### Migration Path

When converting to multi-tenant:
1. Add `tenant_id` column to all tables
2. Update RLS policies to include tenant filtering
3. Add tenant middleware for route resolution
4. Implement tenant configuration system
5. Add tenant management dashboard
6. Update all queries to include tenant context

## Deployment Configuration

### Cloudflare Pages

The application will be deployed on Cloudflare Pages with:
- Edge caching for static assets
- Serverless functions for API routes
- Custom domain: `contratofacil.clubemkt.digital`
- Path-based routing to `/isotec`

### Environment Variables (Production)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kjgonoakapxleryjdhxb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-role-key]

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCYQ1hJeHKqWUosvULfsWx6E3xzPfVBFQw

# Application URL
NEXT_PUBLIC_APP_URL=https://contratofacil.clubemkt.digital/isotec

# GOV.BR OAuth
GOVBR_CLIENT_ID=[to-be-configured]
GOVBR_CLIENT_SECRET=[to-be-configured]
GOVBR_REDIRECT_URI=https://contratofacil.clubemkt.digital/isotec/api/signatures/govbr/callback
```

### Next.js Configuration for Path Prefix

When deploying to `/isotec` path, update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  basePath: '/isotec',
  assetPrefix: '/isotec',
  // ... other config
};
```

## Timeline

1. **Phase 1 (Current)**: Develop ISOTEC single-tenant system
2. **Phase 2 (End of Spec)**: Implement multi-tenant architecture
3. **Phase 3 (Future)**: Onboard additional tenants

## Notes

- The current development focuses on ISOTEC-specific features
- Multi-tenant considerations are documented but not yet implemented
- Database schema is designed to be easily extended with tenant_id
- All tenant-specific branding (logos, colors) should be configurable

