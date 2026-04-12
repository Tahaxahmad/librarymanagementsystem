import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  BookOpen,
  Users,
  BookMarked,
  LayoutDashboard,
  Bookmark,
  ArrowRight,
  Library,
} from 'lucide-react';
import type { User } from '../App';
import Students from './Students';

type Stats = {
  totalBooks: number;
  studentCount: number;
  activeBorrowings: number;
  activeReservations: number;
};

const cardClass =
  'border border-[color:var(--border)] bg-[color:var(--surface)] p-6 transition hover:border-[color:var(--primary)]';

type PendingReview = {
  id: number;
  book_id: number;
  rating: number;
  blurb: string | null;
  book_title: string;
  user_name: string;
};

type AllReview = {
  id: number;
  book_id: number;
  rating: number;
  blurb: string | null;
  is_approved: number;
  created_at: string;
  book_title: string;
  user_name: string;
};

export default function Admin({
  currentUser,
  onUsersChange,
}: {
  currentUser: User;
  onUsersChange?: Dispatch<SetStateAction<User[]>>;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [allReviews, setAllReviews] = useState<AllReview[]>([]);

  const loadPending = () => {
    fetch(`/api/v1/reviews/pending?librarianId=${currentUser.id}`)
      .then((r) => r.json())
      .then(setPendingReviews)
      .catch(() => setPendingReviews([]));
  };

  const loadAllReviews = () => {
    fetch(`/api/v1/admin/reviews/all?librarianId=${currentUser.id}`)
      .then((r) => r.json())
      .then(setAllReviews)
      .catch(() => setAllReviews([]));
  };

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  useEffect(() => {
    if (currentUser.role === 'librarian') loadPending();
  }, [currentUser.id, currentUser.role]);

  useEffect(() => {
    if (currentUser.role === 'librarian' && tab === 'reviews') loadAllReviews();
  }, [currentUser.id, currentUser.role, tab]);

  const deleteReview = async (reviewId: number) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}?librarianId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Review deleted');
        loadAllReviews();
        loadPending();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not delete');
      }
    } catch {
      toast.error('Request failed');
    }
  };

  const approveReview = async (reviewId: number) => {
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ librarian_id: currentUser.id }),
      });
      if (res.ok) {
        toast.success('Review approved');
        loadPending();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not approve');
      }
    } catch {
      toast.error('Request failed');
    }
  };

  if (currentUser.role !== 'librarian') {
    return (
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
        <p className="text-[color:var(--text-muted)]">Librarians only.</p>
        <Link to="/" className="mt-4 inline-block font-bold text-[color:var(--primary)] hover:underline">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <header className="border-b border-[color:var(--border)] pb-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--primary)] text-white">
            <LayoutDashboard className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-primary)] sm:text-3xl">Library admin</h1>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              Signed in as <span className="font-medium text-[color:var(--text-primary)]">{currentUser.name}</span> — manage
              catalogue, patrons, and loans from here.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-[color:var(--border)] pb-4">
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'students', label: 'Students' },
            { id: 'reviews', label: 'All reviews' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSearchParams({ tab: t.id })}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              tab === t.id
                ? 'bg-[color:var(--primary)] text-white'
                : 'border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' ? (
        <Students currentUser={currentUser} onUsersChange={onUsersChange} />
      ) : tab === 'reviews' ? (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Moderation</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Delete spam or inappropriate reviews. Staff picks are edited under{' '}
            <Link to="/books" className="font-semibold text-[color:var(--primary)] hover:underline">
              Catalogue
            </Link>{' '}
            when you edit a book.
          </p>
          <ul className="space-y-3">
            {allReviews.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <Link to={`/books/${r.book_id}`} className="font-semibold text-[color:var(--primary)] hover:underline">
                    {r.book_title}
                  </Link>
                  <p className="text-sm text-[color:var(--text-muted)]">
                    {r.user_name} · ⭐ {r.rating}{' '}
                    <span className={r.is_approved ? 'text-emerald-800' : 'text-amber-800'}>
                      ({r.is_approved ? 'approved' : 'pending'})
                    </span>
                  </p>
                  {r.blurb && <p className="mt-1 text-sm text-[color:var(--text-body)]">&ldquo;{r.blurb}&rdquo;</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteReview(r.id)}
                  className="shrink-0 border border-red-700 px-3 py-1.5 text-xs font-bold text-red-800 hover:bg-red-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {allReviews.length === 0 && (
            <p className="text-sm text-[color:var(--text-muted)]">No reviews in the system yet.</p>
          )}
        </section>
      ) : (
        <>
      <section aria-labelledby="admin-stats">
        <h2 id="admin-stats" className="mb-4 text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
          Overview
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={cardClass}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <BookOpen className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={2} />
            </div>
            <div className="text-3xl font-bold tabular-nums text-[color:var(--text-primary)]">{stats?.totalBooks ?? '—'}</div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-muted)]">Titles in catalogue</div>
          </div>
          <div className={cardClass}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <Users className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={2} />
            </div>
            <div className="text-3xl font-bold tabular-nums text-[color:var(--text-primary)]">{stats?.studentCount ?? '—'}</div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-muted)]">Student accounts</div>
          </div>
          <div className={cardClass}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <BookMarked className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={2} />
            </div>
            <div className="text-3xl font-bold tabular-nums text-[color:var(--text-primary)]">
              {stats?.activeBorrowings ?? '—'}
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-muted)]">Active loans</div>
          </div>
          <div className={cardClass}>
            <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <Bookmark className="h-5 w-5 text-[color:var(--primary)]" strokeWidth={2} />
            </div>
            <div className="text-3xl font-bold tabular-nums text-[color:var(--text-primary)]">
              {stats?.activeReservations ?? '—'}
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-muted)]">Active waitlists</div>
          </div>
        </div>
      </section>

      {pendingReviews.length > 0 && (
        <section aria-labelledby="admin-reviews">
          <h2 id="admin-reviews" className="mb-4 text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
            Reviews awaiting approval
          </h2>
          <ul className="space-y-3">
            {pendingReviews.map((pr) => (
              <li
                key={pr.id}
                className="flex flex-col gap-3 border border-[color:var(--border)] bg-[color:var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-[color:var(--text-primary)]">{pr.book_title}</p>
                  <p className="text-sm text-[color:var(--text-muted)]">
                    {pr.user_name} · ⭐ {pr.rating}
                  </p>
                  {pr.blurb && <p className="mt-1 text-sm text-[color:var(--text-body)]">&ldquo;{pr.blurb}&rdquo;</p>}
                </div>
                <button
                  type="button"
                  onClick={() => approveReview(pr.id)}
                  className="shrink-0 border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="admin-actions">
        <h2 id="admin-actions" className="mb-4 text-xs font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
          Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/books"
            className="group flex items-start gap-4 border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:border-[color:var(--primary)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <Library className="h-5 w-5 text-[color:var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[color:var(--text-primary)]">Catalogue</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition group-hover:text-[color:var(--primary)]" />
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">Add, edit, or remove books and copies.</p>
            </div>
          </Link>
          <Link
            to="/admin?tab=students"
            className="group flex items-start gap-4 border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:border-[color:var(--primary)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <Users className="h-5 w-5 text-[color:var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[color:var(--text-primary)]">Students</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition group-hover:text-[color:var(--primary)]" />
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">View registered student accounts.</p>
            </div>
          </Link>
          <Link
            to="/borrowings"
            className="group flex items-start gap-4 border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:border-[color:var(--primary)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <BookMarked className="h-5 w-5 text-[color:var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[color:var(--text-primary)]">Borrowings</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition group-hover:text-[color:var(--primary)]" />
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">Process returns and see who has what.</p>
            </div>
          </Link>
          <Link
            to="/reservations"
            className="group flex items-start gap-4 border border-[color:var(--border)] bg-[color:var(--surface)] p-5 transition hover:border-[color:var(--primary)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-[color:var(--border)] bg-[color:var(--app-bg)]">
              <Bookmark className="h-5 w-5 text-[color:var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[color:var(--text-primary)]">Reservations</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition group-hover:text-[color:var(--primary)]" />
              </div>
              <p className="mt-1 text-sm text-[color:var(--text-muted)]">Waitlists when every copy is on loan.</p>
            </div>
          </Link>
        </div>
      </section>
        </>
      )}
    </div>
  );
}
