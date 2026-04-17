import React from 'react';
import { ShieldOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';
import { useAuth } from '../contexts/AuthContext';

export default function Page403() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 text-center">
      <ShieldOff className="w-16 h-16 text-error mb-4" />
      <h1 className="font-display font-bold text-2xl text-text-base mb-2">Access Denied</h1>
      <p className="text-text-muted mb-8 max-w-md">
        You don't have permission to view this page. If you think this is a mistake, please contact your system administrator.
      </p>
      
      {user && (
        <div className="mb-8 p-4 bg-surface rounded-lg border border-border inline-block">
          <p className="text-sm text-text-muted">Current Role</p>
          <p className="font-medium text-text-base capitalize">{user.role.replace('_', ' ')}</p>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
        <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
