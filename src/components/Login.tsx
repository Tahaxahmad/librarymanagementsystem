import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../App';
import { Library } from 'lucide-react';

export default function Login({
  users,
  onLogin,
  onRegistered,
}: {
  users: User[];
  onLogin: (user: User) => void;
  onRegistered?: (user: User) => void;
}) {
  const [email, setEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      onLogin(user);
      navigate('/');
    } else {
      setError('Unknown email. Use a seeded account or register below.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const name = regName.trim();
    const em = regEmail.trim().toLowerCase();
    if (!name || !em) {
      setError('Name and email are required.');
      return;
    }
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: em }),
      });
      if (res.ok) {
        const user = (await res.json()) as User;
        onRegistered?.(user);
        onLogin(user);
        navigate('/');
      } else {
        const err = await res.json();
        setError(err.error || 'Registration failed');
      }
    } catch {
      setError('Could not reach server');
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md border border-[color:var(--border)] bg-[color:var(--surface)] p-8 sm:p-10">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center border border-[color:var(--border)] bg-[color:var(--accent)] text-[color:var(--accent-ink)]">
            <Library className="h-8 w-8" />
          </div>
          <h2 className="text-center text-2xl font-bold text-[color:var(--text-primary)] sm:text-3xl">EduLib Pro</h2>
          <p className="mt-2 text-center text-sm text-[color:var(--text-muted)]">
            {mode === 'signin' ? 'Sign in with your email' : 'Create a student account'}
          </p>
        </div>

        <div className="mt-6 flex gap-2 border-b border-[color:var(--border)] pb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-bold ${
              mode === 'signin' ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-sm font-bold ${
              mode === 'register' ? 'border-b-2 border-[color:var(--accent)] text-[color:var(--text-primary)]' : 'text-[color:var(--text-muted)]'
            }`}
          >
            Create account
          </button>
        </div>

        {mode === 'signin' ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && <div className="text-center text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              className="relative flex w-full justify-center border border-[color:var(--border)] bg-[color:var(--accent)] px-4 py-3 text-sm font-bold text-[color:var(--accent-ink)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            >
              Sign in
            </button>

            <div className="text-center text-sm text-[color:var(--text-muted)]">
              <p>Demo: alice@library.edu (librarian)</p>
              <p>bob@student.edu · charlie@student.edu</p>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleRegister}>
            <div>
              <label htmlFor="reg-name" className="mb-1 block text-xs font-medium text-[color:var(--text-muted)]">
                Full name
              </label>
              <input
                id="reg-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="relative block w-full border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="Your name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="mb-1 block text-xs font-medium text-[color:var(--text-muted)]">
                Email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full border border-[color:var(--border)] bg-white px-4 py-3 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
                placeholder="you@school.edu"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
              />
            </div>

            {error && <div className="text-center text-sm text-red-700">{error}</div>}

            <button
              type="submit"
              className="relative flex w-full justify-center border border-[color:var(--border)] bg-[color:var(--accent)] px-4 py-3 text-sm font-bold text-[color:var(--accent-ink)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
            >
              Sign up as student
            </button>
            <p className="text-center text-xs text-[color:var(--text-muted)]">New accounts are students. Librarians are seeded.</p>
          </form>
        )}
      </div>
    </div>
  );
}
