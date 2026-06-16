'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Mail, Lock, User } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui/toast';
import { registerSchema, RegisterFormData } from '../schemas';

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.displayName, data.email, data.password);
      toast('Account created successfully!', 'success');
    } catch (error) {
      toast(
        error instanceof Error ? error.message : 'Registration failed',
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
      <Controller
        name="displayName"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <Input
            {...field}
            label="Full Name"
            type="text"
            placeholder="John Doe"
            leftIcon={<User size={20} />}
            error={errors.displayName?.message}
          />
        )}
      />

      <Controller
        name="email"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <Input
            {...field}
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={20} />}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <Input
            {...field}
            label="Password"
            type="password"
            placeholder="Create a password"
            leftIcon={<Lock size={20} />}
            error={errors.password?.message}
          />
        )}
      />

      <Controller
        name="confirmPassword"
        control={control}
        defaultValue=""
        render={({ field }) => (
          <Input
            {...field}
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            leftIcon={<Lock size={20} />}
            error={errors.confirmPassword?.message}
          />
        )}
      />

      <Button
        type="submit"
        loading={isSubmitting}
        className="w-full"
        size="lg"
      >
        Create account
      </Button>

      <Typography
        variant="body2"
        sx={{
          textAlign: 'center',
          color: '#939084',
          fontSize: '14px',
        }}
      >
        Already have an account?{' '}
        <Link
          href="/login"
          style={{
            fontWeight: 500,
            color: '#ff4f00',
            textDecoration: 'none',
          }}
        >
          Sign in
        </Link>
      </Typography>
    </Box>
  );
}
