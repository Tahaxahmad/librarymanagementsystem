import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import BookCover from './BookCover';

export type BookModalData = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
  total_copies: number;
  genre?: string;
  publication_year?: number;
};

export default function BookDetailModal({
  book,
  open,
  onClose,
}: {
  book: BookModalData | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !book) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        className="relative z-10 w-full max-w-lg border border-[color:var(--border)] bg-[color:var(--surface)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] p-4">
          <h2 id="book-modal-title" className="text-lg font-bold text-[color:var(--text-primary)]">
            {book.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-4 p-4">
          <BookCover isbn={book.isbn} title={book.title} className="h-40 w-28 shrink-0" size="M" />
          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <p className="text-[color:var(--text-muted)]">{book.author}</p>
            {book.genre && (
              <span className="inline-block bg-[color:var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[color:var(--primary)]">
                {book.genre}
              </span>
            )}
            {book.publication_year ? (
              <p className="text-xs text-[color:var(--text-muted)]">{book.publication_year}</p>
            ) : null}
            <p className="text-[color:var(--text-body)]">
              {book.available_copies > 0
                ? `${book.available_copies} of ${book.total_copies} copies available`
                : 'All copies on loan'}
            </p>
            <Link
              to={`/books/${book.id}`}
              onClick={onClose}
              className="inline-flex border border-[color:var(--border)] bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-ink)] hover:opacity-90"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
