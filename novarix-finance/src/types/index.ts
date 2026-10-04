export type AccountType = 'Cash' | 'Bank' | 'Savings' | 'Wallet' | 'Other';
export type TransactionType = 'income' | 'expense';

export interface Profile {
  id: string;
  name: string;
  email: string;
  currency: string;
  created_at?: string;
}

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  description?: string;
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category: string;
  amount: number;
  target_amount?: number;
  period: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at?: string;
}

export type InsightType = 'positive' | 'information' | 'warning' | 'recommendation';
export type InsightSeverity = 'low' | 'medium' | 'high';

export interface FinancialInsight {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation?: string;
  relatedRoute?: string;
  metric?: string;
}
