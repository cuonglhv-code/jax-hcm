import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_HIERARCHY } from '@hcm/shared';
import Page403 from '../pages/Page403';

interface RoleGuardProps {
  allowedRoles: string[];
  children?: React.ReactNode;
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Page403 />;

  if (user.role === 'super_admin') {
    return <Outlet />;
  }

  const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
  const minRequiredLevel = Math.min(
    ...allowedRoles.map(r => ROLE_HIERARCHY[r as keyof typeof ROLE_HIERARCHY] || 999)
  );

  if (!allowedRoles.includes(user.role) && userLevel < minRequiredLevel) {
    return <Page403 />;
  }

  return children ? <>{children}</> : <Outlet />;
}
