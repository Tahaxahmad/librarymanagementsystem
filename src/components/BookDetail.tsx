import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, BookMarked, Bookmark, Copy, ExternalLink, Library, Star } from 'lucide-react';
import { User } from '../App';
import { openLibraryCoverUrl } from '../lib/bookCover';
import { useUIStore } from '../stores/uiStore';
import BookCover from './BookCover';

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  genre?: string;
  publication_year?: number;
  author_nationality?: string;
  kids_friendly?: number;
};

type ReviewRow = {
  id: number;
  rating: number;
  blurb: string | null;
  created_at: string;
  user_name: string;
};

type BorrowRow = { book_id: number; user_id: number; status: string; user_name: string };

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} stars`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 text-amber-500 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
        >
          <Star className={`h-7 w-7 ${n <= value ? 'fill-amber-400 text-amber-500' : 'text-[color:var(--text-muted)]'}`} strokeWidth={1.5} />
        </button>
      ))}
      <span className="ml-2 text-sm text-[color:var(--text-muted)]">{value} / 5</span>
    </div>
  );
}

function openLibraryIsbnUrl(isbn: string) {
  const clean = isbn.replace(/[-\s]/g, '');
  return `https://openlibrary.org/isbn/${clean}`;
}

const btnPrimary = 'inline-flex min-h-[2.75rem] items-center justify-center gap-2 border border-[color:var(--border)] px-4 py-2.5 text-sm font-bold transition hover:opacity-90';
const btnSecondary =
  'inline-flex min-h-[2.75rem] items-center justify-center gap-2 border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2.5 text-sm font-bold text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]';
const btnMuted = 'inline-flex min-h-[2.75rem] cursor-not-allowed items-center justify-center gap-2 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-4 py-2.5 text-sm font-bold text-[color:var(--text-muted)]';

