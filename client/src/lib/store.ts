import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';
import birthdayCover from '@assets/generated_images/birthday_album_cover_art.png';

// Mock data types
export interface Album {
  id: string;
  title: string;
  date: string;
  cover: string;
  theme: 'classic' | 'travel' | 'fun';
  pages: string[]; // URLs to images
}

interface AlbumStore {
  albums: Album[];
  addAlbum: (album: Album) => void;
  getAlbum: (id: string) => Album | undefined;
}

// Generate some mock pages (using placeholders for now if we don't have enough real images)
const generatePages = (count: number, seed: string) => {
  return Array.from({ length: count }).map((_, i) => 
    `https://picsum.photos/seed/${seed}-${i}/800/1000`
  );
};

export const useAlbumStore = create<AlbumStore>()(
  persist(
    (set, get) => ({
      albums: [
        {
          id: '1',
          title: 'Summer in Italy',
          date: '2024-07-15',
          cover: travelCover,
          theme: 'travel',
          pages: generatePages(8, 'italy'),
        },
        {
          id: '2',
          title: 'Sarah & James Wedding',
          date: '2023-09-20',
          cover: weddingCover,
          theme: 'classic',
          pages: generatePages(12, 'wedding'),
        },
        {
          id: '3',
          title: 'Leo\'s 5th Birthday',
          date: '2024-11-10',
          cover: birthdayCover,
          theme: 'fun',
          pages: generatePages(6, 'birthday'),
        },
      ],
      addAlbum: (album) => set((state) => ({ albums: [...state.albums, album] })),
      getAlbum: (id) => get().albums.find((a) => a.id === id),
    }),
    {
      name: 'album-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
