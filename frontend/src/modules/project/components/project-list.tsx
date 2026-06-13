'use client';

import React from 'react';
import Link from 'next/link';
import { FolderKanban, MoreHorizontal, Trash2, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Project } from '../types';
import { formatDate } from '@/lib/utils';

interface ProjectListProps {
  projects: Project[];
  workspaceId: string;
  isLoading?: boolean;
  onCreateProject?: () => void;
  onDeleteProject?: (projectId: string) => void;
}

export function ProjectList({
  projects,
  workspaceId,
  isLoading,
  onCreateProject,
  onDeleteProject,
}: ProjectListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create a project to start organizing your work."
        action={
          onCreateProject
            ? { label: 'Create Project', onClick: onCreateProject }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="transition-shadow hover:shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <Link
                href={`/project/${project.id}`}
                className="flex items-start gap-4 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <FolderKanban className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {project.name}
                  </h3>
                  <Badge variant="default">{project.key}</Badge>
                </div>
              </Link>

              <Dropdown
                trigger={
                  <button className="p-1 text-gray-400 hover:text-gray-500">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                }
                items={[
                  {
                    label: 'Settings',
                    icon: <Settings className="h-4 w-4" />,
                    onClick: () => {},
                  },
                  {
                    label: 'Delete',
                    icon: <Trash2 className="h-4 w-4" />,
                    onClick: () => onDeleteProject?.(project.id),
                    danger: true,
                  },
                ]}
                align="right"
              />
            </div>

            <p className="mt-4 text-sm text-gray-500 line-clamp-2">
              {project.description || 'No description'}
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <Badge variant={project.status === 'active' ? 'success' : 'default'}>
                {project.status}
              </Badge>
              <span>Created {formatDate(project.createdAt)}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
