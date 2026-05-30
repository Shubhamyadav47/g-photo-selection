export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  credits: number;
  createdAt: any;
  updatedAt: any;
}

export interface GalleryItem {
  id: string;
  title: string;
  imagesCount: number;
  whatsappNumber: string;
  hasPassword: boolean;
  createdAt: any;
}

export interface TransactionItem {
  id: string;
  amount: number;
  creditsAdded: number;
  status: 'pending' | 'completed' | 'failed';
  paymentMethod: string;
  createdAt: any;
}

export interface CreditPackage {
  id: string;
  title: string;
  credits: number;
  price: number; // in INR (₹)
  description: string;
  tag?: string;
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack-single',
    title: 'Single Shoot',
    credits: 1,
    price: 25,
    description: 'Perfect to try out or for single project requirements (₹25/gallery).',
  },
  {
    id: 'pack-starter',
    title: 'Starter Pack',
    credits: 5,
    price: 120,
    description: 'Great for wedding season testing. Save ₹5 on full portfolio needs.',
    tag: 'Save ₹5',
  },
  {
    id: 'pack-pro',
    title: 'Pro Photographer',
    credits: 10,
    price: 220,
    description: 'Most popular bundle for active monthly event studios.',
    tag: 'Save ₹30',
    popular: true,
  },
  {
    id: 'pack-studio',
    title: 'Studio Agency Pack',
    credits: 25,
    price: 500,
    description: 'Best wholesale value for professional studios and videographers.',
    tag: 'Save ₹125',
  }
];
