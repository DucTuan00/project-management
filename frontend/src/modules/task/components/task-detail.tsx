'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Task } from '../types';
import { useUpdateTask, useDeleteTask } from '../queries';
import { updateTaskSchema, UpdateTaskFormData } from '../schemas';
import { CommentThread } from '@/modules/comment/components/comment-thread';
import { AttachmentList } from '@/modules/attachment/components/attachment-list';
import {
  PRIORITY_COLORS,
  TYPE_COLORS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  TYPE_LABELS,
  TASK_PRIORITIES,
  TASK_TYPES,
} from '@/lib/constants';
import { formatDate, cn } from '@/lib/utils';

interface TaskDetailProps {
  task: Task;
  projectKey: string;
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

export function TaskDetail({ task, projectKey, members = [] }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const updateTask = useUpdateTask(task.projectId);
  const deleteTask = useDeleteTask(task.projectId);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateTaskFormData>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      type: task.type,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId || null,
      storyPoints: task.storyPoints || null,
      dueDate: task.dueDate || null,
    },
  });

  const onSubmit = async (data: UpdateTaskFormData) => {
    try {
      await updateTask.mutateAsync({ taskId: task.id, data });
      setIsEditing(false);
      toast('Task updated successfully', 'success');
    } catch (error) {
      toast('Failed to update task', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(task.id);
        toast('Task deleted successfully', 'success');
      } catch (error) {
        toast('Failed to delete task', 'error');
      }
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        data: { status: status as any },
      });
      toast('Status updated', 'success');
    } catch (error) {
      toast('Failed to update status', 'error');
    }
  };

  if (isEditing) {
    return (
      <Box
        sx={{
          borderRadius: '12px',
          border: '1px solid #c5c0b1',
          backgroundColor: '#fffefb',
          p: 3,
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#201515', fontSize: '18px' }}>
              Edit Task
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
              >
                <X size={16} style={{ marginRight: '4px' }} />
                Cancel
              </Button>
              <Button type="submit" loading={updateTask.isPending}>
                <Check size={16} style={{ marginRight: '4px' }} />
                Save
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              {...register('title')}
              style={{
                width: '100%',
                fontSize: '20px',
                fontWeight: 600,
                color: '#201515',
                border: 'none',
                borderBottom: '1px solid #c5c0b1',
                paddingBottom: '8px',
                outline: 'none',
                backgroundColor: 'transparent',
              }}
              placeholder="Task title"
            />

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                gap: 2,
              }}
            >
              <Select
                label="Status"
                options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.status?.message}
                {...register('status')}
              />

              <Select
                label="Priority"
                options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.priority?.message}
                {...register('priority')}
              />

              <Select
                label="Type"
                options={Object.entries(TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.type?.message}
                {...register('type')}
              />

              <Select
                label="Assignee"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...members.map((m) => ({
                    value: m.id,
                    label: m.name,
                  })),
                ]}
                error={errors.assigneeId?.message}
                {...register('assigneeId')}
              />

              <input
                type="number"
                {...register('storyPoints', { valueAsNumber: true })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #c5c0b1',
                  fontSize: '14px',
                  backgroundColor: '#fffefb',
                }}
                placeholder="Story Points"
              />

              <input
                type="date"
                {...register('dueDate')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #c5c0b1',
                  fontSize: '14px',
                  backgroundColor: '#fffefb',
                }}
              />
            </Box>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#605d52', mb: 0.5, fontSize: '14px' }}>
                Description
              </Typography>
              <textarea
                {...register('description')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #c5c0b1',
                  fontSize: '14px',
                  minHeight: '150px',
                  backgroundColor: '#fffefb',
                }}
                placeholder="Add a description..."
              />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        backgroundColor: '#fffefb',
        p: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body2" sx={{ color: '#939084', fontSize: '14px' }}>
              {projectKey}-{task.id.slice(-4).toUpperCase()}
            </Typography>
            <Badge className={TYPE_COLORS[task.type]}>{TYPE_LABELS[task.type]}</Badge>
          </Box>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: 600, color: '#201515', fontSize: '20px' }}>
            {task.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit2 size={16} style={{ marginRight: '4px' }} />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} style={{ marginRight: '4px' }} />
            Delete
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Description */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', fontSize: '14px' }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, color: '#605d52', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
              {task.description || 'No description provided.'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Status */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
              Status
            </Typography>
            <Select
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={task.status}
              onChange={handleStatusChange}
            />
          </Box>

          {/* Priority */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
              Priority
            </Typography>
            <Badge className={PRIORITY_COLORS[task.priority]}>
              {PRIORITY_LABELS[task.priority]}
            </Badge>
          </Box>

          {/* Assignee */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
              Assignee
            </Typography>
            {task.assignee ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={task.assignee.avatar}
                  name={task.assignee.name}
                  size="sm"
                />
                <Typography variant="body2" sx={{ color: '#605d52', fontSize: '14px' }}>
                  {task.assignee.name}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#c5c0b1', fontSize: '14px' }}>
                Unassigned
              </Typography>
            )}
          </Box>

          {/* Due Date */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
              Due Date
            </Typography>
            {task.dueDate ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar style={{ fontSize: '16px', color: '#939084' }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: new Date(task.dueDate) < new Date() && task.status !== 'done'
                      ? '#dc2626'
                      : '#605d52',
                    fontSize: '14px',
                  }}
                >
                  {formatDate(task.dueDate)}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: '#c5c0b1', fontSize: '14px' }}>
                No due date
              </Typography>
            )}
          </Box>

          {/* Story Points */}
          {task.storyPoints && (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
                Story Points
              </Typography>
              <Badge variant="primary">{task.storyPoints}</Badge>
            </Box>
          )}

          {/* Reporter */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#939084', mb: 1, fontSize: '14px' }}>
              Reporter
            </Typography>
            {task.reporter && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={task.reporter.avatar}
                  name={task.reporter.name}
                  size="sm"
                />
                <Typography variant="body2" sx={{ color: '#605d52', fontSize: '14px' }}>
                  {task.reporter.name}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Dates */}
          <Divider sx={{ borderColor: '#c5c0b1', my: 1 }} />
          <Box>
            <Typography variant="caption" sx={{ color: '#939084', display: 'block', mb: 0.5 }}>
              Created: {formatDate(task.createdAt)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#939084' }}>
              Updated: {formatDate(task.updatedAt)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Comments and Attachments sections */}
      <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <CommentThread taskId={task.id} />
        <AttachmentList taskId={task.id} />
      </Box>
    </Box>
  );
}
