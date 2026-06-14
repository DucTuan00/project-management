'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { SocketProvider } from '@/providers/socket-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { LoadingPage } from '@/components/shared/loading-spinner';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Extract workspaceId from URL
  const workspaceMatch = pathname.match(/\/workspace\/([^/]+)/);
  const workspaceId = workspaceMatch?.[1];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar workspaceId={workspaceId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SocketProvider>
        <DashboardContent>{children}</DashboardContent>
      </SocketProvider>
    </AuthProvider>
  );
}
