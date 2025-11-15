export interface MoneyCount {
  [key: number]: number; // номинал -> количество
}

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

export interface SalaryCalculation {
  id: string;
  timestamp: number;
  dailyRate: number; // ставка за день
  workDays: string[]; // массив дат в формате ISO (YYYY-MM-DD)
  salesPercentage: number; // процент с продаж
  salesByDay: { [date: string]: number }; // сумма продаж по дням
  targetProductsCount: { [date: string]: number }; // количество целевых товаров по дням
  totalSalary: number; // итоговая зарплата
}

export interface SalaryState {
  dailyRate: number;
  workDays: string[];
  salesPercentage: number;
  salesByDay: { [date: string]: number };
  targetProductsCount: { [date: string]: number };
  mode?: 'manual' | 'api'; // режим работы: ручной или API
}

// API МойСклад типы
export interface MoyskladToken {
  accessToken: string;
}

export interface MoyskladSettings {
  accessToken: string;
  storeId: string | null;
}

export interface MoyskladMeta {
  href: string;
  type: string;
  mediaType: string;
  metadataHref?: string;
  uuidHref?: string;
}

export interface Store {
  meta: MoyskladMeta;
  id: string;
  name: string;
  accountId?: string;
}

export interface ProductFolder {
  meta: MoyskladMeta;
  id: string;
  name: string;
  pathName?: string;
  accountId?: string;
}

export interface ProductAttribute {
  meta: MoyskladMeta;
  id: string;
  name: string;
  type: string;
  value: boolean | string | number | null;
}

export interface Product {
  meta: MoyskladMeta;
  id: string;
  name: string;
  code?: string;
  article?: string;
  tags?: string[];
  pathName?: string; // Путь к товару в иерархии папок
  attributes?: ProductAttribute[]; // Атрибуты товара
  productFolder?: {
    meta: MoyskladMeta;
  };
  accountId?: string;
}

export interface DemandPosition {
  meta: MoyskladMeta;
  id: string;
  quantity: number;
  price: number;
  sum?: number; // Итоговая сумма позиции с учетом скидок и налогов
  discount?: number;
  vat?: number;
  assortment: {
    meta: MoyskladMeta;
    // Если используется expand=assortment, товар может быть включен здесь
  } | Product; // Если expand=assortment, assortment может быть объектом Product
  accountId?: string;
}

export interface Demand {
  meta: MoyskladMeta;
  id: string;
  name: string;
  moment: string;
  sum: number;
  store?: {
    meta: MoyskladMeta;
  };
  organization?: {
    meta: MoyskladMeta;
  };
  agent?: {
    meta: MoyskladMeta;
  };
  applicable?: boolean;
  accountId?: string;
}

export interface MoyskladResponse<T> {
  meta: {
    href: string;
    type: string;
    mediaType: string;
    size?: number;
    limit?: number;
    offset?: number;
  };
  rows: T[];
}

