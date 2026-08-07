export type AlfaBusinessDemoMetrics = {
  period: string;
  revenue: number;
  transactions: number;
  averageCheck: number;
  revenueTrend: number;
  repeatCustomers: number;
};

// DEMO DATA: эти показатели не загружаются из банка и нужны только для продуктовой демонстрации.
export const DEMO_ALFA_BUSINESS_DATA: AlfaBusinessDemoMetrics = {
  period: "30 дней",
  revenue: 184_000,
  transactions: 47,
  averageCheck: 3_915,
  revenueTrend: 12,
  repeatCustomers: 8,
};

export const ALFA_BUSINESS_STORAGE_KEY = "alfaBusinessConnected";
export const SUBSCRIPTION_PLAN = "pro" as const;

