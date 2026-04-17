import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Network, Building2, Wallet,
  ClipboardList, Percent, Briefcase, Kanban, SquareCheckBig,
  Star, Target, BarChart3, CalendarDays, CalendarRange,
  Settings2, Clock, BookOpen, GraduationCap, ListChecks, AlertTriangle,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
    ]
  },
  {
    label: 'PEOPLE',
    items: [
      { label: 'Employees', path: '/employees', icon: Users },
      { label: 'Org Chart', path: '/employees/org', icon: Network },
      { label: 'Departments', path: '/departments', icon: Building2 }
    ]
  },
  {
    label: 'PAYROLL',
    items: [
      { label: 'Overview', path: '/payroll', icon: Wallet },
      { label: 'Payroll Runs', path: '/payroll/runs', icon: ClipboardList },
      { label: 'Tax Rules', path: '/payroll/tax-rules', icon: Percent }
    ]
  },
  {
    label: 'RECRUITMENT',
    items: [
      { label: 'Requisitions', path: '/recruitment', icon: Briefcase },
      { label: 'Pipeline', path: '/recruitment/pipeline', icon: Kanban },
      { label: 'Onboarding', path: '/recruitment/onboarding', icon: SquareCheckBig }
    ]
  },
  {
    label: 'PERFORMANCE',
    items: [
      { label: 'Appraisals', path: '/performance', icon: Star },
      { label: 'Goals', path: '/performance/goals', icon: Target },
      { label: 'Dashboard', path: '/performance/dashboard', icon: BarChart3 }
    ]
  },
  {
    label: 'LEAVE',
    items: [
      { label: 'My Leave', path: '/leave', icon: CalendarDays },
      { label: 'Team Calendar', path: '/leave/calendar', icon: CalendarRange },
      { label: 'Admin', path: '/leave/admin', icon: Settings2 },
      { label: 'Attendance', path: '/leave/attendance', icon: Clock }
    ]
  },
  {
    label: 'LEARNING',
    items: [
      { label: 'Courses', path: '/learning', icon: BookOpen },
      { label: 'My Learning', path: '/learning/my', icon: GraduationCap },
      { label: 'Plans', path: '/learning/plans', icon: ListChecks },
      { label: 'Mandatory', path: '/learning/mandatory', icon: AlertTriangle }
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (o: boolean) => void }) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('hcm-sidebar-collapsed') === 'true';
  });
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('hcm-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  const widthClass = collapsed ? 'w-16' : 'w-60';
  const displayClass = mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0';

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-surface border-r border-border transition-all duration-300 ${widthClass} ${displayClass}`}>
        <div className="flex items-center justify-center h-16 shrink-0 border-b border-divider">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-display text-white font-bold text-lg">
            J
          </div>
          {!collapsed && <span className="ml-3 font-display font-bold text-lg tracking-wide text-text-base">Jaxtina HCM</span>}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} className="mb-6">
              {!collapsed && (
                <div className="px-5 mb-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <ul>
                {group.items.map((item, idxi) => (
                  <li key={idxi} className="px-2 mb-1 pl-0">
                    <NavLink
                      to={item.path}
                      end={item.path === '/dashboard'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        flex items-center py-2 px-3 rounded-lg transition-colors
                        ${isActive ? 'bg-surface-offset text-primary border-l-2 border-primary font-medium' : 'text-text-muted hover:bg-surface-offset/60 hover:text-text-base border-l-2 border-transparent'}
                      `}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-divider p-4 flex flex-col gap-4">
          {!collapsed && user && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium text-text-base truncate">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-text-muted truncate capitalize">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg hover:bg-surface-offset text-text-muted transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
    </>
  );
}
