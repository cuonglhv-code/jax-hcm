import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Users, DollarSign, UserPlus, TrendingUp, Calendar,
  BookOpen, LayoutDashboard, ChevronLeft, ChevronRight,
  Settings, LogOut, Building2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './Avatar';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/' },
  { label: 'Employees', icon: Users, to: '/employees' },
  { label: 'Payroll', icon: DollarSign, to: '/payroll', roles: ['super_admin', 'hr_manager'] },
  { label: 'Recruitment', icon: UserPlus, to: '/recruitment', roles: ['super_admin', 'hr_manager', 'line_manager'] },
  { label: 'Performance', icon: TrendingUp, to: '/performance' },
  { label: 'Leave', icon: Calendar, to: '/leave' },
  { label: 'Learning', icon: BookOpen, to: '/learning' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role ?? ''),
  );

  return (
    <aside
      className={clsx(
        'flex flex-col h-screen bg-white dark:bg-surface-dark-card border-r border-gray-100 dark:border-surface-dark-border transition-all duration-300 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Logo */}
      <div className={clsx('flex items-center gap-3 px-4 h-16 border-b border-gray-100 dark:border-surface-dark-border', collapsed && 'justify-center')}>
        <div className="size-9 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow">
          <Building2 className="size-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">Jaxtina HCM</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Human Capital</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx('nav-item', isActive && 'active', collapsed && 'justify-center px-2')
            }
          >
            <item.icon className="size-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 dark:border-surface-dark-border p-3 space-y-1">
        <NavLink
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={({ isActive }) =>
            clsx('nav-item', isActive && 'active', collapsed && 'justify-center px-2')
          }
        >
          <Settings className="size-5 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx('nav-item w-full', collapsed && 'justify-center px-2')}
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User */}
        {user && (
          <div className={clsx('flex items-center gap-3 p-2 rounded-lg', collapsed && 'justify-center')}>
            <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
