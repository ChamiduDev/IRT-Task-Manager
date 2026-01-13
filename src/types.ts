/**
 * Task Status enumeration
 * Represents the current state of a task in the workflow
 */
export enum TaskStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
}

/**
 * Task Priority enumeration
 * Indicates the urgency and importance level of a task
 */
export enum TaskPriority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Critical = "Critical",
}

/**
 * Task interface
 * Defines the structure for task objects in the Task Management System
 */
export interface Task {
  /** Unique identifier for the task */
  id?: string;
  /** Title or name of the task */
  Title: string;
  /** Detailed description of what needs to be done */
  Description: string;
  /** Current status of the task */
  Status: TaskStatus;
  /** Priority level indicating urgency */
  Priority: TaskPriority;
  /** Estimated number of hours required to complete the task */
  EstimatedHours: number;
  /** Name or identifier of the person assigned to this task */
  AssignedTo: string;
  /** Timestamp indicating when the task was created */
  CreatedAt: Date | string;
  /** Timestamp indicating when the task was last updated */
  UpdatedAt: Date | string;
  /** Optional timestamp indicating when the task was completed */
  CompletedAt?: Date | string;
}
