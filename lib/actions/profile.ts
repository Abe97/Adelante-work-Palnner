'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ─── Update profile ───────────────────────────────────────────────────────────

export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', user.id)

  if (error) {
    console.error('updateProfile error:', error)
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { error: null }
}

// ─── Change password ──────────────────────────────────────────────────────────

export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Unauthorized' }

  // Verify current password by signing in again
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInErr) {
    return { error: 'La password attuale non è corretta' }
  }

  // Update to new password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (updateErr) {
    console.error('changePassword error:', updateErr)
    return { error: updateErr.message }
  }

  return { error: null }
}
