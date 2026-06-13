'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronsUpDown, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaces } from '@/modules/workspace/queries';

interface WorkspaceSwitcherProps {
  currentWorkspaceId?: string;
}

export function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: workspaces, isLoading } = useWorkspaces();

  const currentWorkspace = workspaces?.find(
    (w) => w.id === currentWorkspaceId
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">
            {currentWorkspace?.name || 'Select Workspace'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {currentWorkspace?.description || 'No workspace selected'}
          </p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                Workspaces
              </p>
              {isLoading ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500">
                  Loading...
                </div>
              ) : (
                <ul className="space-y-1">
                  {workspaces?.map((workspace) => (
                    <li key={workspace.id}>
                      <Link
                        href={`/workspace/${workspace.id}`}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                          workspace.id === currentWorkspaceId
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                          <Building2 className="h-4 w-4 text-primary-600" />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="font-medium">{workspace.name}</p>
                        </div>
                        {workspace.id === currentWorkspaceId && (
                          <Check className="h-4 w-4 text-primary-600" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-gray-200 mt-2 pt-2">
                <Link
                  href="/workspace/new"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                  <span>Create Workspace</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
