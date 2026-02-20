'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TaskStatus, TaskPriority } from '@/lib/database.types'

// ─── Create Task ──────────────────────────────────────────────────────────────

interface CreateTaskInput {
  title: string
  description: string | null
  project_id: string
  assigned_to: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  estimated_hours: number
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tasks').insert({
    ...input,
    logged_hours: 0,
    created_by: user.id,
  })

  if (error) {
    console.error('createTask error:', error)
    return { error: error.message }
  }

  revalidatePath(`/projects/${input.project_id}`)
  revalidatePath('/my-tasks')
  return { error: null }
}

// ─── Update Task Status ───────────────────────────────────────────────────────

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) {
    console.error('updateTaskStatus error:', error)
    return { error: error.message }
  }

  revalidatePath('/projects/[id]', 'page')
  revalidatePath('/my-tasks')
  return { error: null }
}

// ─── Update Task ──────────────────────────────────────────────────────────────

interface UpdateTaskInput {
  taskId: string
  projectId: string
  title?: string
  description?: string | null
  assigned_to?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string | null
  estimated_hours?: number
}

export async function updateTask({ taskId, projectId, ...fields }: UpdateTaskInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tasks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  if (error) {
    console.error('updateTask error:', error)
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/my-tasks')
  return { error: null }
}

// ─── Delete Task ──────────────────────────────────────────────────────────────

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // First delete related time_logs
  await supabase.from('time_logs').delete().eq('task_id', taskId)

  const { error } = await supabase.from('tasks').delete().eq('id', taskId)

  if (error) {
    console.error('deleteTask error:', error)
    return { error: error.message }
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/my-tasks')
  return { error: null }
}

// ─── Log Time ────────────────────────────────────────────────────────────────

interface LogTimeInput {
  taskId: string
  projectId: string
  hours: number
  note: string | null
  logged_date: string
}

export async function logTime({ taskId, projectId, hours, note, logged_date }: LogTimeInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Insert time log
  const { error: logError } = await supabase.from('time_logs').insert({
    task_id: taskId,
    user_id: user.id,
    hours,
    note,
    logged_date,
  })

  if (logError) {
    console.error('logTime error:', logError)
    return { error: logError.message }
  }

  // Update task logged_hours (increment)
  const { data: task } = await supabase
    .from('tasks')
    .select('logged_hours')
    .eq('id', taskId)
    .single()

  const currentHours = (task as { logged_hours: number } | null)?.logged_hours ?? 0

  await supabase
    .from('tasks')
    .update({
      logged_hours: currentHours + hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/my-tasks')
  revalidatePath('/dashboard')
  return { error: null }
}

// ─── Delete Time Log ──────────────────────────────────────────────────────────

export async function deleteTimeLog(logId: string, taskId: string, projectId: string, hours: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('time_logs').delete().eq('id', logId)

  if (error) {
    console.error('deleteTimeLog error:', error)
    return { error: error.message }
  }

  // Decrement logged_hours on task
  const { data: task } = await supabase
    .from('tasks')
    .select('logged_hours')
    .eq('id', taskId)
    .single()

  const currentHours = (task as { logged_hours: number } | null)?.logged_hours ?? 0
  const newHours = Math.max(0, currentHours - hours)

  await supabase
    .from('tasks')
    .update({ logged_hours: newHours, updated_at: new Date().toISOString() })
    .eq('id', taskId)

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/my-tasks')
  revalidatePath('/dashboard')
  return { error: null }
}
