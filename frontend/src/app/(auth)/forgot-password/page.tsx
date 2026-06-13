'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { authApi } from '@/modules/auth/api';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/modules/auth/schemas';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authApi.forgotPassword(data);
      setIsSubmitted(true);
      toast('If an account exists, you will receive a password reset email.', 'success');
    } catch (error) {
      toast('An error occurred. Please try again.', 'error');
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 mx-auto mb-4">
          <Mail className="h-6 w-6 text-success-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Check your email
        </h1>
        <p className="text-gray-500 mb-8">
          If an account exists with that email, we've sent a password reset link.
        </p>
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to sign in
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Forgot your password?
      </h1>
      <p className="text-gray-500 mb-8">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="h-5 w-5" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button
          type="submit"
          loading={isSubmitting}
          className="w-full"
          size="lg"
        >
          Send reset link
        </Button>
      </form>
    </div>
  );
}
