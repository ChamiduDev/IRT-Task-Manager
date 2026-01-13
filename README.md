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

## 🚀 Key Features Implemented

### Task Dashboard
- Clean, modern dashboard with task statistics cards
- Real-time task count display (Total, Pending, In Progress, Completed)
- Visual indicators with color-coded status badges

### Task Management
- **Create Tasks:** Modal form with validation for creating new tasks
- **Update Status:** Workflow-based status updates (Pending → In Progress → Completed)
- **Delete Tasks:** Confirmation modal for safe task deletion
- **Task Cards:** Beautiful card-based layout with all task details

### Filtering & Search
- **Real-time Search:** Search tasks by title as you type
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

### UI/UX Features
- Glassmorphism effects on header and modals
- Blurred backdrop modals for better focus
- Smooth animations and transitions
- Form validation with error messages
- Accessible design with proper ARIA labels

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

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <your-repo-link>
   cd taskManager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - The application will be available at `http://localhost:5173`
   - The port may vary if 5173 is already in use

### Build for Production

```bash
npm run build
```

The production build will be created in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 🔮 Future Integration

The current version uses **Mock Data** for the frontend review phase. The following integrations are planned for the next phase:

- **Backend API Integration:** Connect to REST API endpoints for CRUD operations
- **Authentication:** User login and session management
- **Data Persistence:** Replace mock data with API calls
- **Real-time Updates:** WebSocket integration for live task updates
- **User Management:** Multi-user support with role-based access
- **Task History:** Audit trail for task changes
- **File Attachments:** Support for task-related documents
- **Notifications:** Real-time notifications for task assignments and updates

## 📝 Assumptions Made

1. **Mock Data:** The current version uses mock data stored in React state for the frontend review phase
2. **API Integration:** Backend API integration will be completed in the next phase
3. **Timestamps:** Timestamps are generated locally during task creation and updates
4. **Browser Support:** Modern browsers with ES6+ support (Chrome, Firefox, Safari, Edge)
5. **No Authentication:** User authentication is assumed to be handled by the backend API
6. **Single User:** Current implementation assumes single-user context (multi-user support in future)
7. **Local Storage:** Theme preference is stored in browser localStorage
8. **Responsive Breakpoints:** 
   - Mobile: < 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

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
│   │   ├── Header.tsx
│   │   └── TaskCard.tsx
│   ├── contexts/          # React contexts
│   │   └── ThemeContext.tsx
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
- **TaskCard:** Individual task display with status workflow and delete functionality
- **AddTaskModal:** Form modal for creating new tasks with validation
- **DeleteConfirmationModal:** Confirmation dialog for task deletion
- **ThemeContext:** Context provider for dark/light mode management

## 📄 License

This project is part of a technical interview assessment.
