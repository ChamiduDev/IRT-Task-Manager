# TaskMaster Pro - Frontend

## Overview

This is a task management system built as part of a 6-hour technical interview. This repository contains the Frontend implementation, focusing on a clean UI, responsive design, and effective task organization.

## 🛠 Technology Stack

- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide-React
- **Build Tool:** Vite
- **Package Manager:** npm
- **HTTP Client:** Axios
- **Real-time Communication:** Socket.io-client

## 🚀 Key Features Implemented

### Task Dashboard
- Clean, modern dashboard with task statistics cards
- Real-time task count display (Total, Pending, In Progress, Completed)
- Visual indicators with color-coded status badges

### Task Management
- **Create Tasks:** Modal form with validation for creating new tasks
- **Edit Tasks:** Full task editing capability with pre-filled form data
- **Update Status:** Workflow-based status updates (Pending → In Progress → Completed)
- **Delete Tasks:** Confirmation modal for safe task deletion
- **Task Cards:** Beautiful card-based layout with all task details
- **Scheduled Tasks:** Set start date and time for tasks with automatic status updates
- **Auto-Start:** Tasks automatically move to "In Progress" when scheduled time arrives
- **Countdown Timer:** Real-time countdown showing time remaining until deadline
- **Deadline Warnings:** Visual alerts (red card border/background) when deadline is approaching (within 2 hours)

### Filtering & Search
- **Real-time Search:** Search tasks by title or assigned person as you type
- **Status Filter:** Filter by task status (All, Pending, In Progress, Completed)
- **Priority Filter:** Filter by priority level (All, Low, Medium, High, Critical)
- **Clear Filters:** One-click button to reset all filters

### Priority Visuals
- High-contrast color-coded badges:
  - **Low:** Blue
  - **Medium:** Yellow
  - **High:** Orange
  - **Critical:** Red

### Status Workflow
- Logical progression: Pending → In Progress → Completed
- Status dropdown only shows valid next steps
- Visual status badges with appropriate colors
- **Auto-Start on Schedule:** Tasks with scheduled date/time automatically start when the scheduled time arrives
- **Manual Override:** Tasks can still be manually moved to "In Progress" before scheduled time

### Responsive Design
- Fully functional on Mobile, Tablet, and Desktop
- Responsive grid layouts that adapt to screen size
- Touch-friendly buttons and interactions
- Optimized header with logo and branding

### Dark Mode
- Complete dark mode support with theme toggle
- Persistent theme preference (localStorage)
- Smooth transitions between light and dark themes
- All components styled for both themes

### Smart Task Sorting
- **Priority Sorting:** Tasks sorted by remaining time until deadline
- **Scheduled Tasks First:** Tasks with scheduled date/time appear at the top, sorted by least remaining time
- **Unscheduled Tasks:** Tasks without scheduled date/time stay at the bottom
- **Completed Tasks:** Always appear at the very bottom of the list
- **Real-time Updates:** List automatically reorders as time passes

### UI/UX Features
- Glassmorphism effects on header and modals
- Blurred backdrop modals for better focus
- Smooth animations and transitions
- Form validation with error messages
- Accessible design with proper ARIA labels
- **Countdown Display:** Visual countdown timer on task cards showing time until deadline
- **Deadline Indicators:** Color-coded warnings (red) when deadlines are approaching

## 📋 Task Properties

Each task contains the following properties:

- **id** (optional): Unique identifier for the task
- **Title** (required): Name or title of the task
- **Description** (required): Detailed description of what needs to be done
- **Status** (required): Current state of the task
  - `Pending`
  - `In Progress`
  - `Completed`
- **Priority** (required): Urgency level
  - `Low`
  - `Medium`
  - `High`
  - `Critical`
- **EstimatedHours** (required): Number of hours estimated to complete
- **AssignedTo** (required): Name of the person assigned to the task
- **CreatedAt** (required): Timestamp when the task was created
- **UpdatedAt** (required): Timestamp when the task was last updated
- **CompletedAt** (optional): Timestamp when the task was completed
- **ScheduledStartDate** (optional): Date when the task is scheduled to start
- **ScheduledStartTime** (optional): Time when the task is scheduled to start (format: "HH:MM")

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ChamiduDev/IRT-Task-Manager.git
   cd IRT-Task-Manager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the `taskManager` directory
   - Add: `VITE_API_BASE_URL=http://localhost:3000`

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   - The application will be available at `http://localhost:5173`
   - The port may vary if 5173 is already in use
   - **Note:** Make sure the backend API is running on `http://localhost:3000` for full functionality

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## ⏰ Scheduled Tasks & Auto-Start

### Scheduled Date/Time
- Tasks can be assigned a scheduled start date and time when created
- Scheduled information is displayed on the task card
- Format: Date picker for date, time picker for time (HH:MM)

### Auto-Start Functionality
- Tasks with scheduled date/time automatically move to "In Progress" when the scheduled time arrives
- System checks every minute for tasks that should auto-start
- Only tasks with "Pending" status are auto-started
- Manual status updates still work independently

