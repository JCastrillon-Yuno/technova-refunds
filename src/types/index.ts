export interface Refund {
  id: string;
  date: string; // ISO date string
  customerId: string;
  country: 'Brazil' | 'Mexico' | 'Colombia';
  city: string;
  reason: RefundReason;
  paymentMethod: PaymentMethod;
  processor: Processor;
  amountUSD: number;
  amountLocal: number;
  currency: 'BRL' | 'MXN' | 'COP';
  orderId: string;
  orderAmountUSD: number;
  accountAgeDays: number;
  // Computed after scoring
  riskScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  riskReasons?: string[];
}

export type RefundReason =
  | 'customer_request'
  | 'defective_product'
  | 'delivery_failure'
  | 'duplicate_charge'
  | 'fraud_prevention';

export type PaymentMethod =
  | 'visa_credit'
  | 'mastercard_credit'
  | 'visa_debit'
  | 'mastercard_debit'
  | 'pix'
  | 'oxxo';

export type Processor = 'Stripe' | 'PayU' | 'OpenPay' | 'MercadoPago' | 'Adyen';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface FilterState {
  dateStart: string;
  dateEnd: string;
  countries: string[];
  cities?: string[]; // set programmatically from PatternDiscovery
  reasons: RefundReason[];
  paymentMethods: PaymentMethod[];
  amountMin: number;
  amountMax: number;
  riskLevel: 'all' | RiskLevel;
}

export interface SavedView {
  id: string;
  label: string;
  filters: FilterState;
  createdAt: string;
}

export interface SortConfig {
  key: keyof Refund;
  dir: 'asc' | 'desc';
}

export interface Metrics {
  totalRefunds: number;
  refundRate: number;
  avgAmount: number;
  totalAmountUSD: number;
  prevPeriodRefunds: number;
  prevPeriodRate: number;
  prevPeriodAvgAmount: number;
}

export interface DailyAggregate {
  date: string;
  count: number;
  topReason: string;
}

export interface ScoredRefund extends Refund {
  riskScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
}
