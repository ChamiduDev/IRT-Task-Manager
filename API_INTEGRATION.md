# Frontend-Backend Integration Guide

## Overview

The frontend has been integrated with the backend API. All task operations now communicate with the backend server instead of using local state.

## Setup

### 1. Environment Configuration

Create a `.env` file in the `taskManager` directory:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

**Note:** The API base URL should point to your backend server. The default is `http://localhost:3000/api` which assumes:
- Backend is running on port 3000
- Backend API routes are prefixed with `/api`

### 2. Start the Backend

Make sure the backend server is running:

```bash
cd backend
npm run dev
```

The backend should be accessible at `http://localhost:3000`

### 3. Start the Frontend

```bash
cd taskManager
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use)

## What Changed

### New Files

1. **`src/services/api.ts`**
   - API service layer using axios
   - Handles all HTTP requests to the backend
   - Converts date strings to Date objects
   - Provides type-safe API methods

2. **`src/hooks/useTasks.ts`**
   - Custom React hook for task management
   - Handles loading states, errors, and CRUD operations
   - Provides a clean interface for components

### Updated Files

1. **`src/App.tsx`**
   - Removed mock data
   - Replaced local state with `useTasks` hook
   - Added loading and error states
   - Removed frontend auto-start logic (now handled by backend)
   - Filtering now uses API query parameters
   - Added periodic refresh to get auto-started tasks from backend

## Features

### API Integration

- ✅ **Fetch Tasks**: Automatically fetches tasks on component mount
- ✅ **Create Task**: Creates new tasks via API
- ✅ **Update Task**: Updates task status and other fields via API
- ✅ **Delete Task**: Deletes tasks via API
- ✅ **Filtering**: Uses API query parameters for server-side filtering
- ✅ **Error Handling**: Displays error messages with retry option
- ✅ **Loading States**: Shows loading indicator while fetching data

### Auto-Start Tasks

The backend handles auto-starting scheduled tasks. The frontend:
- Refreshes task list every 60 seconds to get updates
- No longer needs to check scheduled times locally

### Date Handling

- Backend returns dates as ISO strings
- Frontend converts them to Date objects for display
- Scheduled dates are formatted correctly for API requests

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/tasks` | Get all tasks (with optional filters) |
| POST | `/api/tasks` | Create new task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Error Handling

The frontend handles errors gracefully:

1. **Network Errors**: Displayed in an error banner with retry button
2. **Validation Errors**: Shown in the form (handled by AddTaskModal)
3. **API Errors**: Error messages from backend are displayed to the user

## Testing the Integration

1. **Start both servers** (backend and frontend)
2. **Open the frontend** in your browser
3. **Check the console** for any API errors
4. **Create a task** - it should appear immediately
5. **Update a task status** - changes should persist
6. **Delete a task** - it should be removed
7. **Use filters** - tasks should filter on the server side

## Troubleshooting

### CORS Errors

If you see CORS errors, make sure:
- Backend CORS_ORIGIN is set to your frontend URL (e.g., `http://localhost:5173`)
- Backend is running and accessible

### Connection Errors

If tasks don't load:
- Verify backend is running on the correct port
- Check `.env` file has correct `VITE_API_BASE_URL`
- Check browser console for specific error messages
- Verify database is set up and has data

### Date Format Issues

If dates aren't displaying correctly:
- Backend returns ISO date strings
- Frontend converts them to Date objects
- Check browser console for date parsing errors

## Development Notes

- The frontend uses optimistic updates for better UX
- Errors trigger a refresh to get the correct state
- Tasks refresh every 60 seconds to get backend updates (like auto-started tasks)
- All API calls are type-safe with TypeScript
