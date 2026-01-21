
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  BUYER = 'BUYER'
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface SellerVerification {
  businessName: string;
  businessAddress: string;
  country: string; 
  state?: string;
  city?: string;
  phoneNumber: string;
  profilePictureUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  productSamples: string[];
  govtIdUrl?: string;
  taxId?: string;
  bankAccountVerified?: boolean;
  verificationDate?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  country?: string; 
  state?: string;
  city?: string;
  isSuspended?: boolean;
  registeredUnderSellerId?: string;
  paymentMethod?: string;
  bankDetails?: BankDetails;
  verification?: SellerVerification;
  passwordHint?: string;
  registrationDate?: number;
  subscriptionExpiry?: number;
  createdByAdmin?: boolean;
  gracePeriodAllowed?: boolean;
}

export interface Product {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: number;
  verifiedPurchase: boolean;
}

export interface Dispute {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  status: 'open' | 'resolved' | 'closed';
  reason: string;
  adminDecision?: string;
  createdAt: number;
  messages: Message[];
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  gallery?: string[];
  sizes?: string[];
  videoUrl?: string;
  storeName: string;
  currencySymbol?: string; 
  paymentMethod?: string; 
  location?: string;
  reviews?: Review[];
}

export interface CartItem extends Product {
  selectedSize?: string;
  selectedImageUrl?: string;
  quantity: number;
}

export interface Store {
  id: string;
  sellerId: string;
  name: string;
  description: string;
  bannerUrl: string;
  status: 'active' | 'suspended';
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface Feedback {
  rating: number;
  comment: string;
  timestamp: number;
  buyerName: string;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  storeName: string;
  amount: number;
  commission: number;
  timestamp: number;
  currencySymbol: string;
  paymentMethod: string;
  bankDetails?: BankDetails;
  buyerId?: string;
  feedback?: Feedback;
  trackingCode?: string;
  carrier?: string;
  trackingUrl?: string;
}
