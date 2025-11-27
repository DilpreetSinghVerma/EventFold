import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';
import birthdayCover from '@assets/generated_images/birthday_album_cover_art.png';

export interface Album {
  id: string;
  title: string;
  date: string;
  frontCover: string;
  backCover: string;
  theme: 'classic' | 'travel' | 'fun' | 'royal';
  // We store "sheets" which are the 12x36 panoramic images
  sheets: string[]; 
}

interface AlbumStore {
  albums: Album[];
  addAlbum: (album: Album) => void;
  getAlbum: (id: string) => Album | undefined;
  removeAlbum: (id: string) => void;
}

// Helper to generate mock sheets (panoramic)
const generateMockSheets = (count: number, seed: string) => {
  return Array.from({ length: count }).map((_, i) => 
    `https://picsum.photos/seed/${seed}-${i}/1200/400` // 3:1 aspect ratio roughly
  );
};

export const useAlbumStore = create<AlbumStore>()(
  persist(
    (set, get) => ({
      albums: [
        {
          id: 'mock-1',
          title: 'Priya & Rahul',
          date: '2024-12-10',
          frontCover: weddingCover,
          backCover: weddingCover, // using same for mock
          theme: 'royal',
          sheets: generateMockSheets(5, 'wedding'),
        },
      ],
      addAlbum: (album) => set((state) => ({ albums: [album, ...state.albums] })),
      getAlbum: (id) => get().albums.find((a) => a.id === id),
      removeAlbum: (id) => set((state) => ({ albums: state.albums.filter(a => a.id !== id) })),
    }),
    {
      name: 'album-storage-v2',
      storage: createJSONStorage(() => localStorage),
      // Note: Storing large base64 strings in localStorage will hit limits (5MB).
      // For a real app, we'd use IndexedDB or a backend.
      // For this prototype, we'll just warn if it fails or rely on session URLs for new uploads.
    }
  )
);
