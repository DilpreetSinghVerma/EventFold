import { Gallery, Photo } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'eventfold_selection_galleries';

export function getGalleries(): Gallery[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getGallery(id: string): Gallery | null {
  const galleries = getGalleries();
  return galleries.find(g => g.id === id) || null;
}

export function saveGallery(gallery: Gallery): void {
  const galleries = getGalleries();
  const index = galleries.findIndex(g => g.id === gallery.id);
  if (index >= 0) {
    galleries[index] = gallery;
  } else {
    galleries.push(gallery);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(galleries));
}

export function deleteGallery(id: string): void {
  const galleries = getGalleries().filter(g => g.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(galleries));
}

export function createGallery(data: {
  name: string;
  clientName: string;
  clientEmail: string;
  photographerName: string;
  photos: { url: string; filename: string }[];
  deadline: string;
  password?: string;
  watermarkText?: string;
  minSelections?: number;
  maxSelections?: number;
  message: string;
}): Gallery {
  const gallery: Gallery = {
    id: uuidv4(),
    name: data.name,
    clientName: data.clientName,
    clientEmail: data.clientEmail,
    photographerName: data.photographerName,
    photos: data.photos.map(p => ({
      id: uuidv4(),
      url: p.url,
      filename: p.filename,
      selected: null,
      rating: 0,
      comment: '',
    })),
    createdAt: new Date().toISOString(),
    deadline: data.deadline,
    password: data.password,
    watermarkText: data.watermarkText,
    status: 'pending',
    coverIndex: 0,
    minSelections: data.minSelections,
    maxSelections: data.maxSelections,
    message: data.message,
  };
  saveGallery(gallery);
  return gallery;
}

export function updatePhotoSelection(
  galleryId: string,
  photoId: string,
  updates: Partial<Pick<Photo, 'selected' | 'rating' | 'comment'>>
): Gallery | null {
  const gallery = getGallery(galleryId);
  if (!gallery) return null;

  const photo = gallery.photos.find(p => p.id === photoId);
  if (!photo) return null;

  Object.assign(photo, updates);

  // Update status
  const reviewed = gallery.photos.filter(p => p.selected !== null).length;
  if (reviewed === 0) {
    gallery.status = 'pending';
  } else if (reviewed < gallery.photos.length) {
    gallery.status = 'in-progress';
  } else {
    gallery.status = 'completed';
  }

  saveGallery(gallery);
  return gallery;
}

export function submitSelections(galleryId: string): Gallery | null {
  const gallery = getGallery(galleryId);
  if (!gallery) return null;
  gallery.status = 'completed';
  saveGallery(gallery);
  return gallery;
}

export function getSelectionStats(gallery: Gallery) {
  const total = gallery.photos.length;
  const selected = gallery.photos.filter(p => p.selected === true).length;
  const rejected = gallery.photos.filter(p => p.selected === false).length;
  const unreviewed = gallery.photos.filter(p => p.selected === null).length;
  return { total, selected, rejected, unreviewed };
}
