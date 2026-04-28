export interface Timestamp {
  seconds: number;
  nanoseconds: number;
}

export interface Shop {
  id: string;
  name: string;
  ownerEmail: string;
  ownerId: string;
  dailyRevenue: number;
  monthlyRevenue: number;
  customerCount: number;
  createdAt: Timestamp;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  faceDescriptor: number[]; // Store as number array for Firestore
  walletBalance: number;
  transactionCount: number;
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  shopId: string;
  customerId: string;
  customerName: string;
  amount: number;
  timestamp: Timestamp;
  status: 'success' | 'failed' | 'flagged';
}

export type ViewState = 'landing' | 'shop-login' | 'shop-dashboard' | 'customer-register' | 'payment-scan';
