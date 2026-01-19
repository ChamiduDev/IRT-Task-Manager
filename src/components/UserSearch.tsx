import { useState, useEffect, useRef } from 'react';
import { Search, X, User as UserIcon, Check } from 'lucide-react';
import { authService } from '../services/auth';
import type { User } from '../types/auth';

interface UserSearchProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  error?: string;
  placeholder?: string;
}

/**
 * UserSearch Component
 * Provides a searchable multi-select dropdown for selecting users
 * Supports searching by username or full name
 */
export const UserSearch = ({
  selectedUserIds,
  onSelectionChange,
  error,
  placeholder = 'Search users by username or name...',
}: UserSearchProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Fetch all users from the API
   */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await authService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter users based on search query
   */
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  /**
   * Get selected users
   */
  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

  /**
   * Toggle user selection
   */
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectionChange([...selectedUserIds, userId]);
    }
  };

  /**
   * Remove a selected user
   */
  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter((id) => id !== userId));
  };

  /**
   * Get display name for user
   */
  const getUserDisplayName = (user: User): string => {
    return user.fullName || user.username;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <span
              key={user.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
            >
              <UserIcon className="w-3 h-3" />
              {getUserDisplayName(user)}
              <button
                type="button"
                onClick={() => removeUser(user.id)}
                className="ml-1 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white dark:border-slate-600 transition-colors ${
            error
              ? 'border-red-500 dark:border-red-400'
              : 'border-gray-300 dark:border-slate-600'
          }`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchQuery.trim() ? 'No users found' : 'No users available'}
            </div>
          ) : (
            <ul className="py-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => toggleUser(user.id)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5 border-2 rounded border-gray-300 dark:border-slate-600">
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {getUserDisplayName(user)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
