'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/providers/auth-provider';
import { useWorkspaces } from '@/modules/workspace/queries';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: workspaces, isLoading } = useWorkspaces();

  const stats = [
    { name: 'Total Projects', value: '-', icon: FolderKanban, color: 'text-primary-600', bg: 'bg-primary-100' },
    { name: 'Tasks Completed', value: '-', icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100' },
    { name: 'In Progress', value: '-', icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100' },
    { name: 'Overdue Tasks', value: '-', icon: AlertCircle, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}!`}
        description="Here's an overview of your projects and tasks."
        actions={
          <Link href="/workspace">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Workspaces */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Workspaces</h2>
              <Link
                href="/workspace"
                className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : workspaces && workspaces.length > 0 ? (
              <div className="space-y-3">
                {workspaces.slice(0, 5).map((workspace) => (
                  <Link
                    key={workspace.id}
                    href={`/workspace/${workspace.id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <FolderKanban className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{workspace.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-[200px]">
                          {workspace.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No workspaces yet</p>
                <Link href="/workspace">
                  <Button variant="secondary" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workspace
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/workspace"
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <Plus className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Workspace</p>
                  <p className="text-sm text-gray-500">Set up a new workspace for your team</p>
                </div>
              </Link>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 opacity-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                  <FolderKanban className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create Project</p>
                  <p className="text-sm text-gray-500">Start a new project in a workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 opacity-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                  <CheckCircle className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">View Reports</p>
                  <p className="text-sm text-gray-500">Check your project analytics</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
