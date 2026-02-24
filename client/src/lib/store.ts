import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import travelCover from '@assets/generated_images/travel_album_cover_art.png';
import weddingCover from '@assets/generated_images/wedding_album_cover_art.png';

export interface Album {
  id: string;
  title: string;
  date: string;
  frontCover: string; // IDB key or URL
  backCover: string;  // IDB key or URL
  theme: 'classic' | 'travel' | 'fun' | 'royal';
  sheets: string[];   // IDB keys or URLs
}

interface AlbumStore {
  albums: Album[];
  addAlbum: (album: Album) => void;
  getAlbum: (id: string) => Album | undefined;
  removeAlbum: (id: string) => Promise<void>;
}

// Image Storage Helper (Direct Blob Storage in IndexedDB)
export const ImageStorage = {
  save: async (id: string, file: File | Blob) => {
    await set(`img_${id}`, file);
  },
  load: async (id: string): Promise<string | null> => {
    const blob = await get(`img_${id}`);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  },
  delete: async (id: string) => {
    await del(`img_${id}`);
  },
  deleteAlbumImages: async (album: Album) => {
    // Only delete IDB-stored images (not mock http/src URLs)
    const isIdbKey = (s: string) =>
      !s.startsWith('http') && !s.startsWith('/') && !s.startsWith('data:');

    if (isIdbKey(album.frontCover)) await del(`img_${album.frontCover}`);
    if (isIdbKey(album.backCover)) await del(`img_${album.backCover}`);
    for (const sheet of album.sheets) {
      if (isIdbKey(sheet)) await del(`img_${sheet}`);
    }
  },
};

// Helper to generate mock sheets (panoramic)
const generateMockSheets = (count: number, seed: string) => {
  return Array.from({ length: count }).map((_, i) =>
    `https://picsum.photos/seed/${seed}-${i}/1200/400`
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
          backCover: weddingCover,
          theme: 'royal',
          sheets: generateMockSheets(5, 'wedding'),
        },
      ],
      addAlbum: (album) => set((state) => ({ albums: [album, ...state.albums] })),
      getAlbum: (id) => get().albums.find((a) => a.id === id),
      removeAlbum: async (id) => {
        const album = get().albums.find((a) => a.id === id);
        if (album) {
          // Clean up IndexedDB blobs before removing metadata
          await ImageStorage.deleteAlbumImages(album);
        }
        set((state) => ({ albums: state.albums.filter((a) => a.id !== id) }));
      },
    }),
    {
      name: 'album-metadata-v3',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
