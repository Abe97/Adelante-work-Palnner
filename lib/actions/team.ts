'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/database.types'

// ─── Helper: admin-only guard ─────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, adminClient: null, error: 'Unauthorized' }

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileRaw as { role: UserRole } | null

  if (profile?.role !== 'admin') return { supabase, adminClient: null, error: 'Forbidden' }

  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const adminClient = createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return { supabase, adminClient, error: null }
}

// ─── Invite member ────────────────────────────────────────────────────────────

export async function inviteMember(fullName: string, email: string) {
  const { adminClient, error } = await requireAdmin()
  if (error || !adminClient) return { error: error ?? 'Unauthorized' }

  // Use inviteUserByEmail so Supabase sends the invite email
  const { data, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  })

  if (inviteErr) {
    console.error('inviteMember error:', inviteErr)
    return { error: inviteErr.message }
  }

  // Upsert profile row (the trigger may not fire on invite)
  if (data?.user) {
    await adminClient.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      role: 'member',
    }, { onConflict: 'id' })
  }

  revalidatePath('/team')
  return { error: null }
}

// ─── Update member role ───────────────────────────────────────────────────────

export async function updateMemberRole(userId: string, role: UserRole) {
  const { supabase, error } = await requireAdmin()
  if (error) return { error }

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (updateErr) {
    console.error('updateMemberRole error:', updateErr)
    return { error: updateErr.message }
  }

  revalidatePath('/team')
  return { error: null }
}

// ─── Disable / delete member ──────────────────────────────────────────────────

export async function disableMember(userId: string) {
  const { adminClient, error } = await requireAdmin()
  if (error || !adminClient) return { error: error ?? 'Unauthorized' }

  // Ban the user (soft disable — doesn't delete data)
  const { error: banErr } = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: '876000h', // ~100 years
  })

  if (banErr) {
    console.error('disableMember error:', banErr)
    return { error: banErr.message }
  }

  revalidatePath('/team')
  return { error: null }
}
