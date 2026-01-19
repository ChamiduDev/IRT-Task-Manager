import { useState, useEffect, useRef } from 'react';
import { Search, X, User as UserIcon, ChevronDown } from 'lucide-react';
import type { User } from '../types/auth';

interface UserFilterDropdownProps {
  users: User[];
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * UserFilterDropdown Component
 * A searchable dropdown for filtering tasks by assigned user
 * Shows up to 5 users in the dropdown with type-to-search functionality
 */
export const UserFilterDropdown = ({
  users,
  selectedUserId,
  onUserChange,
  placeholder = 'Select user...',
  disabled = false,
}: UserFilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.fullName?.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }).slice(0, 5); // Limit to 5 users

  // Get selected user name
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) : null;

  const handleSelectUser = (userId: string) => {
    onUserChange(userId === selectedUserId ? null : userId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUserChange(null);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-left flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className={selectedUser ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
            {selectedUser ? (selectedUser.fullName || selectedUser.username) : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedUserId && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search users..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* User list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No users found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user.id)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                    selectedUserId === user.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <UserIcon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{user.fullName || user.username}</div>
                    {user.fullName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{user.username}
                      </div>
                    )}
                  </div>
                  {selectedUserId === user.id && (
                    <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
