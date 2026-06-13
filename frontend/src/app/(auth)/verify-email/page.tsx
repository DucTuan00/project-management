'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { authApi } from '@/modules/auth/api';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Verification failed. Please try again.'
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="text-center">
      {status === 'loading' && (
        <>
          <LoadingSpinner size="lg" />
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
            Verifying your email...
          </h1>
          <p className="text-gray-500">Please wait a moment.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-100 mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Email Verified!
          </h1>
          <p className="text-gray-500 mb-8">{message}</p>
          <Link href="/login">
            <Button size="lg">Continue to Sign In</Button>
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 mx-auto mb-4">
            <XCircle className="h-6 w-6 text-danger-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h1>
          <p className="text-gray-500 mb-8">{message}</p>
          <Link href="/login">
            <Button size="lg">Back to Sign In</Button>
          </Link>
        </>
      )}
    </div>
  );
}
