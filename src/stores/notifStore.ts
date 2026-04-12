import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type InAppNotification = {
  id: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type NotifState = {
  items: InAppNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  add: (body: string) => void;
};

export const useNotifStore = create<NotifState>()(
  persist(
    (set) => ({
      items: [
        {
          id: 'seed-1',
          body: 'Welcome to EduLib Pro — browse the catalogue or check your borrowings.',
          createdAt: new Date().toISOString(),
          read: false,
        },
        {
          id: 'seed-2',
          body: 'Tip: use category pills above the catalogue to narrow results.',
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, read: true } : i)),
        })),
      markAllRead: () =>
        set((s) => ({
          items: s.items.map((i) => ({ ...i, read: true })),
        })),
      add: (body) =>
        set((s) => ({
          items: [
            {
              id: `n-${Date.now()}`,
              body,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.items,
          ],
        })),
    }),
    { name: 'edulib-notifs' },
  ),
);
