import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ProfileState = {
  avatarByUserId: Record<number, string>;
  displayNameByUserId: Record<number, string>;
  setAvatar: (userId: number, dataUrl: string | null) => void;
  setDisplayName: (userId: number, name: string | null) => void;
  clearUser: (userId: number) => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      avatarByUserId: {},
      displayNameByUserId: {},
      setAvatar: (userId, dataUrl) =>
        set((s) => {
          const next = { ...s.avatarByUserId };
          if (dataUrl) next[userId] = dataUrl;
          else delete next[userId];
          return { avatarByUserId: next };
        }),
      setDisplayName: (userId, name) =>
        set((s) => {
          const next = { ...s.displayNameByUserId };
          if (name && name.trim()) next[userId] = name.trim();
          else delete next[userId];
          return { displayNameByUserId: next };
        }),
      clearUser: (userId) =>
        set((s) => {
          const av = { ...s.avatarByUserId };
          const dn = { ...s.displayNameByUserId };
          delete av[userId];
          delete dn[userId];
          return { avatarByUserId: av, displayNameByUserId: dn };
        }),
    }),
    { name: 'edulib-profile' },
  ),
);
