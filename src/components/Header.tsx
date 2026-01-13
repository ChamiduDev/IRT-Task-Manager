import { Plus, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onAddTaskClick: () => void;
}

/**
 * Header Component
 * Attractive responsive header with logo, title, theme toggle, and add task button
 * Optimized for mobile, tablet, and desktop views
 */
export const Header = ({ onAddTaskClick }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 py-3 sm:py-4">
          {/* Logo and Title Section */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="TaskMaster Pro Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
              {/* Title */}
              <div className="flex flex-col">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white transition-colors leading-tight">
                  TaskMaster Pro
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Task Management System
                </p>
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 shadow-sm hover:shadow-md"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Add Task Button */}
            <button
              onClick={onAddTaskClick}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 flex-1 sm:flex-initial transform hover:scale-105 active:scale-95"
              type="button"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Add Task</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