export default function BookDetail({ currentUser }: { currentUser: User | null }) {
  const { id } = useParams();
  const mode = useUIStore((s) => s.mode);
  const [book, setBook] = useState<Book | null>(null);
  const [others, setOthers] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [borrowRows, setBorrowRows] = useState<BorrowRow[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBlurb, setReviewBlurb] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [myReview, setMyReview] = useState<{ id: number; is_approved: number } | null>(null);

  useEffect(() => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setBook(null);
    setOthers([]);
    fetch(`/api/books/${numId}`)
      .then((r) => {
        if (r.status === 404) throw new Error('nf');
        if (!r.ok) throw new Error('err');
        return r.json() as Promise<Book>;
      })
      .then((b) => {
        setBook(b);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [id]);

  useEffect(() => {
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    fetch(`/api/v1/reviews/${numId}`)
      .then((r) => r.json())
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [id]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') return;
    fetch(`/api/borrowings?userId=${currentUser.id}`)
      .then((r) => r.json())
      .then((rows: BorrowRow[]) => {
        setBorrowRows(rows);
      });
  }, [currentUser, book?.id]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student' || !book) {
      setMyReview(null);
      return;
    }
    fetch(`/api/v1/reviews/status?book_id=${book.id}&user_id=${currentUser.id}`)
      .then((r) => r.json())
      .then((row: { id?: number; is_approved?: number } | null) =>
        setMyReview(row && typeof row.id === 'number' ? { id: row.id, is_approved: Number(row.is_approved) } : null),
      )
      .catch(() => setMyReview(null));
  }, [book?.id, currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (!book?.genre) return;
    let cancelled = false;
    fetch('/api/books')
      .then((r) => r.json())
      .then((all: Book[]) => {
        if (cancelled) return;
        const related = all
          .filter((x) => x.id !== book.id && x.genre && book.genre && x.genre === book.genre)
          .slice(0, 6);
        setOthers(related);
      });
    return () => {
      cancelled = true;
    };
  }, [book?.id, book?.genre]);

  const kidsBlocked = mode === 'child' && book && book.kids_friendly !== 1;

  const borrowReserve = async (kind: 'borrow' | 'reserve') => {
    if (!currentUser || currentUser.role !== 'student' || !book) return;
    if (kind === 'borrow' && book.available_copies === 0) return;
    if (kind === 'reserve' && book.available_copies > 0) return;
    const url = kind === 'borrow' ? '/api/borrow' : '/api/reserve';
    const body = { book_id: book.id, user_id: currentUser.id };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const next = await fetch(`/api/books/${book.id}`).then((r) => r.json());
        setBook(next);
        toast.success(kind === 'borrow' ? 'Borrowed — enjoy your book' : "You're on the waitlist");
      } else {
        const err = await res.json();
        toast.error(err.error || 'Request failed');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const canLeaveReview =
    currentUser?.role === 'student' &&
    book &&
    borrowRows.some((b) => b.book_id === book.id) &&
    !myReview;

  const deleteReview = async (reviewId: number) => {
    if (!currentUser || currentUser.role !== 'librarian') return;
    if (!confirm('Remove this review permanently?')) return;
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}?librarianId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok && book) {
        toast.success('Review removed');
        fetch(`/api/v1/reviews/${book.id}`)
          .then((r) => r.json())
          .then(setReviews);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not delete');
      }
    } catch {
      toast.error('Request failed');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !book) return;
    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: book.id,
          user_id: currentUser.id,
          rating: reviewRating,
          blurb: reviewBlurb.slice(0, 120),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Review submitted — pending librarian approval');
        setReviewBlurb('');
        void fetch(`/api/v1/reviews/status?book_id=${book.id}&user_id=${currentUser.id}`)
          .then((r) => r.json())
          .then((row: { id?: number; is_approved?: number } | null) =>
            setMyReview(
              row && typeof row.id === 'number' ? { id: row.id, is_approved: Number(row.is_approved) } : { id: 0, is_approved: 0 },
            ),
          );
        fetch(`/api/v1/reviews/${book.id}`)
          .then((r) => r.json())
          .then(setReviews);
      } else if (res.status === 409) {
        toast.error((data as { error?: string }).error || 'You already have a review for this book');
        void fetch(`/api/v1/reviews/status?book_id=${book.id}&user_id=${currentUser.id}`)
          .then((r) => r.json())
          .then((row: { id?: number; is_approved?: number } | null) =>
            setMyReview(
              row && typeof row.id === 'number' ? { id: row.id, is_approved: Number(row.is_approved) } : null,
            ),
          );
      } else {
        toast.error((data as { error?: string }).error || 'Could not submit');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const copyIsbn = () => {
    if (!book?.isbn) return;
    void navigator.clipboard.writeText(book.isbn).then(
      () => toast.success('ISBN copied'),
      () => toast.error('Could not copy'),
    );
  };

  const coverUrl = book ? openLibraryCoverUrl(book.isbn, 'L') : null;

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center text-[color:var(--text-muted)]">
        Loading…
      </div>
    );
  }

  if (status === 'error' || !book) {
    return (
      <div className="mx-auto max-w-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-10 text-center">
        <p className="text-[color:var(--text-muted)]">Book not found.</p>
        <Link to="/books" className="mt-4 inline-block font-semibold text-[color:var(--accent)] hover:underline">
          Back to catalogue
        </Link>
      </div>
    );
  }

  const canBorrow = book.available_copies > 0;
  const canReserve = book.available_copies === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        to="/books"
        className="inline-flex min-h-[2.5rem] items-center gap-2 text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" />
        Catalogue
      </Link>

      {kidsBlocked && (
        <div className="border border-amber-600 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Kids mode hides this title from lists. Switch display mode in{' '}
          <Link to="/settings" className="font-semibold underline">
            Settings
          </Link>{' '}
          to see all books.
        </div>
      )}

      <div className="relative isolate overflow-x-hidden border border-[color:var(--border)] bg-[color:var(--surface)]">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[56%] min-w-0 lg:block">
          <div
            className="absolute inset-0 z-10"
            style={{
              background:
                'linear-gradient(to left, var(--surface) 0%, color-mix(in srgb, var(--surface) 88%, transparent) 22%, color-mix(in srgb, var(--surface) 42%, transparent) 48%, color-mix(in srgb, var(--surface) 12%, transparent) 68%, transparent 88%)',
            }}
          />
          <BookCover
            isbn={book.isbn}
            title={book.title}
            genre={book.genre}
            hero
            fit="cover"
            priority
            size="L"
            className="h-full min-h-[22rem] border-0"
          />
        </div>
        <div className="relative z-[1] w-full min-w-0 max-w-full space-y-5 p-6 sm:p-8 lg:w-[44%] lg:max-w-[44%]">
          <div className="flex justify-center lg:hidden">
            <BookCover isbn={book.isbn} title={book.title} genre={book.genre} className="h-72 w-48 shrink-0" size="L" />
          </div>
        <div className="min-w-0 max-w-full space-y-5">
          <div className="flex flex-wrap gap-2">
            {book.genre && (
              <span className="border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2.5 py-1 text-xs font-bold uppercase">
                {book.genre}
              </span>
            )}
            {book.kids_friendly === 1 && (
              <span className="border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2.5 py-1 text-xs font-bold uppercase">
                Kids-friendly
              </span>
            )}
            {book.publication_year ? (
              <span className="border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--text-muted)]">
                {book.publication_year}
              </span>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold leading-tight text-[color:var(--text-primary)] sm:text-4xl">{book.title}</h1>
          <p className="text-lg text-[color:var(--text-muted)]">{book.author}</p>
          {book.author_nationality && (
            <p className="text-sm text-[color:var(--text-muted)]">Author nationality: {book.author_nationality}</p>
          )}

          <div className="box-border inline-flex w-fit max-w-full min-w-0 flex-col rounded-md border border-[color:var(--border)] bg-[color:var(--app-bg)] px-4 py-3 text-sm leading-snug">
            {canBorrow ? (
              <span className="break-words font-semibold text-emerald-800 dark:text-emerald-300">
                {book.available_copies} of {book.total_copies} copies available to borrow
              </span>
            ) : (
              <span className="break-words font-semibold text-amber-900 dark:text-amber-200">
                All {book.total_copies} copies on loan — use the waitlist below
              </span>
            )}
          </div>

          {currentUser?.role === 'student' && !kidsBlocked && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!canBorrow}
                  title={!canBorrow ? 'No copies available — use Join waitlist' : undefined}
                  onClick={() => borrowReserve('borrow')}
                  className={
                    canBorrow
                      ? `${btnPrimary} bg-[color:var(--accent)] text-[color:var(--accent-ink)]`
                      : btnMuted
                  }
                >
                  Borrow
                </button>
                <button
                  type="button"
                  disabled={!canReserve}
                  title={canReserve ? undefined : 'Waitlist is only when every copy is on loan — borrow a free copy instead'}
                  onClick={() => borrowReserve('reserve')}
                  className={
                    canReserve
                      ? `${btnPrimary} bg-amber-400 text-black`
                      : btnMuted
                  }
                >
                  <Bookmark className="h-4 w-4 shrink-0" />
                  Join waitlist
                </button>
                <Link to="/borrowings" className={btnSecondary}>
                  My borrowings
                </Link>
                <Link to="/reservations" className={btnSecondary}>
                  My reservations
                </Link>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-[color:var(--text-muted)]">
                <strong className="text-[color:var(--text-primary)]">Borrow</strong> checks out a copy when one is free.{' '}
                <strong className="text-[color:var(--text-primary)]">Join waitlist</strong> holds your place when all copies are
                on loan; you’ll see the title under Reservations.
              </p>
            </div>
          )}

          {!currentUser && (
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className={`${btnPrimary} bg-[color:var(--accent)] text-[color:var(--accent-ink)]`}>
                Sign in to borrow or join a waitlist
              </Link>
            </div>
          )}

          {currentUser?.role === 'librarian' && (
            <div className="flex flex-wrap gap-3">
              <Link to="/books" className={`${btnSecondary} gap-2`}>
                <Library className="h-4 w-4 shrink-0" />
                Manage in catalogue
              </Link>
              <Link to="/admin" className={btnSecondary}>
                Admin
              </Link>
            </div>
          )}

          <div className="border-t border-[color:var(--border)] pt-5">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-[color:var(--text-primary)]">Record</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="mb-1 text-[color:var(--text-muted)]">ISBN</dt>
                <dd className="flex flex-wrap items-center gap-2 font-mono text-[color:var(--text-primary)]">
                  <span className="break-all">{book.isbn}</span>
                  <button
                    type="button"
                    onClick={copyIsbn}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs font-sans font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={openLibraryIsbnUrl(book.isbn)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[2.75rem] items-center gap-2.5 border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
              >
                <BookMarked className="h-4 w-4 shrink-0" />
                <span>Open Library record</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
              </a>
              {coverUrl && (
                <a
                  href={coverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[2.75rem] items-center gap-2.5 border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                >
                  <span>Cover image</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                </a>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <h2 className="mb-4 text-lg font-bold text-[color:var(--text-primary)]">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">No published reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((rev) => (
              <li key={rev.id} className="border-b border-[color:var(--border)] pb-4 last:border-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm text-amber-800">⭐ {rev.rating.toFixed(1)}</p>
                  {currentUser?.role === 'librarian' && (
                    <button
                      type="button"
                      onClick={() => deleteReview(rev.id)}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
                {rev.blurb && <p className="mt-1 text-sm text-[color:var(--text-body)]">&ldquo;{rev.blurb}&rdquo;</p>}
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">— {rev.user_name}</p>
              </li>
            ))}
          </ul>
        )}
        {currentUser?.role === 'student' && myReview && (
          <p className="mt-4 text-sm text-[color:var(--text-muted)]">
            {myReview.is_approved === 1
              ? 'Your review is published above.'
              : 'You already submitted a review — it is pending librarian approval.'}
          </p>
        )}
        {canLeaveReview && (
          <form onSubmit={submitReview} className="mt-6 space-y-3 border-t border-[color:var(--border)] pt-6">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">Leave a review</p>
            <div className="space-y-1">
              <span className="block text-xs text-[color:var(--text-muted)]">Rating</span>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <label className="block text-xs text-[color:var(--text-muted)]">
              Short quote (max 120 characters)
              <textarea
                value={reviewBlurb}
                onChange={(e) => setReviewBlurb(e.target.value.slice(0, 120))}
                rows={3}
                className="mt-1 w-full border border-[color:var(--border)] bg-white p-2 text-sm"
                maxLength={120}
              />
            </label>
            <button
              type="submit"
              className="border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 text-sm font-bold text-white"
            >
              Submit for approval
            </button>
          </form>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-[color:var(--text-primary)]">More in this genre</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {others.map((b) => (
              <Link
                key={b.id}
                to={`/books/${b.id}`}
                className="flex min-w-[10rem] max-w-[11rem] shrink-0 flex-col overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] transition hover:border-[color:var(--accent)]"
              >
                <div className="relative aspect-[2/3] w-full shrink-0 overflow-hidden">
                  <BookCover isbn={b.isbn} title={b.title} genre={b.genre} className="h-full w-full" size="M" />
                </div>
                <div className="flex min-h-[4.5rem] flex-col justify-center border-t border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--text-primary)]">{b.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-[color:var(--text-muted)]">{b.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
