import { Gallery } from './types';
import { v4 as uuidv4 } from 'uuid';

// High-quality Unsplash photos for demo
const DEMO_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80', filename: 'wedding_ceremony_01.jpg' },
  { url: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80', filename: 'couple_portrait_02.jpg' },
  { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80', filename: 'ring_exchange_03.jpg' },
  { url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80', filename: 'venue_decor_04.jpg' },
  { url: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80', filename: 'first_dance_05.jpg' },
  { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', filename: 'bouquet_toss_06.jpg' },
  { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80', filename: 'bride_prep_07.jpg' },
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80', filename: 'groom_portrait_08.jpg' },
  { url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=800&q=80', filename: 'couple_sunset_09.jpg' },
  { url: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=800&q=80', filename: 'table_setting_10.jpg' },
  { url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', filename: 'flower_arrangement_11.jpg' },
  { url: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=800&q=80', filename: 'wedding_cake_12.jpg' },
];

export function createDemoGallery(): Gallery {
  const gallery: Gallery = {
    id: 'demo-' + uuidv4().slice(0, 8),
    name: 'Sharma Wedding — December 2025',
    clientName: 'Priya & Arjun Sharma',
    clientEmail: 'sharma.couple@email.com',
    photographerName: 'Elite Labs Photography',
    photos: DEMO_PHOTOS.map(p => ({
      id: uuidv4(),
      url: p.url,
      filename: p.filename,
      selected: null,
      rating: 0,
      comment: '',
    })),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    coverIndex: 0,
    minSelections: 5,
    maxSelections: 8,
    message: 'Hi Priya & Arjun! 💍 Here are the highlights from your beautiful wedding. Please select your favorite 5-8 photos for the final album. Thank you for trusting us with your special day!',
  };
  return gallery;
}
