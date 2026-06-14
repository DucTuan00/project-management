'use client';

import React from 'react';
import { Search, Bell, LogOut, User, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/providers/auth-provider';
import { NotificationDropdown } from '@/modules/notification/components/notification-dropdown';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
      onClick: () => {},
    },
    {
      label: 'Logout',
      icon: <LogOut className="h-4 w-4" />,
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center gap-4">
        {title && (
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-64 rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User menu */}
        {user && (
          <Dropdown
            trigger={
              <div className="flex items-center gap-2">
                <Avatar name={user.displayName} size="sm" />
                <span className="hidden text-sm font-medium text-gray-700 md:block">
                  {user.displayName}
                </span>
              </div>
            }
            items={userMenuItems}
            align="right"
          />
        )}
      </div>
    </header>
  );
}
