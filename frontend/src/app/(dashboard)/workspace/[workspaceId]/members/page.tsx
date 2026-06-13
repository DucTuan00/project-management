'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { MemberList } from '@/modules/workspace/components/member-list';
import { InviteDialog } from '@/modules/workspace/components/invite-dialog';
import {
  useWorkspace,
  useWorkspaceMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/modules/workspace/queries';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/providers/auth-provider';
import { InviteMemberFormData } from '@/modules/workspace/schemas';

export default function WorkspaceMembersPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: workspace } = useWorkspace(workspaceId);
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const inviteMember = useInviteMember(workspaceId);
  const updateMemberRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  const isOwner = members?.some(
    (m) => m.userId === user?.id && m.role === 'owner'
  );

  const handleInvite = async (data: InviteMemberFormData) => {
    try {
      await inviteMember.mutateAsync(data);
      setIsInviteOpen(false);
      toast('Invitation sent successfully', 'success');
    } catch (error) {
      toast('Failed to send invitation', 'error');
    }
  };

  const handleChangeRole = async (memberId: string, role: 'admin' | 'member') => {
    try {
      await updateMemberRole.mutateAsync({ memberId, data: { role } });
      toast('Role updated successfully', 'success');
    } catch (error) {
      toast('Failed to update role', 'error');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember.mutateAsync(memberId);
        toast('Member removed successfully', 'success');
      } catch (error) {
        toast('Failed to remove member', 'error');
      }
    }
  };

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage your workspace members"
        breadcrumbs={[
          { label: 'Workspaces', href: '/workspace' },
          { label: workspace?.name || 'Workspace', href: `/workspace/${workspaceId}` },
          { label: 'Members' },
        ]}
        actions={
          isOwner && (
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )
        }
      />

      <div className="max-w-3xl">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <MemberList
            members={members || []}
            isLoading={isLoading}
            canManageMembers={isOwner}
            onChangeRole={handleChangeRole}
            onRemoveMember={handleRemoveMember}
          />
        </div>
      </div>

      <InviteDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onSubmit={handleInvite}
        isLoading={inviteMember.isPending}
      />
    </div>
  );
}
