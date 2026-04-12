import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, X, Unlock, RotateCcw, Filter, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../App';
import { useSearchQuery } from '../context/SearchContext';
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
  is_staff_pick?: number;
  staff_pick_note?: string | null;
};

type ListMeta = { total: number; page: number; limit: number; totalPages: number };

const inputClass =
  'w-full border border-[color:var(--border)] bg-white px-2.5 py-2 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--primary)]';

export default function Books({ currentUser }: { currentUser: User | null }) {
  const { query: search, setQuery } = useSearchQuery();
  const mode = useUIStore((s) => s.mode);
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [meta, setMeta] = useState<ListMeta>({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [allBooksForFilters, setAllBooksForFilters] = useState<Book[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    total_copies: 1,
    genre: '',
    publication_year: '' as any,
    author_nationality: '',
    kids_friendly: 0,
    is_staff_pick: 0,
    staff_pick_note: '',
  });

  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 10));
  const filterGenre = searchParams.get('genre') || '';
  const filterYear = searchParams.get('year') || '';
  const filterNationality = searchParams.get('nationality') || '';
  const sort = searchParams.get('sort') || 'title';
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(updates)) {
            if (v === null || v === '') next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    fetch('/api/books')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllBooksForFilters(data);
      })
      .catch(() => setAllBooksForFilters([]));
  }, []);

  const urlQRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const raw = searchParams.get('q');
    if (urlQRef.current === undefined) {
      urlQRef.current = raw;
      if (raw !== null) setQuery(raw.trim());
      return;
    }
    if (raw !== urlQRef.current) {
      urlQRef.current = raw;
      setQuery(raw !== null ? raw.trim() : '');
    }
  }, [searchParams, setQuery]);

  const effectiveSearch = search.trim() || (searchParams.get('q') ?? '').trim();

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterGenre) params.set('genre', filterGenre);
    if (filterYear) params.set('year', filterYear);
    if (filterNationality) params.set('nationality', filterNationality);
    params.set('sort', sort);
    params.set('order', order);
    if (effectiveSearch) params.set('q', effectiveSearch);
    if (mode === 'child') params.set('kids_only', '1');
    setCatalogueError(null);
    fetch(`/api/v1/books?${params.toString()}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { error?: string }).error || res.statusText);
        }
        return body as { data?: Book[]; meta?: ListMeta };
      })
      .then((body) => {
        const data = Array.isArray(body.data) ? body.data : [];
        const m = body.meta;
        setBooks(data);
        setMeta(
          m && typeof m.total === 'number'
            ? m
            : { total: data.length, page: 1, limit: 10, totalPages: 1 },
        );
      })
      .catch((e: Error) => {
        setBooks([]);
        setMeta({ total: 0, page: 1, limit: 10, totalPages: 0 });
        setCatalogueError(e.message || 'Could not load catalogue');
        toast.error('Catalogue could not be loaded. Try again.');
      });
  }, [page, limit, filterGenre, filterYear, filterNationality, sort, order, effectiveSearch, mode]);

  const fetchBooks = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (filterGenre) params.set('genre', filterGenre);
    if (filterYear) params.set('year', filterYear);
    if (filterNationality) params.set('nationality', filterNationality);
    params.set('sort', sort);
    params.set('order', order);
    if (effectiveSearch) params.set('q', effectiveSearch);
    if (mode === 'child') params.set('kids_only', '1');
    setCatalogueError(null);
    fetch(`/api/v1/books?${params.toString()}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error || res.statusText);
        return body as { data?: Book[]; meta?: ListMeta };
      })
      .then((body) => {
        const data = Array.isArray(body.data) ? body.data : [];
        const m = body.meta;
        setBooks(data);
        setMeta(m && typeof m.total === 'number' ? m : { total: data.length, page: 1, limit: 10, totalPages: 1 });
      })
      .catch((e: Error) => {
        setBooks([]);
        setMeta({ total: 0, page: 1, limit: 10, totalPages: 0 });
        setCatalogueError(e.message || 'Could not load catalogue');
        toast.error('Catalogue could not be loaded.');
      });
    fetch('/api/books')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllBooksForFilters(data);
      })
      .catch(() => {});
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (res.ok) {
        setIsAdding(false);
        setNewBook({
          title: '',
          author: '',
          isbn: '',
          total_copies: 1,
          genre: '',
          publication_year: '' as any,
          author_nationality: '',
          kids_friendly: 0,
          is_staff_pick: 0,
          staff_pick_note: '',
        });
        fetchBooks();
        toast.success('Book added');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not add book');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    try {
      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBook),
      });
      if (res.ok) {
        setEditingBook(null);
        fetchBooks();
        toast.success('Book updated');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not update');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchBooks();
        toast.success('Book removed');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Could not delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBorrow = async (bookId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, user_id: currentUser.id }),
      });
      if (res.ok) {
        fetchBooks();
        toast.success('Borrowed — enjoy your book');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Borrow failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReserve = async (bookId: number) => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book_id: bookId, user_id: currentUser.id }),
      });
      if (res.ok) {
        toast.success("You're on the waitlist");
      } else {
        const err = await res.json();
        toast.error(err.error || 'Reservation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const genres = useMemo(
    () => Array.from(new Set(allBooksForFilters.map((b) => b.genre).filter(Boolean))),
    [allBooksForFilters],
  );
  const years = useMemo(
    () =>
      Array.from(new Set(allBooksForFilters.map((b) => b.publication_year).filter(Boolean))).sort(
        (a, b) => (b as number) - (a as number),
      ),
    [allBooksForFilters],
  );
  const nationalities = useMemo(
    () => Array.from(new Set(allBooksForFilters.map((b) => b.author_nationality).filter(Boolean))),
    [allBooksForFilters],
  );

  const resetFilters = () => {
    setParam({ genre: null, year: null, nationality: null, page: '1' });
  };

  const startIdx = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const endIdx = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="min-h-full">
      {catalogueError && (
        <div className="mx-auto mb-4 max-w-7xl border border-red-300 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          {catalogueError}
        </div>
      )}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[color:var(--text-muted)]">
            <div>
              Showing{' '}
              <span className="font-medium text-[color:var(--text-primary)]">
                {startIdx}–{endIdx}
              </span>{' '}
              of <span className="font-medium text-[color:var(--text-primary)]">{meta.total}</span> books
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsFiltersOpen(true)}
                  className="flex items-center gap-1 font-medium text-[color:var(--text-primary)] hover:text-[color:var(--primary)] lg:hidden"
              >
                <Filter className="h-4 w-4" /> Filters
              </button>
              {currentUser?.role === 'librarian' && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 font-medium text-[color:var(--primary)] hover:underline"
                >
                  <Plus className="h-4 w-4" /> Add book
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-[color:var(--text-muted)]">Sort</span>
            <select
              className="border border-[color:var(--border)] bg-white px-2 py-1.5 text-[color:var(--text-primary)]"
              value={`${sort}-${order}`}
              onChange={(e) => {
                const [s, o] = e.target.value.split('-');
                setParam({ sort: s, order: o, page: '1' });
              }}
            >
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              <option value="author-asc">Author A–Z</option>
              <option value="author-desc">Author Z–A</option>
              <option value="year-desc">Year (newest)</option>
              <option value="year-asc">Year (oldest)</option>
            </select>
          </div>

          {isAdding && currentUser?.role === 'librarian' && (
            <div className="mb-6 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <h3 className="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">Add new book</h3>
              <form onSubmit={handleAddBook} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Title</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Author</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">ISBN</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={newBook.isbn}
                    onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Total copies</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className={inputClass}
                    value={newBook.total_copies}
                    onChange={(e) => setNewBook({ ...newBook, total_copies: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Genre</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={newBook.genre || ''}
                    onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Publication year</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={newBook.publication_year || ''}
                    onChange={(e) => setNewBook({ ...newBook, publication_year: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Author nationality</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={newBook.author_nationality || ''}
                    onChange={(e) => setNewBook({ ...newBook, author_nationality: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 lg:col-span-4">
                  <input
                    id="new-kids"
                    type="checkbox"
                    checked={!!newBook.kids_friendly}
                    onChange={(e) => setNewBook({ ...newBook, kids_friendly: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="new-kids" className="text-sm text-[color:var(--text-primary)]">
                    Kids-friendly
                  </label>
                </div>
                <div className="flex items-center gap-2 lg:col-span-4">
                  <input
                    id="new-staff"
                    type="checkbox"
                    checked={!!newBook.is_staff_pick}
                    onChange={(e) => setNewBook({ ...newBook, is_staff_pick: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="new-staff" className="text-sm text-[color:var(--text-primary)]">
                    Staff pick
                  </label>
                </div>
                <div className="lg:col-span-4">
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Staff pick note</label>
                  <input
                    type="text"
                    className={inputClass}
                    maxLength={200}
                    value={newBook.staff_pick_note || ''}
                    onChange={(e) => setNewBook({ ...newBook, staff_pick_note: e.target.value })}
                    placeholder="One sentence for the catalogue card"
                  />
                </div>
                <div className="mt-2 flex justify-end gap-2 lg:col-span-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90">
                    Save book
                  </button>
                </div>
              </form>
            </div>
          )}

          {editingBook && currentUser?.role === 'librarian' && (
            <div className="mb-6 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
              <h3 className="mb-4 text-lg font-semibold text-[color:var(--text-primary)]">Edit book</h3>
              <form onSubmit={handleUpdateBook} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Title</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={editingBook.title}
                    onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Author</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">ISBN</label>
                  <input
                    required
                    type="text"
                    className={inputClass}
                    value={editingBook.isbn}
                    onChange={(e) => setEditingBook({ ...editingBook, isbn: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Total copies</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className={inputClass}
                    value={editingBook.total_copies}
                    onChange={(e) => setEditingBook({ ...editingBook, total_copies: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Genre</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={editingBook.genre || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, genre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Publication year</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={editingBook.publication_year || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, publication_year: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Author nationality</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={editingBook.author_nationality || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, author_nationality: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2 lg:col-span-4">
                  <input
                    id="edit-kids"
                    type="checkbox"
                    checked={!!editingBook.kids_friendly}
                    onChange={(e) => setEditingBook({ ...editingBook, kids_friendly: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="edit-kids" className="text-sm text-[color:var(--text-primary)]">
                    Kids-friendly
                  </label>
                </div>
                <div className="flex items-center gap-2 lg:col-span-4">
                  <input
                    id="edit-staff"
                    type="checkbox"
                    checked={!!editingBook.is_staff_pick}
                    onChange={(e) => setEditingBook({ ...editingBook, is_staff_pick: e.target.checked ? 1 : 0 })}
                    className="h-4 w-4"
                  />
                  <label htmlFor="edit-staff" className="text-sm text-[color:var(--text-primary)]">
                    Staff pick
                  </label>
                </div>
                <div className="lg:col-span-4">
                  <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Staff pick note</label>
                  <input
                    type="text"
                    className={inputClass}
                    maxLength={200}
                    value={editingBook.staff_pick_note || ''}
                    onChange={(e) => setEditingBook({ ...editingBook, staff_pick_note: e.target.value })}
                  />
                </div>
                <div className="mt-2 flex justify-end gap-2 lg:col-span-4">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 font-medium text-white hover:opacity-90">
                    Update book
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-hidden border border-[color:var(--border)] bg-[color:var(--surface)]">
            {books.map((book, index) => (
              <div
                key={book.id}
                className="flex flex-col gap-4 border-b border-[color:var(--border)] p-4 transition-colors last:border-b-0 sm:flex-row sm:p-6 hover:bg-[color:var(--app-bg)]"
              >
                <div className="flex flex-1 gap-4">
                  <div className="h-fit shrink-0 border border-[color:var(--border)] bg-[color:var(--app-bg)] px-1.5 py-0.5 text-xs text-[color:var(--text-muted)]">
                    {(meta.page - 1) * meta.limit + index + 1}
                  </div>
                  <Link
                    to={`/books/${book.id}`}
                    className="flex min-w-0 flex-1 gap-4 outline-none ring-[color:var(--primary)] focus-visible:ring-2"
                  >
                    <BookCover
                      isbn={book.isbn}
                      title={book.title}
                      genre={book.genre}
                      compact
                      className="h-24 w-16 shrink-0 sm:h-28 sm:w-[4.5rem]"
                      size="M"
                    />
                    <div className="min-w-0 flex-1">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-muted)] sm:text-xs">Book</div>
                    <h3 className="mb-1 truncate text-base font-semibold text-[color:var(--text-primary)] sm:text-lg">{book.title}</h3>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {book.genre && (
                        <span className="border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-primary)]">
                          {book.genre}
                        </span>
                      )}
                      {book.kids_friendly === 1 && (
                        <span className="border border-[color:var(--border)] bg-[color:var(--app-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--text-primary)]">
                          Kids
                        </span>
                      )}
                    </div>
                    <div className="mb-2 text-xs text-[color:var(--text-muted)] sm:text-sm">
                      <span className="block truncate">{book.author}</span>
                      <span className="mt-0.5 block truncate">ISBN {book.isbn}</span>
                      {(book.publication_year || book.author_nationality) && (
                        <span className="mt-0.5 block truncate">
                          {book.publication_year ? `${book.publication_year}` : ''}
                          {book.author_nationality ? ` · ${book.author_nationality}` : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      {book.available_copies > 0 ? (
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <span className="h-2 w-2 bg-emerald-600" />
                          Available ({book.available_copies} of {book.total_copies})
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-amber-800">
                          <span className="h-2 w-2 bg-amber-600" />
                          Out of stock ({book.total_copies} total)
                        </span>
                      )}
                    </div>
                    </div>
                  </Link>
                </div>
                <div className="mt-4 flex shrink-0 items-end justify-between gap-4 border-t border-[color:var(--border)] pt-4 sm:mt-0 sm:flex-col sm:border-t-0 sm:pt-0">
                    <div className="flex gap-3 text-[color:var(--text-muted)]">
                    {currentUser?.role === 'librarian' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingBook(book)}
                          className="p-1 transition hover:bg-[color:var(--app-bg)] hover:text-[color:var(--primary)]"
                          title="Edit book"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBook(book.id)}
                          className="p-1 transition hover:bg-[color:var(--app-bg)] hover:text-red-600"
                          title="Delete book"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <Link
                        to={`/books/${book.id}`}
                        className="text-sm font-semibold text-[color:var(--primary)] hover:underline"
                      >
                        Details
                      </Link>
                    )}
                  </div>
                  {currentUser?.role === 'student' && (
                    <button
                      type="button"
                      onClick={() => (book.available_copies > 0 ? handleBorrow(book.id) : handleReserve(book.id))}
                      className={`w-full border border-[color:var(--border)] px-4 py-2 text-sm font-medium transition sm:w-auto ${
                        book.available_copies > 0
                          ? 'bg-[color:var(--primary)] text-white hover:opacity-90'
                          : 'bg-amber-500 text-white hover:opacity-90'
                      }`}
                    >
                      {book.available_copies > 0 ? 'Borrow' : 'Reserve'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {books.length === 0 && (
              <div className="py-12 text-center text-[color:var(--text-muted)]">No books match your filters.</div>
            )}
          </div>

          {meta.totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 text-sm">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setParam({ page: String(meta.page - 1) })}
                className="px-2 font-medium text-[color:var(--primary)] disabled:opacity-40"
              >
                ← Previous
              </button>
              {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (meta.totalPages <= 7) return true;
                  if (p === 1 || p === meta.totalPages) return true;
                  if (Math.abs(p - meta.page) <= 1) return true;
                  return false;
                })
                .map((p, i, arr) => {
                  const prev = arr[i - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-[color:var(--text-muted)]">…</span>}
                      <button
                        type="button"
                        onClick={() => setParam({ page: String(p) })}
                        className={`min-w-[2rem] px-2 py-1 ${
                          p === meta.page
                            ? 'bg-[color:var(--primary)] font-bold text-white'
                            : 'text-[color:var(--text-primary)] hover:bg-[color:var(--app-bg)]'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}
              <button
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setParam({ page: String(meta.page + 1) })}
                className="px-2 font-medium text-[color:var(--primary)] disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {isFiltersOpen && (
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            aria-label="Close filters"
            onClick={() => setIsFiltersOpen(false)}
          />
        )}

        <div
          className={`fixed inset-y-0 right-0 z-[60] flex w-80 transform flex-col border-l border-[color:var(--border)] bg-[color:var(--surface)] transition-transform duration-300 lg:static lg:z-0 lg:w-64 lg:translate-x-0 lg:border lg:bg-transparent lg:shadow-none ${isFiltersOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}
        >
          <div className="flex h-full flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--border)] p-4 sm:p-6 lg:hidden">
              <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">Filters</h2>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="p-2 text-[color:var(--text-muted)] hover:bg-[color:var(--app-bg)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col space-y-8 overflow-y-auto p-4 sm:p-6 lg:p-0">
              <div>
                <h3 className="mb-4 hidden text-lg font-medium text-[color:var(--text-primary)] lg:block">Refine</h3>
                <div className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-[color:var(--primary)] hover:underline">
                  <Unlock className="h-4 w-4" /> Remember filters
                </div>
                <button
                  type="button"
                  className="flex cursor-pointer items-center gap-2 text-sm text-[color:var(--primary)] hover:underline"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-4 w-4" /> Reset filters
                </button>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-[color:var(--text-muted)]">Refine your search</h3>
                <div className="space-y-4">
                  <div className="border-b border-[color:var(--border)] pb-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-[color:var(--text-primary)]">Genre</span>
                      <select
                        className="w-full border border-[color:var(--border)] bg-white p-2 text-sm text-[color:var(--text-primary)] outline-none"
                        value={filterGenre}
                        onChange={(e) => setParam({ genre: e.target.value || null, page: '1' })}
                      >
                        <option value="">All genres</option>
                        {genres.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="border-b border-[color:var(--border)] pb-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-[color:var(--text-primary)]">Publication year</span>
                      <select
                        className="w-full border border-[color:var(--border)] bg-white p-2 text-sm text-[color:var(--text-primary)] outline-none"
                        value={filterYear}
                        onChange={(e) => setParam({ year: e.target.value || null, page: '1' })}
                      >
                        <option value="">All years</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="border-b border-[color:var(--border)] pb-4">
                    <div className="flex flex-col gap-2">
                      <span className="font-medium text-[color:var(--text-primary)]">Author nationality</span>
                      <select
                        className="w-full border border-[color:var(--border)] bg-white p-2 text-sm text-[color:var(--text-primary)] outline-none"
                        value={filterNationality}
                        onChange={(e) => setParam({ nationality: e.target.value || null, page: '1' })}
                      >
                        <option value="">All nationalities</option>
                        {nationalities.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
