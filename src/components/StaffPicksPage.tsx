import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Star, Loader2 } from 'lucide-react';
import type { User } from '../App';
import BookCover from './BookCover';

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  genre?: string;
  is_staff_pick?: number;
  staff_pick_note?: string | null;
  total_copies?: number;
  available_copies?: number;
  publication_year?: number;
  author_nationality?: string;
  kids_friendly?: number;
};

const cardFooter = 'flex min-h-[4.5rem] flex-col justify-center border-t border-[color:var(--border)] bg-[color:var(--surface)] p-3';

export default function StaffPicksPage({ currentUser }: { currentUser: User | null }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [catalogue, setCatalogue] = useState<Book[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadPicks = () => {
    fetch('/api/v1/books/staff-picks')
      .then((r) => r.json())
      .then(setBooks)
      .catch(() => setBooks([]));
  };

  useEffect(() => {
    loadPicks();
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'librarian') return;
    fetch('/api/books')
      .then((r) => r.json())
      .then((rows: Book[]) => (Array.isArray(rows) ? setCatalogue(rows) : setCatalogue([])))
      .catch(() => setCatalogue([]));
  }, [currentUser?.role]);

  const setStaffPick = async (book: Book, next: boolean) => {
    if (currentUser?.role !== 'librarian') return;
    setSavingId(book.id);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...book,
          is_staff_pick: next ? 1 : 0,
          staff_pick_note: next ? book.staff_pick_note || 'Hand-picked for readers.' : '',
        }),
      });
      if (res.ok) {
        toast.success(next ? 'Added to staff picks' : 'Removed from staff picks');
        loadPicks();
        setCatalogue((prev) =>
          prev.map((b) =>
            b.id === book.id ? { ...b, is_staff_pick: next ? 1 : 0, staff_pick_note: next ? book.staff_pick_note : null } : b,
          ),
        );
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not update');
      }
    } catch {
      toast.error('Request failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">Staff picks</h1>
        <p className="mt-1 text-[color:var(--text-muted)]">Curated by our librarians</p>
        {currentUser?.role === 'librarian' && (
          <p className="mt-3 max-w-2xl text-sm text-[color:var(--text-muted)]">
            Use the toggles below to add or remove titles from this shelf. You can also set staff picks when editing any book in the{' '}
            <Link to="/books" className="font-semibold text-[color:var(--primary)] hover:underline">
              catalogue
            </Link>
            .
          </p>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {books.map((book) => (
          <Link
            key={book.id}
            to={`/books/${book.id}`}
            className="group flex min-w-[11rem] max-w-[12rem] shrink-0 flex-col overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)] transition hover:border-[color:var(--primary)]"
            title={book.staff_pick_note || undefined}
          >
            <div className="relative">
              <span className="absolute left-2 top-2 z-10 border border-[color:var(--gold)] bg-[color:var(--bg-surface)]/95 px-2 py-0.5 text-[10px] font-bold text-[color:var(--gold)]">
                <Star className="mb-0.5 mr-0.5 inline h-3 w-3" aria-hidden />
                Staff Pick
              </span>
              <div className="relative aspect-[2/3] w-full overflow-hidden">
                <BookCover isbn={book.isbn} title={book.title} genre={book.genre} className="h-full w-full" size="M" />
              </div>
            </div>
            <div className={cardFooter}>
              <h2 className="line-clamp-2 text-sm font-bold text-[color:var(--text-primary)]">{book.title}</h2>
              <p className="mt-1 line-clamp-2 text-xs text-[color:var(--text-muted)] opacity-0 transition group-hover:opacity-100">
                {book.staff_pick_note || '—'}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {books.length === 0 && <p className="text-[color:var(--text-muted)]">No staff picks yet.</p>}

      {currentUser?.role === 'librarian' && catalogue.length > 0 && (
        <section className="border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--text-heading)]">Manage staff picks</h2>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">Toggle titles on or off the staff picks shelf.</p>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
            {catalogue.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate font-medium text-[color:var(--text-primary)]">{b.title}</span>
                <button
                  type="button"
                  disabled={savingId === b.id}
                  onClick={() => void setStaffPick(b, !b.is_staff_pick)}
                  className={`shrink-0 rounded border px-3 py-1.5 text-xs font-bold transition ${
                    b.is_staff_pick
                      ? 'border-[color:var(--gold)] bg-[color:var(--gold)]/15 text-[color:var(--text-primary)]'
                      : 'border-[color:var(--border)] text-[color:var(--text-muted)] hover:border-[color:var(--primary)]'
                  }`}
                >
                  {savingId === b.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : b.is_staff_pick ? (
                    'On shelf'
                  ) : (
                    'Add to shelf'
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
