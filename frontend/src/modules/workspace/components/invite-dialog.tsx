'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ModalActions } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inviteMemberSchema, InviteMemberFormData } from '../schemas';

interface InviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InviteMemberFormData) => Promise<void>;
  isLoading?: boolean;
  memberRoleId?: string;
}

export function InviteDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  memberRoleId,
}: InviteDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      roleId: memberRoleId || '',
    },
  });

  const handleFormSubmit = async (data: InviteMemberFormData) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Member">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="member@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <input type="hidden" {...register('roleId')} />

        <ModalActions>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Send Invite
          </Button>
        </ModalActions>
      </form>
    </Modal>
  );
}
