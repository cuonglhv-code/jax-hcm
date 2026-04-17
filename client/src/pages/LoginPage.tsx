import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../shared/components/Button';
import { Input } from '../shared/components/Input';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required')
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMsg('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="card max-w-sm w-full shadow-md p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-display text-xl font-bold mb-4">
            J
          </div>
          <h1 className="font-display text-xl font-bold text-text-base">Welcome back</h1>
          <p className="text-sm text-text-muted mt-1">Sign in to Jaxtina HCM</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input 
            {...register('email')}
            placeholder="Email address"
            prefixIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
          />
          <Input 
            {...register('password')}
            type={showPwd ? "text" : "password"}
            placeholder="Password"
            prefixIcon={<Lock className="w-4 h-4" />}
            suffixIcon={
              <button 
                type="button" 
                onClick={() => setShowPwd(!showPwd)} 
                className="focus:outline-none hover:text-text-base transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.password?.message}
          />

          <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
            Sign in
          </Button>

          {errorMsg && (
            <div className="p-3 bg-error/10 border border-error/20 text-error text-sm rounded-md text-center">
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
