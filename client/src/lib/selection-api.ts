import { apiRequest } from './queryClient';
import { Gallery, Photo } from './selection-types';

export async function fetchGalleries(): Promise<Gallery[]> {
  const res = await apiRequest('GET', '/api/selection/galleries');
  return res.json();
}

export async function fetchGallery(id: string): Promise<Gallery & { photos: Photo[] }> {
  const res = await apiRequest('GET', `/api/selection/galleries/${id}`);
  return res.json();
}

export async function createGallery(data: Partial<Gallery> & { photos: { url: string; filename: string }[] }): Promise<Gallery> {
  const res = await apiRequest('POST', '/api/selection/galleries', data);
  return res.json();
}

export async function updateGallery(id: string, data: Partial<Gallery>): Promise<Gallery> {
  const res = await apiRequest('PATCH', `/api/selection/galleries/${id}`, data);
  return res.json();
}

export async function deleteGallery(id: string): Promise<void> {
  await apiRequest('DELETE', `/api/selection/galleries/${id}`);
}

export async function updatePhoto(id: string, data: Partial<Photo>): Promise<Photo> {
  const res = await apiRequest('PATCH', `/api/selection/photos/${id}`, data);
  return res.json();
}

export function calculateSelectionStats(photos: Photo[]) {
  const total = photos?.length || 0;
  const selected = photos?.filter(p => p.selected === 1).length || 0;
  const rejected = photos?.filter(p => p.selected === 0).length || 0;
  const unreviewed = photos?.filter(p => p.selected === null).length || 0;
  return { total, selected, rejected, unreviewed };
}

/**
 * Transforms a Cloudinary URL to a low-bandwidth "Normal" quality version for the client.
 */
export function getOptimizedUrl(url: string, width: number = 1000): string {
  if (!url.includes('cloudinary.com')) return url;
  // Insert transformation parameters: q_auto (auto quality), f_auto (auto format), w_X (width)
  return url.replace('/upload/', `/upload/q_auto:eco,f_auto,w_${width}/`);
}

/**
 * Ensures the URL is the original high-quality version without transformations.
 */
export function getOriginalUrl(url: string): string {
  if (!url.includes('cloudinary.com')) return url;
  // Common pattern to remove injected transformations
  return url.replace(/\/upload\/[^/]+\//, '/upload/');
}
