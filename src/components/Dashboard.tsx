import { ChevronLeft, ChevronRight, Sparkles, Star, Dices } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, differenceInHours, format } from 'date-fns';
import { toast } from 'sonner';
import { User } from '../App';
import { coverGradient, initials } from '../lib/bookCover';
import { useUIStore } from '../stores/uiStore';
import BookCover from './BookCover';
import BookDetailModal, { BookModalData } from './BookDetailModal';

type BookRow = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  genre?: string;
  publication_year?: number;
  kids_friendly?: number;
  is_staff_pick?: number;
  staff_pick_note?: string | null;
};

type BorrowingRow = {
  id: number;
  book_id: number;
  book_title: string;
  book_author: string;
  user_name: string;
  borrow_date: string;
  due_date: string;
  status: 'borrowed' | 'returned';
  renew_count?: number;
  renew_extra_allowed?: number;
};

type TrendRow = { id: number; title: string; author: string; reader_count: number };

type ReviewRec = {
  id: number;
  rating: number;
  blurb: string | null;
  user_name: string;
  book_id: number;
  title: string;
  author: string;
  isbn: string;
  genre?: string;
};

function readingProgress(borrowDate: string, dueDate: string): number {
  const start = new Date(borrowDate);
  const end = new Date(dueDate);
  const now = new Date();
  const total = Math.max(1, differenceInDays(end, start));
  const elapsed = differenceInDays(now, start);
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

function displayNameShort(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 0) return 'Member';
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const initial = last.charAt(0).toUpperCase();
  return `${parts[0]} ${initial}.`;
}

const reviewCats = [
  { id: 'all', label: 'All' },
  { id: 'fiction', label: 'Fiction' },
  { id: 'nonfiction', label: 'Non-Fiction' },
  { id: 'academic', label: 'Academic' },
] as const;

