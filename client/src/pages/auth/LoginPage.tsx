import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] p-12 bg-gradient-brand text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="size-6" />
          </div>
          <span className="text-xl font-bold">Jaxtina HCM</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Manage your people,<br />effortlessly.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            A complete human capital management platform for modern teams — from hiring to retirement.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Employees', value: '2,000+' },
            { label: 'Modules', value: '6' },
            { label: 'Uptime', value: '99.9%' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-white/60 text-sm mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-surface-dark">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="size-10 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Building2 className="size-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Jaxtina HCM</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h2>
            <p className="text-gray-500 mt-1 dark:text-gray-400">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@jaxtina.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-surface-dark-card dark:border-surface-dark-border dark:text-gray-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-surface-dark-card dark:border-surface-dark-border dark:text-gray-100 transition"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className="btn-brand w-full py-2.5 flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900">
            <p className="text-xs font-semibold text-brand-700 dark:text-brand-400 mb-2 uppercase tracking-wider">Demo credentials</p>
            <div className="space-y-1 text-xs text-brand-600 dark:text-brand-400 font-mono">
              <div>admin@jaxtina.com / Admin@123</div>
              <div>manager@jaxtina.com / Manager@123</div>
              <div>employee@jaxtina.com / Emp@123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
