import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldOff, ArrowLeft } from 'lucide-react';

export function Page403() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-gray-50 dark:bg-surface-dark">
      <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <ShieldOff className="size-10 text-red-500" />
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">Access Denied</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
          You don't have permission to view this page. Contact your administrator to request access.
        </p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}

export function Page404() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 bg-gray-50 dark:bg-surface-dark">
      <div className="text-9xl font-bold text-gray-200 dark:text-gray-800 select-none">404</div>
      <div className="text-center -mt-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Page not found</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-medium text-sm"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
