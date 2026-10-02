'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { BenchLogo } from '@/components/BenchLogo';
import { signInWithEmail, signUpWithEmail, type AuthActionState } from './actions';

const initialState: AuthActionState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'Vent lige…' : children}
    </button>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const [loginState, loginAction] = useFormState(async (prev: AuthActionState, fd: FormData) => {
    const result = await signInWithEmail(prev, fd);
    if (result.info === 'ok') {
      router.push('/');
      router.refresh();
    }
    return result;
  }, initialState);

  const [signupState, signupAction] = useFormState(signUpWithEmail, initialState);

  async function handleOAuth(provider: 'google' | 'apple') {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const state = mode === 'login' ? loginState : signupState;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-moss-700 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <BenchLogo className="h-16 w-16" />
          <h1 className="text-3xl font-extrabold tracking-tight text-white">TourDeBænk</h1>
          <p className="text-moss-100">Det sociale kort over Københavns bedste bænke.</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex rounded-full bg-moss-50 p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === 'login' ? 'bg-white shadow-card text-moss-700' : 'text-moss-400'
              }`}
            >
              Log ind
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-white shadow-card text-moss-700' : 'text-moss-400'
              }`}
            >
              Opret konto
            </button>
          </div>

          <div className="mb-4 flex flex-col gap-2">
            <button onClick={() => handleOAuth('google')} className="btn-secondary w-full">
              Fortsæt med Google
            </button>
            <button onClick={() => handleOAuth('apple')} className="btn-secondary w-full">
              Fortsæt med Apple
            </button>
          </div>

          <div className="mb-4 flex items-center gap-3 text-xs text-moss-300">
            <div className="h-px flex-1 bg-moss-100" />
            eller med email
            <div className="h-px flex-1 bg-moss-100" />
          </div>

          {mode === 'login' ? (
            <form action={loginAction} className="flex flex-col gap-3">
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Adgangskode"
                className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
              />
              <SubmitButton>Log ind</SubmitButton>
            </form>
          ) : (
            <form action={signupAction} className="flex flex-col gap-3">
              <input
                name="username"
                type="text"
                required
                placeholder="Brugernavn"
                className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
              />
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Adgangskode"
                className="rounded-xl border border-moss-100 px-4 py-3 text-sm outline-none focus:border-moss-400"
              />
              <SubmitButton>Opret konto</SubmitButton>
            </form>
          )}

          {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}
          {state?.info && state.info !== 'ok' && (
            <p className="mt-3 text-sm text-moss-600">{state.info}</p>
          )}
        </div>
      </div>
    </div>
  );
}
