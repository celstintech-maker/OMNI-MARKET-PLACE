
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

export interface BillingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export type DeliveryType = 'home_delivery' | 'instant_pickup';

export interface SellerVerification {
  businessName: string;
  businessAddress: string;
  country: string; 
  state?: string;
  city?: string;
  phoneNumber: string;
  profilePictureUrl: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  identityApproved?: boolean; // New: Specifically for identity documents review
  cacRegistrationNumber?: string; // New: CAC Registration
  govDocumentUrl?: string; // New: Link to identity document
  productSamples: string[];
  approvalDate?: number;
}

export interface AIConfig {
  greeting: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'minimalist';
  autoReplyEnabled: boolean;
  specialInstructions: string;
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
  enabledPaymentMethods?: string[];
  bankDetails?: BankDetails;
  verification?: SellerVerification;
  passwordHint?: string; 
  rentPaid?: boolean;
  subscriptionExpiry?: number;
  aiConfig?: AIConfig;
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

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REFUNDED = 'REFUNDED'
}

export interface Dispute {
  id: string;
  transactionId: string;
  buyerId: string;
  sellerId: string;
  reason: 'fake_product' | 'not_delivered' | 'damaged' | 'scam' | 'other';
  description: string;
  status: DisputeStatus;
  timestamp: number;
  adminNote?: string;
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
  feedback?: Feedback;
  billingDetails: BillingDetails;
  deliveryType: DeliveryType;
}
