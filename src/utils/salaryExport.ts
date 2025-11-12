import * as XLSX from 'xlsx-js-style';
import { SalaryState } from '../types';
import { calculateSalaryBreakdown } from './salaryCalculations';

type SalaryBreakdown = ReturnType<typeof calculateSalaryBreakdown>;

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    weekday: 'short',
  });
};

// Стили для ячеек
const styles = {
  // Заголовок главный
  mainHeader: {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Заголовок секции
  sectionHeader: {
    font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '5B9BD5' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Заголовок таблицы
  tableHeader: {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Обычная ячейка
  cell: {
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  },
  // Ячейка с числом (выравнивание по правому краю)
  numberCell: {
    alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  },
  // Итоговая строка
  totalRow: {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '70AD47' } },
    alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Итоговая ячейка (левая колонка)
  totalLabel: {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '70AD47' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium', color: { rgb: '000000' } },
      bottom: { style: 'medium', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    },
  },
  // Параметр (левая колонка)
  paramLabel: {
    font: { bold: false, sz: 11 },
    fill: { fgColor: { rgb: 'E7E6E6' } },
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  },
  // Значение параметра
  paramValue: {
    font: { bold: false, sz: 11 },
    fill: { fgColor: { rgb: 'FFFFFF' } },
    alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    },
  },
};

// Применить стиль к ячейке
const applyStyle = (sheet: XLSX.WorkSheet, cellAddress: string, style: any) => {
  if (!sheet[cellAddress]) {
    sheet[cellAddress] = { t: 's', v: '' };
  }
  sheet[cellAddress].s = style;
};

export const exportSalaryToExcel = (
  state: SalaryState,
  breakdown: SalaryBreakdown
): void => {
  const workbook = XLSX.utils.book_new();

  // Лист 1: Общая информация
  const summaryData = [
    ['Расчет зарплаты', ''],
    ['', ''],
    ['Параметры расчета', ''],
    ['Ставка за день', `${state.dailyRate.toFixed(2)} ₽`],
    ['Процент с продаж', `${state.salesPercentage}%`],
    ['Бонус за целевой товар', `${state.targetProductBonus.toFixed(2)} ₽`],
    ['Количество рабочих дней', breakdown.workDaysCount],
    ['', ''],
    ['Итоги', ''],
    ['Зарплата по ставке', `${breakdown.rateSalary.toFixed(2)} ₽`],
    ['Процент с продаж', `${breakdown.salesBonus.toFixed(2)} ₽`],
    ['Бонус за целевые товары', `${breakdown.targetBonus.toFixed(2)} ₽`],
    ['ИТОГО', `${breakdown.totalSalary.toFixed(2)} ₽`],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Установка ширины колонок
  summarySheet['!cols'] = [
    { wch: 28 },
    { wch: 22 },
  ];

  // Применение стилей к листу "Общая информация"
  // Заголовок "Расчет зарплаты" (A1-B1)
  applyStyle(summarySheet, 'A1', styles.mainHeader);
  applyStyle(summarySheet, 'B1', styles.mainHeader);
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

  // Заголовок "Параметры расчета" (A3)
  applyStyle(summarySheet, 'A3', styles.sectionHeader);
  applyStyle(summarySheet, 'B3', styles.sectionHeader);
  summarySheet['!merges'] = [
    ...(summarySheet['!merges'] || []),
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
  ];

  // Параметры (строки 4-7)
  for (let row = 3; row <= 6; row++) {
    applyStyle(summarySheet, XLSX.utils.encode_cell({ r: row, c: 0 }), styles.paramLabel);
    applyStyle(summarySheet, XLSX.utils.encode_cell({ r: row, c: 1 }), styles.paramValue);
  }

  // Заголовок "Итоги" (A9)
  applyStyle(summarySheet, 'A9', styles.sectionHeader);
  applyStyle(summarySheet, 'B9', styles.sectionHeader);
  summarySheet['!merges'] = [
    ...(summarySheet['!merges'] || []),
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } },
  ];

  // Итоговые строки (10-12)
  for (let row = 9; row <= 11; row++) {
    applyStyle(summarySheet, XLSX.utils.encode_cell({ r: row, c: 0 }), styles.paramLabel);
    applyStyle(summarySheet, XLSX.utils.encode_cell({ r: row, c: 1 }), styles.paramValue);
  }

  // Итоговая строка "ИТОГО" (13)
  applyStyle(summarySheet, 'A13', styles.totalLabel);
  applyStyle(summarySheet, 'B13', styles.totalRow);

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Общая информация');

  // Лист 2: Детали по дням
  if (state.workDays.length > 0) {
    const dailyData = [
      ['Дата', 'Продажи (₽)', 'Процент с продаж (₽)', 'Целевые товары (шт)', 'Бонус за товары (₽)', 'Итого за день (₽)'],
    ];

    state.workDays.forEach((date) => {
      const sales = state.salesByDay[date] || 0;
      const salesBonus = sales * (state.salesPercentage / 100);
      const targetCount = state.targetProductsCount[date] || 0;
      const targetBonus = targetCount * state.targetProductBonus;
      const dayTotal = state.dailyRate + salesBonus + targetBonus;

      dailyData.push([
        formatDate(date),
        sales.toFixed(2),
        salesBonus.toFixed(2),
        targetCount.toString(),
        targetBonus.toFixed(2),
        dayTotal.toFixed(2),
      ]);
    });

    // Добавляем итоговую строку
    dailyData.push([
      'ИТОГО',
      state.workDays.reduce((sum, date) => sum + (state.salesByDay[date] || 0), 0).toFixed(2),
      breakdown.salesBonus.toFixed(2),
      state.workDays.reduce((sum, date) => sum + (state.targetProductsCount[date] || 0), 0).toString(),
      breakdown.targetBonus.toFixed(2),
      breakdown.totalSalary.toFixed(2),
    ]);

    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    
    // Установка ширины колонок
    dailySheet['!cols'] = [
      { wch: 22 },
      { wch: 16 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 20 },
    ];

    // Применение стилей к листу "Детали по дням"
    const range = XLSX.utils.decode_range(dailySheet['!ref'] || 'A1');
    const lastRowIndex = dailyData.length - 1;

    // Заголовки таблицы (строка 1)
    for (let col = 0; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      applyStyle(dailySheet, cellAddress, styles.tableHeader);
    }

    // Данные (строки 2 до предпоследней)
    for (let row = 1; row < lastRowIndex; row++) {
      // Дата (левая колонка)
      applyStyle(dailySheet, XLSX.utils.encode_cell({ r: row, c: 0 }), styles.cell);
      // Числовые колонки
      for (let col = 1; col <= range.e.c; col++) {
        applyStyle(dailySheet, XLSX.utils.encode_cell({ r: row, c: col }), styles.numberCell);
      }
    }

    // Итоговая строка
    applyStyle(dailySheet, XLSX.utils.encode_cell({ r: lastRowIndex, c: 0 }), styles.totalLabel);
    for (let col = 1; col <= range.e.c; col++) {
      applyStyle(dailySheet, XLSX.utils.encode_cell({ r: lastRowIndex, c: col }), styles.totalRow);
    }

    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Детали по дням');
  }

  // Генерируем имя файла с текущей датой
  const now = new Date();
  const fileName = `Расчет_зарплаты_${now.toISOString().split('T')[0]}.xlsx`;

  // Сохраняем файл
  XLSX.writeFile(workbook, fileName);
};

