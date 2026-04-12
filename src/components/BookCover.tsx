import { useState } from 'react';
import { FileText } from 'lucide-react';
import { coverGradient, initials, openLibraryCoverUrl, preferPlaceholderCover } from '../lib/bookCover';
import { cn } from '../lib/utils';

function shortTitle(t: string, max: number): string {
  const s = t.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

type Props = {
  isbn: string | undefined;
  title: string;
  className?: string;
  size?: 'S' | 'M' | 'L';
  priority?: boolean;
  genre?: string;
  fit?: 'contain' | 'cover';
  hero?: boolean;
  compact?: boolean;
};

export default function BookCover({
  isbn,
  title,
  className,
  size = 'M',
  priority,
  genre,
  fit = 'contain',
  hero,
  compact,
}: Props) {
  const skipRemote = preferPlaceholderCover(title, genre);
  const url = skipRemote ? null : openLibraryCoverUrl(isbn, size);
  const [failed, setFailed] = useState(!url);

  if (!url || failed) {
    if (skipRemote) {
      const label = genre || 'Scholarly work';
      return (
        <div
          className={cn(
            hero ? 'flex min-h-[18rem] w-full' : 'aspect-[2/3] min-h-[6rem]',
            'relative flex flex-col overflow-hidden border border-[color:var(--border)] text-white shadow-inner',
            compact ? 'p-1.5' : 'p-2.5',
            className,
          )}
          style={{
            background: coverGradient(title),
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.25)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h20v20H0z' fill='none'/%3E%3Cpath d='M0 20L20 0M-5 5L5-5M15 25L25 15' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative z-[1] flex items-start justify-between gap-1">
            <span className="inline-flex max-w-[85%] items-center gap-0.5 rounded-sm bg-black/25 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/95 ring-1 ring-white/20 sm:text-[9px]">
              <FileText className="h-2.5 w-2.5 shrink-0 opacity-90 sm:h-3 sm:w-3" aria-hidden />
              <span className="truncate">{label}</span>
            </span>
          </div>
          <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-1">
            <p
              className={cn(
                'text-center font-semibold leading-snug text-white drop-shadow-md',
                compact ? 'text-[8px] line-clamp-3 sm:text-[9px]' : 'text-[10px] line-clamp-4 sm:text-xs sm:line-clamp-5',
              )}
            >
              {shortTitle(title, compact ? 42 : 120)}
            </p>
          </div>
          <div className="relative z-[1] mt-auto border-t border-white/15 pt-1 text-center text-[7px] font-medium uppercase tracking-widest text-white/70 sm:text-[8px]">
            EduLib
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          hero ? 'flex min-h-[18rem] w-full' : 'aspect-[2/3] min-h-[6rem]',
          'flex flex-col items-center justify-center overflow-hidden border border-[color:var(--border)] font-bold text-white/95 shadow-inner',
          className,
        )}
        style={{ background: coverGradient(title), boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)' }}
      >
        <span className="select-none px-2 text-center text-sm sm:text-base">{initials(title)}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden border border-[color:var(--border)] bg-[color:var(--app-bg)]',
        hero ? 'min-h-[18rem] w-full' : 'aspect-[2/3]',
        className,
      )}
    >
      <div aria-hidden className="absolute inset-0 z-0" style={{ background: coverGradient(title) }} />
      <img
        src={url}
        alt=""
        className={cn(
          'absolute inset-0 z-10 h-full w-full object-center',
          fit === 'cover' ? 'object-cover' : 'object-contain',
        )}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        onError={() => setFailed(true)}
        onLoad={(e) => {
          const { naturalWidth, naturalHeight } = e.currentTarget;
          if (naturalWidth < 12 || naturalHeight < 12) setFailed(true);
        }}
      />
    </div>
  );
}
