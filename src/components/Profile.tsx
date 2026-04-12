import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../App';
import { Mail, Shield, User as UserIcon, Settings, BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react';

export default function Profile({ currentUser }: { currentUser: User }) {
  const [activeLoans, setActiveLoans] = useState(0);

  useEffect(() => {
    fetch('/api/borrowings')
      .then((r) => r.json())
      .then((rows: { status: string; user_name: string }[]) => {
        const mine = rows.filter((b) => b.user_name === currentUser.name && b.status === 'borrowed');
        setActiveLoans(mine.length);
      });
  }, [currentUser.name]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="border-b border-[color:var(--border)] bg-[color:var(--surface)] px-6 py-8 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-[color:var(--border)] bg-[color:var(--primary)] text-3xl font-bold text-white">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[color:var(--text-primary)] sm:text-3xl">{currentUser.name}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm font-medium capitalize text-[color:var(--text-muted)]">
                  <Shield className="h-4 w-4" />
                  {currentUser.role}
                </p>
                <p className="mt-2 text-sm text-[color:var(--text-muted)]">{currentUser.email}</p>
              </div>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center gap-2 self-start border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-bold text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
            >
              <Settings className="h-4 w-4" />
              Settings &amp; display
            </Link>
          </div>
        </div>

        <div className="grid gap-px bg-[color:var(--border)] sm:grid-cols-2">
          <div className="bg-[color:var(--surface)] p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--text-muted)]">
              <BookOpen className="h-4 w-4" />
              Active loans
            </div>
            <p className="mt-2 text-3xl font-bold text-[color:var(--text-primary)]">{activeLoans}</p>
            <Link to="/borrowings" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[color:var(--primary)] hover:underline">
              View borrowings <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="bg-[color:var(--surface)] p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--text-muted)]">
              <Clock className="h-4 w-4" />
              Quick links
            </div>
            <Link
              to="/books"
              className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[color:var(--primary)] hover:underline"
            >
              Browse catalogue <ChevronRight className="h-4 w-4" />
            </Link>
            {currentUser.role === 'student' && (
              <Link
                to="/reading-dna"
                className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[color:var(--primary)] hover:underline"
              >
                <Sparkles className="h-4 w-4" />
                Reading DNA <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="mb-4 border-b border-[color:var(--border)] pb-2 text-lg font-bold text-[color:var(--text-primary)]">
            Account details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border border-[color:var(--border)] bg-[color:var(--app-bg)] p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--text-muted)]">
                <UserIcon className="h-4 w-4" />
                Full name
              </div>
              <p className="font-semibold text-[color:var(--text-primary)]">{currentUser.name}</p>
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--app-bg)] p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--text-muted)]">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="font-semibold text-[color:var(--text-primary)]">{currentUser.email}</p>
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--app-bg)] p-4 sm:col-span-2">
              <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--text-muted)]">
                <Shield className="h-4 w-4" />
                Role
              </div>
              <p className="font-semibold capitalize text-[color:var(--text-primary)]">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
