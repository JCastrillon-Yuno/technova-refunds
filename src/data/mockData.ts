import type { Refund, RefundReason, PaymentMethod, Processor } from '../types';

const START_DATE = new Date('2024-10-01');

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function fmt(date: Date): string {
  return date.toISOString().split('T')[0];
}

function rnd<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rndBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Exchange rates (approx)
const FX: Record<string, number> = { BRL: 5.0, MXN: 17.0, COP: 4000.0 };

const BRAZIL_CITIES = ['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Fortaleza'];
const MEXICO_CITIES = ['Mexico City', 'Guadalajara', 'Monterrey', 'Puebla'];
const COLOMBIA_CITIES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'];

const COUNTRY_DATA: Record<string, { currency: 'BRL' | 'MXN' | 'COP'; cities: string[]; methods: PaymentMethod[] }> = {
  Brazil: { currency: 'BRL', cities: BRAZIL_CITIES, methods: ['visa_credit', 'mastercard_credit', 'visa_debit', 'mastercard_debit', 'pix'] },
  Mexico: { currency: 'MXN', cities: MEXICO_CITIES, methods: ['visa_credit', 'mastercard_credit', 'visa_debit', 'mastercard_debit', 'oxxo'] },
  Colombia: { currency: 'COP', cities: COLOMBIA_CITIES, methods: ['visa_credit', 'mastercard_credit', 'visa_debit', 'mastercard_debit'] },
};

const PROCESSORS: Processor[] = ['Stripe', 'PayU', 'OpenPay', 'MercadoPago', 'Adyen'];
const REASONS: RefundReason[] = ['customer_request', 'defective_product', 'delivery_failure', 'duplicate_charge', 'fraud_prevention'];

// Pre-generate customer IDs
const CUSTOMER_POOL: string[] = Array.from({ length: 200 }, (_, i) => `CUST${String(i + 1000).padStart(5, '0')}`);
// Serial refunder customers (anomaly #2)
const SERIAL_CUSTOMERS: string[] = Array.from({ length: 10 }, (_, i) => `CUST_SR_${String(i + 1).padStart(3, '0')}`);

let idCounter = 1;

function makeRefund(
  dayOffset: number,
  overrides: Partial<Refund> = {}
): Refund {
  const date = addDays(START_DATE, dayOffset);
  const country = rnd(['Brazil', 'Mexico', 'Colombia']) as 'Brazil' | 'Mexico' | 'Colombia';
  const countryData = COUNTRY_DATA[country];
  const city = rnd(countryData.cities);
  const method = rnd(countryData.methods);
  const processor = rnd(PROCESSORS);
  const reason = rnd(REASONS);
  const amountUSD = rndBetween(20, 300);
  const orderAmountUSD = amountUSD + rndBetween(0, amountUSD * 0.15);
  const fx = FX[countryData.currency];
  const customerId = rnd(CUSTOMER_POOL);
  const accountAgeDays = Math.floor(rndBetween(30, 730));

  const base: Refund = {
    id: `REF${String(idCounter++).padStart(5, '0')}`,
    date: fmt(date),
    customerId,
    country,
    city,
    reason,
    paymentMethod: method,
    processor,
    amountUSD,
    amountLocal: Math.round(amountUSD * fx),
    currency: countryData.currency,
    orderId: `ORD${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    orderAmountUSD,
    accountAgeDays,
  };

  return { ...base, ...overrides };
}

const records: Refund[] = [];

// ── Baseline: days 0–43, ~3.5/day ──────────────────────────────────────────
for (let day = 0; day < 44; day++) {
  const count = Math.floor(rndBetween(3, 5));
  for (let i = 0; i < count; i++) {
    records.push(makeRefund(day));
  }
}

// ── Spike: days 44–89, ~13/day ──────────────────────────────────────────────
for (let day = 44; day < 90; day++) {
  const count = Math.floor(rndBetween(11, 16));
  for (let i = 0; i < count; i++) {
    records.push(makeRefund(day));
  }
}

// ── Anomaly #1: Guadalajara Gang (days 49–56) ────────────────────────────────
// 22 refunds, Guadalajara + OpenPay + duplicate_charge
for (let i = 0; i < 22; i++) {
  const day = 49 + Math.floor(Math.random() * 8);
  records.push(
    makeRefund(day, {
      id: `REF_GG_${String(i + 1).padStart(3, '0')}`,
      country: 'Mexico',
      city: 'Guadalajara',
      processor: 'OpenPay',
      reason: 'duplicate_charge',
      currency: 'MXN',
      amountUSD: rndBetween(80, 250),
      amountLocal: Math.round(rndBetween(80, 250) * FX['MXN']),
      paymentMethod: rnd(['visa_credit', 'mastercard_credit', 'visa_debit', 'mastercard_debit', 'oxxo']),
      customerId: rnd(CUSTOMER_POOL.slice(0, 50)),
    })
  );
}

// ── Anomaly #2: Serial Refunders ─────────────────────────────────────────────
// 10 customers, each with 5–6 refunds within any 30-day window
SERIAL_CUSTOMERS.forEach((cid) => {
  const baseDay = 50 + Math.floor(Math.random() * 20);
  const refundCount = 5 + Math.floor(Math.random() * 2); // 5 or 6
  for (let j = 0; j < refundCount; j++) {
    const day = baseDay + Math.floor(Math.random() * 28);
    const country = rnd(['Brazil', 'Mexico', 'Colombia']) as 'Brazil' | 'Mexico' | 'Colombia';
    const countryData = COUNTRY_DATA[country];
    records.push(
      makeRefund(day, {
        id: `REF_SR_${cid}_${j}`,
        customerId: cid,
        country,
        city: rnd(countryData.cities),
        currency: countryData.currency,
        amountUSD: rndBetween(30, 200),
        amountLocal: Math.round(rndBetween(30, 200) * FX[countryData.currency]),
        paymentMethod: rnd(countryData.methods),
      })
    );
  }
});

// ── Anomaly #3: Bogotá High-Value Cluster (days 61–69) ──────────────────────
// 14 refunds, Bogotá + Visa credit + fraud_prevention, $800–1200 USD equiv
for (let i = 0; i < 14; i++) {
  const day = 61 + Math.floor(Math.random() * 9);
  const amountUSD = rndBetween(800, 1200);
  records.push(
    makeRefund(day, {
      id: `REF_BH_${String(i + 1).padStart(3, '0')}`,
      country: 'Colombia',
      city: 'Bogotá',
      reason: 'fraud_prevention',
      paymentMethod: 'visa_credit',
      processor: rnd(PROCESSORS),
      currency: 'COP',
      amountUSD,
      amountLocal: Math.round(amountUSD * FX['COP']),
      customerId: rnd(CUSTOMER_POOL.slice(100, 150)),
    })
  );
}

// Sort by date ascending, trim to ~500
records.sort((a, b) => a.date.localeCompare(b.date));

export const allRefunds: Refund[] = records.slice(0, 500);
export const DATA_START = fmt(START_DATE);
export const DATA_END = fmt(addDays(START_DATE, 89));
