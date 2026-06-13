'use client';

import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dropdown } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { WorkspaceMember } from '../types';
import { formatDate } from '@/lib/utils';

interface MemberListProps {
  members: WorkspaceMember[];
  isLoading?: boolean;
  onRemoveMember?: (memberId: string) => void;
  onChangeRole?: (memberId: string, role: 'admin' | 'member') => void;
  canManageMembers?: boolean;
}

export function MemberList({
  members,
  isLoading,
  onRemoveMember,
  onChangeRole,
  canManageMembers = false,
}: MemberListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <EmptyState
        title="No members yet"
        description="Invite team members to collaborate in this workspace."
      />
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between py-4"
        >
          <div className="flex items-center gap-4">
            <Avatar
              src={member.user.avatarUrl}
              name={member.user.displayName}
              size="md"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.user.displayName}
              </p>
              <p className="text-sm text-gray-500">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant={
                member.role.name === 'Workspace Owner'
                  ? 'primary'
                  : member.role.name === 'Workspace Admin'
                  ? 'success'
                  : 'default'
              }
            >
              {member.role.name}
            </Badge>

            {canManageMembers && member.role.name !== 'Workspace Owner' && (
              <Dropdown
                trigger={
                  <button className="p-1 text-gray-400 hover:text-gray-500">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                }
                items={[
                  {
                    label: 'Remove',
                    onClick: () => onRemoveMember?.(member.id),
                    icon: <Trash2 className="h-4 w-4" />,
                    danger: true,
                  },
                ]}
                align="right"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
