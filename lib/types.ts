export type CategoryKey = 'purchase' | 'recurring' | 'misc';

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
  purchase:  { label: 'Purchases',          color: '#818cf8' },
  recurring: { label: 'Recurring Payments', color: '#2dd4bf' },
  misc:      { label: 'Miscellaneous',      color: '#c084fc' },
};
