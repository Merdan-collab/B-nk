'use server';

import { createClient } from '@/lib/supabase/server';

export interface AuthActionState {
  error?: string;
  info?: string;
}

export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Udfyld email og adgangskode.' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { info: 'ok' };
}

export async function signUpWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const username = String(formData.get('username') ?? '').trim();

  if (!email || !password || !username) {
    return { error: 'Udfyld alle felter.' };
  }

  if (!/^[a-z0-9_.]{3,20}$/i.test(username)) {
    return { error: 'Brugernavn skal være 3-20 tegn (bogstaver, tal, _ og .).' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { info: 'Tjek din email for at bekræfte din konto.' };
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
