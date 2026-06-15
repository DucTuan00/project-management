'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { loginSchema, LoginFormData } from '../schemas';

export function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast('Welcome back!', 'success');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Login failed',
        'error'
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftIcon={<Mail size={20} />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        leftIcon={<Lock size={20} />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/forgot-password"
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#ff4f00',
            textDecoration: 'none',
          }}
        >
          Forgot password?
        </Link>
      </Box>

      <Button
        type="submit"
        loading={isSubmitting}
        className="w-full"
        size="lg"
      >
        Sign in
      </Button>

      <Typography
        variant="body2"
        sx={{
          textAlign: 'center',
          color: '#939084',
          fontSize: '14px',
        }}
      >
        Don't have an account?{' '}
        <Link
          href="/register"
          style={{
            fontWeight: 500,
            color: '#ff4f00',
            textDecoration: 'none',
          }}
        >
          Sign up
        </Link>
      </Typography>
    </Box>
  );
}
