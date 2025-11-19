import { MoneyCount } from '../../shared/types';

export interface CashEntry {
  id: string;
  timestamp: number;
  initialAmount: number;
  bills: MoneyCount;
  coinsRubles: MoneyCount;
  coinsKopecks: MoneyCount;
  totalAmount: number;
}

export interface CashState {
  initialAmount: number;
  bills: MoneyCount;
  coinsRubles: MoneyCount;
  coinsKopecks: MoneyCount;
}

