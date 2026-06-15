'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { KanbanCard } from './kanban-card';
import { Task, TaskStatus } from '@/modules/task/types';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  name: string;
  taskStatus: TaskStatus;
  tasks: Task[];
  wipLimit?: number;
  projectKey: string;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (status: TaskStatus) => void;
}

const columnColors: Record<string, string> = {
  backlog: '#c5c0b1',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#a855f7',
  done: '#22c55e',
  archived: '#939084',
};

export function KanbanColumn({
  id,
  name,
  taskStatus,
  tasks,
  wipLimit,
  projectKey,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: taskStatus,
  });

  const isOverWipLimit = wipLimit && tasks.length >= wipLimit;

  return (
    <Box
      sx={{
        width: '320px',
        flexShrink: 0,
        borderRadius: '12px',
        backgroundColor: isOver ? '#f8f4f0' : '#fffefb',
        transition: 'background-color 0.2s',
      }}
    >
      <Box
        sx={{
          borderTop: `4px solid ${columnColors[taskStatus] || '#c5c0b1'}`,
          borderRadius: '12px 12px 0 0',
          backgroundColor: '#fffefb',
          px: 1.5,
          py: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#605d52', fontSize: '14px' }}>
            {name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              color: isOverWipLimit ? '#dc2626' : '#939084',
              fontSize: '12px',
            }}
          >
            {tasks.length}
            {wipLimit && `/${wipLimit}`}
          </Typography>
        </Box>
      </Box>

      <Box
        ref={setNodeRef}
        sx={{
          minHeight: '200px',
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {onAddTask && (
          <Box
            component="button"
            onClick={() => onAddTask(taskStatus)}
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              borderRadius: '12px',
              border: '2px dashed #c5c0b1',
              p: 1,
              fontSize: '14px',
              color: '#939084',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#939084',
                color: '#605d52',
              },
              transition: 'all 0.2s',
            }}
          >
            <Plus style={{ fontSize: '16px' }} />
            Add task
          </Box>
        )}
      </Box>
    </Box>
  );
}
