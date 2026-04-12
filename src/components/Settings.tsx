import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Type, Palette, Rows, Zap, User as UserIcon, Camera } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserT } from '../App';
import { useUIStore, type UIMode, type LineSpacing } from '../stores/uiStore';
import { useProfileStore } from '../stores/profileStore';

const MODES: { value: UIMode; label: string; description: string }[] = [
  { value: 'standard', label: 'Standard', description: 'Default layout and colours.' },
  {
    value: 'child',
    label: 'Kids',
    description: 'Shows only kids-friendly books in lists; slightly larger type and clearer controls.',
  },
  { value: 'elderly', label: 'Large text', description: 'Extra-large type for reading comfort (use slider to tune).' },
  { value: 'high_contrast', label: 'Contrast', description: 'High contrast colours and strong outlines for visibility.' },
];

export default function Settings({
  currentUser,
  onUserUpdated,
}: {
  currentUser: UserT | null;
  onUserUpdated?: (u: UserT) => void;
}) {
  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const baseFontSize = useUIStore((s) => s.baseFontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);
  const lineSpacing = useUIStore((s) => s.lineSpacing);
  const setLineSpacing = useUIStore((s) => s.setLineSpacing);
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const setReduceMotion = useUIStore((s) => s.setReduceMotion);

  const setLocalAvatar = useProfileStore((s) => s.setAvatar);
  const localAvatar = useProfileStore((s) => (currentUser ? s.avatarByUserId[currentUser.id] : undefined));
  const fileRef = useRef<HTMLInputElement>(null);

  const [nameEdit, setNameEdit] = useState(currentUser?.name ?? '');
  const [emailEdit, setEmailEdit] = useState(currentUser?.email ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setNameEdit(currentUser.name);
      setEmailEdit(currentUser.email);
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !onUserUpdated) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: nameEdit.trim(),
        email: emailEdit.trim(),
        requester_id: currentUser.id,
      };
      if (localAvatar && localAvatar.startsWith('data:')) {
        body.avatar_url = localAvatar;
      }
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      const updated = (await res.json()) as UserT;
      onUserUpdated(updated);
      toast.success('Profile saved');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 400_000) {
      toast.error('Image too large — use under 400KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const data = String(reader.result || '');
      if (data.length > 500_000) {
        toast.error('Image too large');
        return;
      }
      setLocalAvatar(currentUser.id, data);
      toast.success('Photo updated — save profile to sync to your account');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={currentUser ? '/profile' : '/'}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {currentUser ? 'Back to profile' : 'Home'}
      </Link>

      <h1 className="border-b border-[color:var(--border)] pb-4 text-2xl font-bold text-[color:var(--text-primary)]">Settings</h1>
      <p className="mt-2 text-sm text-[color:var(--text-muted)]">Display, accessibility, and profile.</p>

      {currentUser && (
        <section className="mt-8 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
          <div className="mb-4 flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
            <UserIcon className="h-5 w-5" aria-hidden />
            Profile
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-[color:var(--border)] bg-[color:var(--app-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--primary)]"
                aria-label="Change profile photo"
              >
                {localAvatar || currentUser.avatar_url ? (
                  <img src={localAvatar || currentUser.avatar_url || ''} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-[color:var(--primary)]">{currentUser.name.charAt(0)}</span>
                )}
                <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center border border-[color:var(--border)] bg-[color:var(--surface)]">
                  <Camera className="h-4 w-4" />
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              <p className="max-w-xs text-xs text-[color:var(--text-muted)]">
                Square photos work best. Saved locally until you click Save profile (then stored on your account).
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Display name</label>
              <input
                required
                value={nameEdit}
                onChange={(e) => setNameEdit(e.target.value)}
                className="w-full border border-[color:var(--border)] bg-white px-3 py-2 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[color:var(--text-muted)]">Email</label>
              <input
                type="email"
                required
                value={emailEdit}
                onChange={(e) => setEmailEdit(e.target.value)}
                className="w-full border border-[color:var(--border)] bg-white px-3 py-2 text-[color:var(--text-primary)] outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="border border-[color:var(--border)] bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>
      )}

      <section className="mt-8 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
          <Palette className="h-5 w-5" aria-hidden />
          Display mode
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`border p-4 text-left transition ${
                mode === m.value
                  ? 'border-[color:var(--primary)] bg-[color:var(--accent-soft)]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--app-bg)]'
              }`}
            >
              <div className="font-medium text-[color:var(--text-primary)]">{m.label}</div>
              <div className="mt-1 text-xs text-[color:var(--text-muted)]">{m.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
          <Type className="h-5 w-5" aria-hidden />
          Text size
        </div>
        <label htmlFor="settings-font" className="text-sm text-[color:var(--text-muted)]">
          Base size: {baseFontSize}px
        </label>
        <input
          id="settings-font"
          type="range"
          min={12}
          max={24}
          step={2}
          value={baseFontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="mt-3 w-full accent-[color:var(--primary)]"
        />
      </section>

      <section className="mt-6 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
          <Rows className="h-5 w-5" aria-hidden />
          Line spacing
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              { value: 'normal' as LineSpacing, label: 'Normal' },
              { value: 'relaxed' as LineSpacing, label: 'Relaxed' },
            ] as const
          ).map((row) => (
            <button
              key={row.value}
              type="button"
              onClick={() => setLineSpacing(row.value)}
              className={`border p-4 text-left transition ${
                lineSpacing === row.value
                  ? 'border-[color:var(--primary)] bg-[color:var(--accent-soft)]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface)] hover:bg-[color:var(--app-bg)]'
              }`}
            >
              <div className="font-medium text-[color:var(--text-primary)]">{row.label}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 border border-[color:var(--border)] bg-[color:var(--surface)] p-6">
        <div className="mb-4 flex items-center gap-2 font-semibold text-[color:var(--text-primary)]">
          <Zap className="h-5 w-5" aria-hidden />
          Motion
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-[color:var(--text-primary)]">
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setReduceMotion(e.target.checked)}
            className="h-4 w-4"
          />
          Reduce motion (stops automatic carousel rotation on the home page)
        </label>
      </section>

      {currentUser ? (
        <p className="mt-6 text-xs text-[color:var(--text-muted)]">
          Signed in as {currentUser.name} ({currentUser.email})
        </p>
      ) : (
        <p className="mt-6 text-xs text-[color:var(--text-muted)]">
          Not signed in.{' '}
          <Link to="/login" className="font-medium text-[color:var(--primary)] hover:underline">
            Sign in
          </Link>{' '}
          to borrow books and use your profile.
        </p>
      )}
    </div>
  );
}
