export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type UserRole = 'admin' | 'member'

export type ProjectStatus = 'active' | 'completed' | 'archived' | 'on_hold'

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ─── Table Row Types ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  sector: string | null
  logo_url: string | null
  notes: string | null
  is_archived: boolean
  created_by: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  client_id: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  created_by: string | null
  created_at: string
}

export interface ProjectMember {
  project_id: string
  user_id: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  assigned_to: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  estimated_hours: number
  logged_hours: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TimeLog {
  id: string
  task_id: string | null
  user_id: string | null
  hours: number
  note: string | null
  logged_date: string
  created_at: string
}

// ─── Insert Types (for creating new records) ──────────────────────────────────

export type ProfileInsert = Omit<Profile, 'created_at'> & {
  created_at?: string
}

export type ClientInsert = Omit<Client, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ProjectMemberInsert = ProjectMember

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'logged_hours'> & {
  id?: string
  created_at?: string
  updated_at?: string
  logged_hours?: number
}

export type TimeLogInsert = Omit<TimeLog, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

// ─── Update Types (all fields optional except id) ────────────────────────────

export type ProfileUpdate = Partial<Omit<Profile, 'id'>>

export type ClientUpdate = Partial<Omit<Client, 'id'>>

export type ProjectUpdate = Partial<Omit<Project, 'id'>>

export type TaskUpdate = Partial<Omit<Task, 'id'>>

export type TimeLogUpdate = Partial<Omit<TimeLog, 'id'>>

// ─── Supabase Database Schema Type ───────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: ProfileInsert
        Update: ProfileUpdate
        Relationships: []
      }
      clients: {
        Row: Client
        Insert: ClientInsert
        Update: ClientUpdate
        Relationships: []
      }
      projects: {
        Row: Project
        Insert: ProjectInsert
        Update: ProjectUpdate
        Relationships: []
      }
      project_members: {
        Row: ProjectMember
        Insert: ProjectMemberInsert
        Update: Partial<ProjectMember>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
        Relationships: []
      }
      time_logs: {
        Row: TimeLog
        Insert: TimeLogInsert
        Update: TimeLogUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Joined / Extended Types (for queries with relations) ────────────────────

export interface TaskWithRelations extends Task {
  project?: Project | null
  assignee?: Profile | null
  creator?: Profile | null
  time_logs?: TimeLog[]
}

export interface ProjectWithRelations extends Project {
  client?: Client | null
  members?: Profile[]
  tasks?: Task[]
}

export interface ClientWithRelations extends Client {
  projects?: Project[]
  creator?: Profile | null
}

export interface TimeLogWithRelations extends TimeLog {
  task?: Task | null
  user?: Profile | null
}
