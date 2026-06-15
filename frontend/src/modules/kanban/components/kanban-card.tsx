'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, AlertCircle, Bug, BookOpen, Layers } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Task } from '@/modules/task/types';
import { cn } from '@/lib/utils';
import {
  PRIORITY_COLORS,
  TYPE_COLORS,
  PRIORITY_LABELS,
  TYPE_LABELS,
} from '@/lib/constants';
import { formatDate } from '@/lib/utils';

interface KanbanCardProps {
  task: Task;
  projectKey: string;
  onClick?: () => void;
  isDragging?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  task: <Layers style={{ fontSize: '12px' }} />,
  bug: <Bug style={{ fontSize: '12px' }} />,
  story: <BookOpen style={{ fontSize: '12px' }} />,
  epic: <AlertCircle style={{ fontSize: '12px' }} />,
};

export function KanbanCard({
  task,
  projectKey,
  onClick,
  isDragging,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      sx={{
        borderRadius: '12px',
        border: '1px solid #c5c0b1',
        backgroundColor: '#fffefb',
        p: 1.5,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        ...(isDragging || isSortableDragging
          ? {
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              outline: '2px solid #ff4f00',
              opacity: 0.9,
            }
          : {}),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#201515',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {task.title}
        </Typography>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
        <Badge variant="default" sx={{ fontSize: '11px', height: '20px' }}>
          {task.displayId || `${projectKey}-${task.sequentialId}`}
        </Badge>

        <Badge
          sx={{
            fontSize: '11px',
            height: '20px',
            ...TYPE_COLORS[task.type],
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {typeIcons[task.type]}
            {TYPE_LABELS[task.type]}
          </Box>
        </Badge>

        <Badge
          sx={{
            fontSize: '11px',
            height: '20px',
            ...PRIORITY_COLORS[task.priority],
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </Badge>

        {task.storyPoints && (
          <Badge variant="primary" sx={{ fontSize: '11px', height: '20px' }}>
            {task.storyPoints}
          </Badge>
        )}
      </Box>

      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {task.assignees && task.assignees.length > 0 && (
            <Box sx={{ display: 'flex', ml: -0.5 }}>
              {task.assignees.slice(0, 3).map((assignee) => (
                <Avatar
                  key={assignee.id}
                  src={assignee.user.avatarUrl}
                  name={assignee.user.displayName}
                  size="sm"
                />
              ))}
              {task.assignees.length > 3 && (
                <Box
                  sx={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#f8f4f0',
                    color: '#605d52',
                    fontSize: '12px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fffefb',
                    ml: -0.5,
                  }}
                >
                  +{task.assignees.length - 3}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {task.dueDate && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '12px',
              color: isOverdue ? '#dc2626' : '#939084',
            }}
          >
            <Calendar style={{ fontSize: '12px' }} />
            {formatDate(task.dueDate)}
          </Box>
        )}
      </Box>
    </Box>
  );
}
