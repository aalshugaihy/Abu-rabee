import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../data/types';

/**
 * Renders children only when the current user matches one of the allowed
 * roles. In localStorage mode (no backend) everyone can see and write, so
 * `RoleGate` is effectively a passthrough.
 */
export default function RoleGate({
  roles,
  fallback = null,
  children,
}: {
  roles: Role[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { apiAvailable, hasRole } = useAuth();
  if (!apiAvailable) return <>{children}</>;
  if (!hasRole(...roles)) return <>{fallback}</>;
  return <>{children}</>;
}
