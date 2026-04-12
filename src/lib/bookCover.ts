export function preferPlaceholderCover(title: string, genre?: string): boolean {
  const g = (genre || '').toLowerCase();
  const t = title.toLowerCase();
  if (
    g.includes('thesis') ||
    g.includes('dissertation') ||
    g.includes('survey') ||
    g.includes('academic') ||
    g.includes('proceedings') ||
    g.includes('journal') ||
    t.includes('dissertation') ||
    t.includes('thesis') ||
    t.includes('survey paper') ||
    t.includes('proceedings')
  ) {
    return true;
  }
  return false;
}

export function coverGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  const h2 = (h + 40) % 360;
  return `linear-gradient(145deg, hsl(${h} 55% 42%) 0%, hsl(${h2} 45% 28%) 100%)`;
}

export function initials(title: string): string {
  const parts = title.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return title.slice(0, 2).toUpperCase() || '?';
}

export function openLibraryCoverUrl(isbn: string | undefined, size: 'S' | 'M' | 'L' = 'M'): string | null {
  if (!isbn?.trim()) return null;
  const clean = isbn.replace(/[-\s]/g, '');
  const ok10 = /^(\d{9}[\dX])$/i.test(clean);
  const ok13 = /^\d{13}$/.test(clean);
  if (!ok10 && !ok13) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg?default=false`;
}
