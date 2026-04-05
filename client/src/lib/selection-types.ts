export interface Photo {
  id: string;
  url: string;
  filename: string;
  width?: number;
  height?: number;
  selected: number | null; // null = unreviewed, 0 = rejected, 1 = selected
  rating: number; // 0-5 stars
  comment: string;
}

export interface Gallery {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  photographerName: string;
  photos: Photo[];
  createdAt: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  coverIndex: number;
  minSelections?: number;
  maxSelections?: number;
  message: string;
  password?: string;
  watermarkText?: string;
}

export type SelectionFilter = 'all' | 'selected' | 'rejected' | 'unreviewed';
