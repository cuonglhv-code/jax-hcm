import React from 'react';
import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/components/Button';

export default function Page404() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4 text-center">
      <FileQuestion className="w-16 h-16 text-text-faint mb-4" />
      <h1 className="font-display font-bold text-2xl text-text-base mb-2">Page not found</h1>
      <p className="text-text-muted mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
}
