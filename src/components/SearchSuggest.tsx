import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import BookCover from './BookCover';

type SuggestBook = { id: number; title: string; author: string; isbn: string; genre?: string };

export default function SearchSuggest({
  query,
  onQueryChange,
  inputClassName,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  inputClassName: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestBook[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/v1/search/suggest?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((rows: SuggestBook[]) => setSuggestions(Array.isArray(rows) ? rows : []))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const showDropdown = open && query.trim().length > 0 && suggestions.length > 0;

  return (
    <div ref={wrapRef} className="relative min-w-0 flex-1">
      <input
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search by title, author, ISBN, genre…"
        className={inputClassName}
        aria-label="Search catalogue"
        aria-expanded={showDropdown}
        aria-controls="search-suggest-list"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && query.trim().length > 0) {
            e.preventDefault();
            navigate({
              pathname: '/books',
              search: `?q=${encodeURIComponent(query.trim())}`,
            });
            setOpen(false);
          }
        }}
      />
      {query.trim().length > 0 && (
        <button
          type="button"
          onClick={() => {
            onQueryChange('');
            setSuggestions([]);
            setOpen(false);
            if (location.pathname === '/books') {
              const next = new URLSearchParams(location.search);
              next.delete('q');
              const s = next.toString();
              navigate({ pathname: '/books', search: s ? `?${s}` : '' }, { replace: true });
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          aria-label="Clear search"
        >
          <span className="sr-only">Clear</span>
          <X className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      )}
      {showDropdown && (
        <ul
          id="search-suggest-list"
          role="listbox"
          className="absolute left-0 right-0 top-full z-[280] mt-1 max-h-80 overflow-auto border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg"
        >
          {suggestions.map((b) => (
            <li key={b.id} role="option">
              <Link
                to={`/books/${b.id}`}
                className="flex gap-3 border-b border-[color:var(--border)] p-2 last:border-b-0 hover:bg-[color:var(--app-bg)]"
                onClick={() => setOpen(false)}
              >
                <BookCover isbn={b.isbn} title={b.title} genre={b.genre} className="h-12 w-8 shrink-0" size="S" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{b.title}</div>
                  <div className="truncate text-xs text-[color:var(--text-muted)]">{b.author}</div>
                  {b.genre && (
                    <div className="mt-0.5 text-[10px] uppercase text-[color:var(--text-muted)]">{b.genre}</div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
