'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { authApi } from '@/modules/auth/api';
import { resetPasswordSchema, ResetPasswordFormData } from '@/modules/auth/schemas';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast('Invalid or missing reset token', 'error');
      return;
    }

    try {
      await authApi.resetPassword({ token, password: data.password });
      setStatus('success');
      toast('Password reset successfully!', 'success');
    } catch (error) {
      setStatus('error');
      toast(
        error instanceof Error ? error.message : 'Failed to reset password',
        'error'
      );
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-success-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Password Reset Complete
        </h1>
        <p className="text-gray-500 mb-8">
          Your password has been reset successfully.
        </p>
        <Link href="/login">
          <Button size="lg">Sign In with New Password</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Reset your password
      </h1>
      <p className="text-gray-500 mb-8">
        Enter your new password below.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          name="password"
          control={control}
          defaultValue=""
          render={({ field }) => (
            <Input
              {...field}
              label="New Password"
              type="password"
              placeholder="Enter new password"
              leftIcon={<Lock className="h-5 w-5" />}
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
              placeholder="Confirm new password"
              leftIcon={<Lock className="h-5 w-5" />}
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
          Reset Password
        </Button>
      </form>
    </div>
  );
}
