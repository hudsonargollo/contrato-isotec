/**
 * Admin Layout
 * 
 * Provides authentication and layout for all admin pages
 * Uses AdminAuthWrapper to handle auth and AdminLayout for UI
 */

import { AdminAuthWrapper } from '@/components/ui/admin-auth-wrapper';

export default function AdminLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthWrapper>
      {children}
    </AdminAuthWrapper>
  );
}