export default function Dashboard({ currentUser }: { currentUser: User | null }) {
  const mode = useUIStore((s) => s.mode);
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingRow[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [trending, setTrending] = useState<TrendRow[]>([]);
  const [staffPicks, setStaffPicks] = useState<BookRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRec[]>([]);
  const [reviewCat, setReviewCat] = useState<(typeof reviewCats)[number]['id']>('all');
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [surpriseBook, setSurpriseBook] = useState<BookModalData | null>(null);

  useEffect(() => {
    fetch('/api/books')
      .then((r) => r.json())
      .then(setBooks);
    fetch('/api/v1/books/trending')
      .then((r) => r.json())
      .then(setTrending);
    fetch('/api/v1/books/staff-picks')
      .then((r) => r.json())
      .then(setStaffPicks);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setBorrowings([]);
      return;
    }
    fetch(`/api/borrowings?userId=${currentUser.id}`)
      .then((r) => r.json())
      .then(setBorrowings);
  }, [currentUser?.id]);

  useEffect(() => {
    const q = reviewCat === 'all' ? '' : `?category=${encodeURIComponent(reviewCat)}`;
    fetch(`/api/v1/reviews/recommendations${q}`)
      .then((r) => r.json())
      .then((rows: ReviewRec[]) => setReviews(rows.slice(0, 3)));
  }, [reviewCat]);

  const visibleBooks = useMemo(() => {
    return mode !== 'child' ? books : books.filter((b) => b.kids_friendly === 1);
  }, [books, mode]);

  const heroPool = useMemo(() => {
    const withStock = visibleBooks.filter((b) => b.available_copies > 0);
    return (withStock.length ? withStock : visibleBooks).slice(0, 8);
  }, [visibleBooks]);

  const heroPoolIds = useMemo(() => heroPool.map((b) => b.id).join(','), [heroPool]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroPoolIds]);

  useEffect(() => {
    if (heroPool.length < 2 || reduceMotion) return;
    const id = window.setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroPool.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroPool.length, heroPoolIds, reduceMotion]);

  const featured = heroPool[heroIndex % Math.max(heroPool.length, 1)];

  const myContinue = useMemo(() => {
    if (!currentUser) return [];
    return borrowings.filter((b) => b.status === 'borrowed').slice(0, 5);
  }, [borrowings, currentUser]);

  const newArrivals = useMemo(() => [...visibleBooks].sort((a, b) => b.id - a.id).slice(0, 5), [visibleBooks]);

  const recommendations = useMemo(() => [...visibleBooks].sort((a, b) => b.id - a.id).slice(0, 8), [visibleBooks]);

  const nextHero = () => setHeroIndex((i) => (heroPool.length ? (i + 1) % heroPool.length : 0));
  const prevHero = () =>
    setHeroIndex((i) => (heroPool.length ? (i - 1 + heroPool.length) % heroPool.length : 0));

  const surprise = async () => {
    try {
      const res = await fetch('/api/v1/books/random');
      if (!res.ok) {
        toast.error('No available book right now');
        return;
      }
      const b = (await res.json()) as BookModalData;
      setSurpriseBook(b);
      setSurpriseOpen(true);
    } catch {
      toast.error('Could not pick a book');
    }
  };

  const renew = async (borrowingId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrowing_id: borrowingId, user_id: currentUser.id }),
      });
      if (res.ok) {
        const br = await fetch(`/api/borrowings?userId=${currentUser.id}`).then((r) => r.json());
        setBorrowings(br);
        toast.success('Loan extended by 14 days');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Renew failed');
      }
    } catch {
      toast.error('Renew failed');
    }
  };

  const canRenewLoan = (row: BorrowingRow) => {
    const rc = Number(row.renew_count ?? 0);
    const ex = Number(row.renew_extra_allowed ?? 0);
    if (rc >= 2) return false;
    if (rc === 0) return true;
    return rc === 1 && ex === 1;
  };

  if (books.length === 0) {
    return (
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
        <p className="text-[color:var(--text-muted)]">No books in the catalogue yet.</p>
        <Link to="/books" className="mt-4 inline-block font-semibold text-[color:var(--primary)] hover:underline">
          Open catalogue
        </Link>
      </div>
    );
  }

  if (visibleBooks.length === 0) {
    return (
      <div className="border border-[color:var(--border)] bg-[color:var(--surface)] p-12 text-center">
        <p className="text-[color:var(--text-muted)]">No kids-friendly titles in the catalogue yet.</p>
        <Link to="/settings" className="mt-4 inline-block font-semibold text-[color:var(--primary)] hover:underline">
          Change display mode
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <BookDetailModal book={surpriseBook} open={surpriseOpen} onClose={() => setSurpriseOpen(false)} />

      {featured && (
        <section className="relative overflow-hidden border border-[#334155] bg-[#0f172a] shadow-lg">
          <div className="relative border-b border-[#334155]/80 px-4 py-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#94a3b8]">
              <Sparkles className="h-4 w-4 text-[color:var(--nav-accent)]" aria-hidden />
              Featured this week
            </div>
          </div>

          <div className="relative min-h-[min(22rem,78vw)] lg:min-h-[17rem]">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-[1] hidden w-[62%] lg:block">
              <div
                className="absolute inset-0 z-10"
                style={{
                  background:
                    'linear-gradient(to left, rgb(15 23 42) 0%, rgba(15, 23, 42, 0.92) 12%, rgba(15, 23, 42, 0.55) 38%, rgba(15, 23, 42, 0.18) 58%, transparent 78%)',
                }}
              />
              <BookCover
                isbn={featured.isbn}
                title={featured.title}
                genre={featured.genre}
                hero
                fit="cover"
                priority
                size="L"
                className="h-full min-h-[17rem] border-0"
              />
            </div>

            <div className="relative z-[2] flex flex-col gap-4 p-6 lg:max-w-[55%] lg:pr-4">
              <div className="lg:hidden">
                <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-sm border border-[#334155]">
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background: 'linear-gradient(to top, rgb(15 23 42) 0%, rgba(15,23,42,0.5) 40%, transparent 72%)',
                    }}
                  />
                  <BookCover
                    isbn={featured.isbn}
                    title={featured.title}
                    genre={featured.genre}
                    fit="cover"
                    priority
                    size="L"
                    className="h-full w-full border-0 !aspect-auto"
                    hero
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {featured.genre && (
                  <span className="bg-[color:var(--nav-accent)] px-2.5 py-1 text-xs font-bold uppercase text-white">
                    {featured.genre}
                  </span>
                )}
                {featured.publication_year ? (
                  <span className="border border-[#475569] px-2.5 py-1 text-xs font-medium text-[#94a3b8]">
                    {featured.publication_year}
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{featured.title}</h1>
              <p className="text-[#94a3b8]">{featured.author}</p>
              <p className="text-sm leading-relaxed text-[#cbd5e1]">
                {featured.available_copies > 0
                  ? `${featured.available_copies} ${featured.available_copies === 1 ? 'copy' : 'copies'} available — borrow from the catalogue.`
                  : 'All copies on loan — reserve or browse similar titles.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to={`/books/${featured.id}`}
                  className="inline-flex border border-transparent bg-[color:var(--primary)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[color:var(--primary-hover)]"
                >
                  View Details
                </Link>
                <Link
                  to="/books"
                  className="inline-flex border border-[#64748b] bg-transparent px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                >
                  Browse Catalogue
                </Link>
                {currentUser ? (
                  <Link
                    to="/borrowings"
                    className="inline-flex px-2 py-2.5 text-sm font-bold text-[#94a3b8] hover:text-white"
                  >
                    Borrow Now
                  </Link>
                ) : (
                  <Link to="/login" className="inline-flex px-2 py-2.5 text-sm font-bold text-[#94a3b8] hover:text-white">
                    Sign in to Borrow
                  </Link>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={prevHero}
                    className="flex h-10 w-10 items-center justify-center border border-[#475569] bg-[#1e293b] text-white hover:bg-[#334155]"
                    aria-label="Previous featured book"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextHero}
                    className="flex h-10 w-10 items-center justify-center border border-[#475569] bg-[#1e293b] text-white hover:bg-[#334155]"
                    aria-label="Next featured book"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="-mx-3 border-y border-[color:var(--border)] bg-[color:var(--bg-surface-2)] px-4 py-5 sm:-mx-6 sm:px-6">
        <h2 className="mb-3 text-sm font-bold text-[color:var(--text-heading)]">Trending This Week</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trending.map((t) => (
            <Link
              key={t.id}
              to={`/books/${t.id}`}
              className="shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm text-[color:var(--text-body)] shadow-sm hover:border-[color:var(--primary)]"
            >
              {t.title} · {t.reader_count} readers
            </Link>
          ))}
          {trending.length === 0 && (
            <span className="text-sm text-[color:var(--text-muted)]">No trending borrows in the last 7 days.</span>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[color:var(--border)] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-heading)]">New arrivals</h2>
            <Link to="/books" className="text-xs font-bold text-[color:var(--primary)] hover:underline">
              See all
            </Link>
          </div>
          <ul className="space-y-3">
            {newArrivals.map((book) => (
              <li key={book.id}>
                <Link
                  to={`/books/${book.id}`}
                  className="group flex gap-3 border border-transparent p-1 transition hover:border-[color:var(--border)] hover:bg-[color:var(--app-bg)]"
                >
                  <BookCover isbn={book.isbn} title={book.title} genre={book.genre} className="h-16 w-11 shrink-0" size="S" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[color:var(--text-primary)] group-hover:text-[color:var(--primary)]">
                      {book.title}
                    </p>
                    <p className="truncate text-xs text-[color:var(--text-muted)]">{book.author}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[color:var(--border)] pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--text-heading)]">Continue reading</h2>
            {currentUser && (
              <Link to="/borrowings" className="text-xs font-bold text-[color:var(--primary)] hover:underline">
                See all
              </Link>
            )}
          </div>
          {!currentUser ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-[color:var(--text-muted)]">Sign in to track loans and due dates.</p>
              <Link
                to="/login"
                className="inline-flex border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[color:var(--primary-hover)]"
              >
                Sign in
              </Link>
            </div>
          ) : myContinue.length === 0 ? (
            <p className="py-8 text-center text-sm text-[color:var(--text-muted)]">No active loans.</p>
          ) : (
            <ul className="space-y-3">
              {myContinue.map((row) => {
                const pct = readingProgress(row.borrow_date, row.due_date);
                const due = new Date(row.due_date);
                const hrs = differenceInHours(due, new Date());
                const overdue = due < new Date();
                return (
                  <li key={row.id} className="flex flex-col gap-2 border border-[color:var(--border)] bg-[color:var(--app-bg)] p-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <div
                        className="h-20 w-12 shrink-0 border border-[color:var(--border)]"
                        style={{ background: coverGradient(row.book_title) }}
                      >
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                          {initials(row.book_title)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/books/${row.book_id}`}
                          className="truncate font-semibold text-[color:var(--primary)] hover:underline"
                        >
                          {row.book_title}
                        </Link>
                        <p className="truncate text-xs text-[color:var(--text-muted)]">{row.book_author}</p>
                        <p className={`mt-1 text-xs ${overdue ? 'font-bold text-red-700' : 'text-[color:var(--text-muted)]'}`}>
                          Due {format(due, 'MMM d')}
                          {!overdue && hrs < 72 ? ` · ${hrs}h left` : ''}
                          {overdue ? ' · Overdue' : ''}
                        </p>
                        <div className="mt-2 h-2 overflow-hidden border border-[color:var(--border)] bg-white">
                          <div className="h-full bg-[color:var(--primary)] transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!canRenewLoan(row)}
                      title={
                        !canRenewLoan(row)
                          ? 'Use your one renew, or ask a librarian to approve another extension'
                          : 'Extend due date by 14 days'
                      }
                      onClick={() => renew(row.id)}
                      className="shrink-0 border border-[color:var(--secondary)] bg-white px-3 py-1.5 text-xs font-bold text-[color:var(--secondary)] hover:bg-[color:var(--bg-surface-2)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Renew
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">Member recommendations</h2>
          <div className="flex flex-wrap gap-1">
            {reviewCats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setReviewCat(c.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  reviewCat === c.id
                    ? 'bg-[color:var(--primary)] text-white'
                    : 'border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text-muted)] hover:border-[color:var(--primary)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {reviews.map((r) => (
            <article
              key={r.id}
              className="flex flex-col border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
            >
              <div className="mb-3 flex gap-3">
                <BookCover isbn={r.isbn} title={r.title} genre={r.genre} className="h-24 w-16 shrink-0" size="S" />
                <div className="min-w-0">
                  <Link to={`/books/${r.book_id}`} className="font-semibold text-[color:var(--text-primary)] hover:text-[color:var(--primary)]">
                    {r.title}
                  </Link>
                  <p className="text-xs text-[color:var(--text-muted)]">{r.author}</p>
                  <p className="mt-1 text-sm text-amber-700">
                    ⭐ {r.rating.toFixed(1)}
                  </p>
                </div>
              </div>
              <p className="line-clamp-3 flex-1 text-sm text-[color:var(--text-body)]">
                {r.blurb ? `"${r.blurb.length > 120 ? r.blurb.slice(0, 117) + '…' : r.blurb}"` : '—'}
              </p>
              <p className="mt-3 text-xs text-[color:var(--text-muted)]">— {displayNameShort(r.user_name)}</p>
            </article>
          ))}
        </div>
        {reviews.length === 0 && (
          <p className="text-sm text-[color:var(--text-muted)]">No approved reviews in this category yet.</p>
        )}
        <p className="mt-3 text-xs text-[color:var(--text-muted)]">
          Leave a review after you have borrowed a title at least once — librarians approve before publication.
        </p>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">Staff picks</h2>
          <p className="text-sm text-[color:var(--text-muted)]">Curated by our librarians</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {staffPicks.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="group relative flex min-w-[10.5rem] max-w-[11rem] shrink-0 flex-col overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] transition hover:border-[color:var(--primary)]"
              title={book.staff_pick_note || undefined}
            >
              <span className="absolute left-2 top-2 z-10 flex items-center gap-0.5 border border-[color:var(--gold)] bg-[color:var(--bg-surface)]/95 px-1.5 py-0.5 text-[10px] font-bold text-[color:var(--gold)]">
                <Star className="h-3 w-3" aria-hidden />
                Staff Pick
              </span>
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <BookCover isbn={book.isbn} title={book.title} genre={book.genre} className="h-full w-full" size="M" />
              </div>
              <div className="flex min-h-[4.5rem] flex-col justify-center border-t border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                <h3 className="line-clamp-2 text-sm font-bold text-[color:var(--text-primary)]">{book.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-[color:var(--text-muted)] opacity-0 transition group-hover:opacity-100">
                  {book.staff_pick_note || '—'}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {staffPicks.length === 0 && <p className="text-sm text-[color:var(--text-muted)]">No staff picks yet.</p>}
      </section>

      <section className="relative overflow-hidden border border-[#3730a3] bg-gradient-to-br from-[#4338ca] to-[#3730a3] px-6 py-12 text-center text-white">
        <Dices className="mx-auto mb-4 h-10 w-10 opacity-90" aria-hidden />
        <h2 className="text-xl font-bold">Surprise Me</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-indigo-100">Feeling adventurous? We&apos;ll find your next read.</p>
        <button
          type="button"
          onClick={surprise}
          className="mt-6 inline-flex items-center gap-2 border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold backdrop-blur-sm hover:bg-white/20"
        >
          Surprise Me — Pick a Random Book
        </button>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[color:var(--text-heading)]">Popular picks</h2>
          <Link to="/books" className="text-sm font-bold text-[color:var(--primary)] hover:underline">
            See all
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recommendations.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="flex min-w-[10.5rem] max-w-[11rem] shrink-0 flex-col overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm transition hover:border-[color:var(--primary)]"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <BookCover isbn={book.isbn} title={book.title} genre={book.genre} className="h-full w-full" size="M" />
              </div>
              <div className="flex min-h-[4.5rem] flex-col justify-center border-t border-[color:var(--border)] bg-[color:var(--surface)] p-3">
                {book.genre && (
                  <span className="mb-1 inline-block border border-[color:var(--border)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[color:var(--text-muted)]">
                    {book.genre}
                  </span>
                )}
                <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[color:var(--text-primary)]">{book.title}</h3>
                <p className="mt-1 line-clamp-1 text-xs text-[color:var(--text-muted)]">{book.author}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
