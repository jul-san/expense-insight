export type CategoryKey = 'purchase' | 'recurring' | 'misc' | 'deposit' | 'investments';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: CategoryKey;
}

export interface MergedTransaction extends Transaction {
  _period: string;
}

export interface TransactionGroups {
  purchase: Transaction[];
  recurring: Transaction[];
  misc: Transaction[];
  deposit: Transaction[];
  investments: Transaction[];
}

export interface Statement {
  filename: string;
  openingDate: Date | null;
  openingBalance: number | null;
  closingDate: Date | null;
  closingBalance: number | null;
  label: string;
  transactions: TransactionGroups;
}

export interface CategoryInfo {
  label: string;
  color: string;
}

export const CATS: Record<CategoryKey, CategoryInfo> = {
  purchase:    { label: 'Purchases',          color: '#4f46e5' },
  recurring:   { label: 'Recurring Payments', color: '#0f766e' },
  investments: { label: 'Investments',        color: '#d97706' },
  deposit:     { label: 'Deposit',            color: '#16a34a' },
  misc:        { label: 'Miscellaneous',      color: '#9333ea' },
};