### Countdown Timer
- Real-time countdown displays time remaining until deadline
- Deadline = Scheduled Start Date/Time + Estimated Hours
- Updates every minute automatically
- Shows formats: "Xd Xh remaining", "Xh Xm remaining", or "Xm remaining"
- Displays "Overdue" if deadline has passed

### Deadline Warnings
- Visual warning system when deadline is approaching
- Card border turns red when deadline is within 2 hours
- Card background gets red tint for urgent tasks
- Warnings only show for non-completed tasks
- Countdown timer badge changes color (red when approaching, blue otherwise)

### Smart Sorting
- Tasks are automatically sorted by remaining time until deadline
- Tasks with least remaining time appear at the top
- Tasks with scheduled date/time are prioritized
- Tasks without scheduled date/time stay at the bottom
- Completed tasks always appear at the very bottom
- List reorders automatically as time passes

### Real-time Updates
- **WebSocket Integration:** Live task updates across all connected clients
- **Instant Synchronization:** Changes made by one user appear immediately for all users
- **Event-Driven Updates:** No polling or auto-refresh timers - updates happen instantly when data changes
- **Supported Events:** Task creation, updates, deletion, and auto-start status changes
- **Automatic Reconnection:** WebSocket automatically reconnects if connection is lost

## 🔮 Future Enhancements

The following features are planned for future releases:

- **Authentication:** User login and session management
- **User Management:** Multi-user support with role-based access
- **Task History:** Audit trail for task changes
- **File Attachments:** Support for task-related documents
- **Notifications:** Real-time notifications for task assignments and updates
- **Recurring Tasks:** Support for repeating scheduled tasks
- **Task Dependencies:** Link tasks that depend on each other

## 📝 Assumptions Made

1. **Backend API:** The frontend connects to a backend API running on `http://localhost:3000`
2. **WebSocket Server:** Real-time updates require a WebSocket server running on the same port as the API
3. **Timestamps:** Timestamps are generated by the backend API
4. **Browser Support:** Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge)
5. **No Authentication:** User authentication is assumed to be handled by the backend API
6. **Multi-User Support:** Real-time updates work across multiple users/browsers simultaneously
7. **Local Storage:** Theme preference is stored in browser localStorage
8. **Auto-Start Check Interval:** Backend checks for scheduled tasks every 60 seconds
9. **Deadline Warning Threshold:** Visual warnings appear when deadline is within 2 hours
10. **Time Zone:** All dates and times use the user's local timezone. Date-only fields (ScheduledStartDate) are handled as strings to prevent timezone conversion issues
11. **Responsive Breakpoints:** 
    - Mobile: < 640px
    - Tablet: 640px - 1024px
    - Desktop: > 1024px
12. **Event-Driven Updates:** No polling or auto-refresh - all updates are event-driven via WebSocket

## 📂 Project Structure

```
taskManager/
├── public/
│   ├── logo.png          # Application logo
│   └── vite.svg          # Vite logo
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── AddTaskModal.tsx
│   │   ├── DeleteConfirmationModal.tsx
│   │   ├── EditTaskModal.tsx
│   │   ├── Header.tsx
│   │   └── TaskCard.tsx
│   ├── contexts/          # React contexts
│   │   └── ThemeContext.tsx
│   ├── hooks/             # Custom React hooks
│   │   └── useTasks.ts     # Task management hook with API and WebSocket integration
│   ├── services/           # API and WebSocket services
│   │   ├── api.ts          # REST API client
│   │   └── socket.ts       # WebSocket client
│   ├── types.ts           # TypeScript interfaces and enums
│   ├── App.tsx            # Main dashboard logic and state management
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles and Tailwind imports
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── postcss.config.js      # PostCSS configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🎨 Component Overview

- **Header:** Sticky header with logo, title, theme toggle, and add task button
- **TaskCard:** Individual task display with status workflow, countdown timer, deadline warnings, edit, and delete functionality
- **AddTaskModal:** Form modal for creating new tasks with validation, including scheduled date/time inputs
- **EditTaskModal:** Form modal for editing existing tasks with pre-filled data and validation
- **DeleteConfirmationModal:** Confirmation dialog for task deletion
- **ThemeContext:** Context provider for dark/light mode management
- **useTasks Hook:** Custom hook managing task state, API calls, and WebSocket event handling

### TaskCard Features
- Displays scheduled start date and time (if set)
- Real-time countdown timer showing time until deadline
- Visual deadline warnings (red border/background when approaching)
- Status workflow dropdown with valid transitions
- Priority and status badges with color coding
- Creation timestamp display
- Edit button to modify task details

### API Integration
- **REST API:** All CRUD operations use Axios for HTTP requests
- **WebSocket:** Real-time updates via Socket.io-client
- **Error Handling:** Comprehensive error handling with user-friendly messages
- **Loading States:** Loading indicators during API operations
- **Date Handling:** Proper timezone handling for date-only fields to prevent conversion issues

## 📄 License

This project is part of a technical interview assessment.
