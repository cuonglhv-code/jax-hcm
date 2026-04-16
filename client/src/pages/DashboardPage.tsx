import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, DollarSign, UserPlus, Calendar, TrendingUp, BookOpen, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function StatCard({ icon: Icon, label, value, sub, to, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; to?: string; color: string;
}) {
  const content = (
    <div className="glass-card p-5 hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`size-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="size-5 text-white" />
        </div>
        {to && <ArrowRight className="size-4 text-gray-400" />}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}

export function DashboardPage() {
  const { user } = useAuth();

  const { data: employeeData } = useQuery({
    queryKey: ['employees-count'],
    queryFn: () => api.get('/employees?limit=1').then(r => r.data),
  });

  const { data: leaveData } = useQuery({
    queryKey: ['leave-pending'],
    queryFn: () => api.get('/leave/requests?status=requested&limit=1').then(r => r.data),
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Good {getGreeting()}, {user?.firstName} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening across your organisation today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard icon={Users} label="Total Employees" value={employeeData?.meta?.total ?? '—'} to="/employees" color="bg-gradient-to-br from-brand-500 to-brand-700" />
        <StatCard icon={Calendar} label="Pending Leaves" value={leaveData?.meta?.total ?? '—'} to="/leave/requests" color="bg-gradient-to-br from-amber-500 to-orange-600" />
        <StatCard icon={UserPlus} label="Open Requisitions" value="—" to="/recruitment" color="bg-gradient-to-br from-violet-500 to-purple-700" />
        <StatCard icon={TrendingUp} label="Active Cycles" value="—" to="/performance" color="bg-gradient-to-br from-emerald-500 to-teal-700" />
        <StatCard icon={DollarSign} label="Next Payroll" value="—" to="/payroll" color="bg-gradient-to-br from-cyan-500 to-blue-700" />
        <StatCard icon={BookOpen} label="Training Alerts" value="—" to="/learning" color="bg-gradient-to-br from-rose-500 to-pink-700" />
      </div>

      {/* Quick actions */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Employee', to: '/employees', icon: Users },
            { label: 'New Requisition', to: '/recruitment', icon: UserPlus },
            { label: 'Request Leave', to: '/leave/requests', icon: Calendar },
            { label: 'Enrol in Course', to: '/learning', icon: BookOpen },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-surface-dark-border hover:border-brand-300 hover:bg-brand-50/50 dark:hover:border-brand-700 dark:hover:bg-brand-950/30 transition-colors group"
            >
              <action.icon className="size-5 text-brand-500 group-hover:text-brand-700" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="size-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton size-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-3 w-48 rounded" />
                <div className="skeleton h-2.5 w-32 rounded" />
              </div>
              <div className="skeleton h-2.5 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
