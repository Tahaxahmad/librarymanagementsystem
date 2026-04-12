import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIMode = 'standard' | 'child' | 'elderly' | 'high_contrast';
export type LineSpacing = 'normal' | 'relaxed';

type UIState = {
  mode: UIMode;
  baseFontSize: number;
  lineSpacing: LineSpacing;
  reduceMotion: boolean;
  setMode: (mode: UIMode) => void;
  setFontSize: (size: number) => void;
  setLineSpacing: (s: LineSpacing) => void;
  setReduceMotion: (v: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      mode: 'standard',
      baseFontSize: 16,
      lineSpacing: 'normal',
      reduceMotion: false,
      setMode: (mode) => set({ mode }),
      setFontSize: (baseFontSize) => set({ baseFontSize }),
      setLineSpacing: (lineSpacing) => set({ lineSpacing }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    { name: 'edulib-ui' },
  ),
);
