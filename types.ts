
export enum UserRole {
  ADMIN = 'ADMIN', // Super Admin
  SELLER = 'SELLER',
  BUYER = 'BUYER',
  STAFF = 'STAFF', // Generic Staff
  MARKETER = 'MARKETER',
  TEAM_MEMBER = 'TEAM_MEMBER',
  TECHNICAL = 'TECHNICAL'
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
  identityApproved?: boolean; 
  cacRegistrationNumber?: string; 
  govDocumentUrl?: string; 
  productSamples: string[];
  approvalDate?: number;
}

export interface AIConfig {
  greeting: string;
  tone: 'professional' | 'friendly' | 'enthusiastic' | 'minimalist';
  autoReplyEnabled: boolean;
  specialInstructions: string;
}

export interface SellerPaymentConfig {
  paystackPublicKey?: string;
  flutterwavePublicKey?: string;
  stripePublicKey?: string;
  bankDetails?: BankDetails;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin?: string; // Added PIN for authentication
  storeName?: string;
  country?: string; 
  currency?: string; // e.g., 'NGN', 'USD'
  currencySymbol?: string; // e.g., '₦', '$'
  state?: string;
  city?: string;
  isSuspended?: boolean;
  registeredUnderSellerId?: string;
  recruitedBy?: string; 
  paymentMethod?: string;
  enabledPaymentMethods?: string[];
  sellerPaymentConfig?: SellerPaymentConfig; // Seller's personal gateway keys
  bankDetails?: BankDetails;
  verification?: SellerVerification;
  passwordHint?: string; 
  rentPaid?: boolean;
  subscriptionExpiry?: number;
  aiConfig?: AIConfig;
  notifications?: string[]; 
  sellerRating?: number; // 0 to 5 stars
  monthlyReportSubscribed?: boolean;
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  timestamp: number;
  verifiedPurchase: boolean;
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
  flags?: number; // Number of times flagged
  isFlagged?: boolean; // If true, hidden from main feed until reviewed
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
  attachment?: string; // Base64 string for images
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
  REFUNDED = 'REFUNDED',
  ESCALATED = 'ESCALATED' // Admin intervention
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
  escalatedAt?: number;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  sellerId: string;
  storeName: string;
  amount: number;
  commission: number;
  tax: number; // Tax amount deducted
  timestamp: number;
  currencySymbol: string;
  paymentMethod: string;
  bankDetails?: BankDetails;
  feedback?: Feedback;
  billingDetails: BillingDetails;
  deliveryType: DeliveryType;
  buyerId?: string;
}

export interface SiteConfig {
  siteName: string;
  logoUrl?: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBackgroundUrl?: string;
  adBanners: string[];
  announcement: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  adminBankDetails: string;
  paystackPublicKey?: string;
  flutterwavePublicKey?: string;
  stripePublicKey?: string;
  rentalPrice: number;
  commissionRate: number;
  taxEnabled: boolean;
  taxRate: number;
  autoFlaggingEnabled: boolean;
  siteLocked: boolean;
  siteLockPassword?: string;
  geminiApiKey?: string; // Added for manual API Key override
}