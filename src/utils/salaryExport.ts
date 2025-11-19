import * as XLSX from 'xlsx-js-style';
import { SalaryState } from '../types';
import { calculateSalaryBreakdown } from './salaryCalculations';
import { TARGET_PRODUCT_BONUS } from '../constants';

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
const applyStyle = (sheet: XLSX.WorkSheet, cellAddress: string, style: XLSX.CellStyle) => {
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
  // Параметры храним как числа для использования в формулах
  const summaryData = [
    ['Расчет зарплаты', ''],
    ['', ''],
    ['Параметры расчета', ''],
    ['Ставка за день', state.dailyRate], // Числовое значение для формул
    ['Процент с продаж', state.salesPercentage], // Числовое значение для формул
    ['Бонус за целевой товар', TARGET_PRODUCT_BONUS], // Числовое значение для формул
    ['Количество рабочих дней', breakdown.workDaysCount],
    ['', ''],
    ['Итоги', ''],
    ['Зарплата по ставке', ''], // Будет заменено на формулу
    ['Процент с продаж', ''], // Будет заменено на формулу
    ['Бонус за целевые товары', ''], // Будет заменено на формулу
    ['ИТОГО', ''], // Будет заменено на формулу
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Заменяем вычисленные значения на формулы в итогах
  // B10: Зарплата по ставке = B4 * B7
  summarySheet['B10'] = { f: 'B4*B7', t: 'n' };
  
  // B11 и B12 будут заполнены после создания листа "Детали по дням"
  // Временно оставляем пустыми, формулы будут добавлены позже
  
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
      const targetCount = state.targetProductsCount[date] || 0;

      dailyData.push([
        formatDate(date),
        sales, // Числовое значение (входные данные)
        '', // Будет заменено на формулу
        targetCount, // Числовое значение (входные данные)
        '', // Будет заменено на формулу
        '', // Будет заменено на формулу
      ]);
    });

    // Добавляем итоговую строку (значения будут заменены на формулы)
    dailyData.push([
      'ИТОГО',
      '', // Будет заменено на формулу SUM
      '', // Будет заменено на формулу SUM
      '', // Будет заменено на формулу SUM
      '', // Будет заменено на формулу SUM
      '', // Будет заменено на формулу SUM
    ]);

    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    
    // Добавляем формулы для каждой строки данных
    // В xlsx-js-style строки нумеруются с 0, но в Excel формулы используют 1-based индексацию
    state.workDays.forEach((date, index) => {
      const colB = XLSX.utils.encode_cell({ r: index + 1, c: 1 }); // B колонка (индекс 1)
      const colC = XLSX.utils.encode_cell({ r: index + 1, c: 2 }); // C колонка (индекс 2)
      const colD = XLSX.utils.encode_cell({ r: index + 1, c: 3 }); // D колонка (индекс 3)
      const colE = XLSX.utils.encode_cell({ r: index + 1, c: 4 }); // E колонка (индекс 4)
      const colF = XLSX.utils.encode_cell({ r: index + 1, c: 5 }); // F колонка (индекс 5)
      
      // C: Процент с продаж = B{row} * 'Общая информация'!$B$5 / 100
      // Используем правильный синтаксис Excel для ссылок на другие листы
      dailySheet[colC] = { f: `${colB}*'Общая информация'!$B$5/100`, t: 'n' };
      
      // E: Бонус за товары = D{row} * 'Общая информация'!$B$6
      dailySheet[colE] = { f: `${colD}*'Общая информация'!$B$6`, t: 'n' };
      
      // F: Итого за день = 'Общая информация'!$B$4 + C{row} + E{row}
      dailySheet[colF] = { f: `'Общая информация'!$B$4+${colC}+${colE}`, t: 'n' };
    });
    
    // Добавляем формулы для итоговой строки
    const lastRowIndex = dailyData.length - 1;
    const firstDataRow = 1; // Первая строка данных (после заголовка)
    const lastDataRowForSum = lastRowIndex - 1; // Последняя строка данных (перед итоговой) - для формул SUM
    
    // Получаем адреса ячеек для итоговой строки
    const totalRowB = XLSX.utils.encode_cell({ r: lastRowIndex, c: 1 });
    const totalRowC = XLSX.utils.encode_cell({ r: lastRowIndex, c: 2 });
    const totalRowD = XLSX.utils.encode_cell({ r: lastRowIndex, c: 3 });
    const totalRowE = XLSX.utils.encode_cell({ r: lastRowIndex, c: 4 });
    const totalRowF = XLSX.utils.encode_cell({ r: lastRowIndex, c: 5 });
    
    // Получаем адреса для диапазона суммирования
    const firstB = XLSX.utils.encode_cell({ r: firstDataRow, c: 1 });
    const lastB = XLSX.utils.encode_cell({ r: lastDataRowForSum, c: 1 });
    const firstC = XLSX.utils.encode_cell({ r: firstDataRow, c: 2 });
    const lastC = XLSX.utils.encode_cell({ r: lastDataRowForSum, c: 2 });
    const firstD = XLSX.utils.encode_cell({ r: firstDataRow, c: 3 });
    const lastD = XLSX.utils.encode_cell({ r: lastDataRowForSum, c: 3 });
    const firstE = XLSX.utils.encode_cell({ r: firstDataRow, c: 4 });
    const lastE = XLSX.utils.encode_cell({ r: lastDataRowForSum, c: 4 });
    const firstF = XLSX.utils.encode_cell({ r: firstDataRow, c: 5 });
    const lastF = XLSX.utils.encode_cell({ r: lastDataRowForSum, c: 5 });
    
    // Итоговая строка: SUM для каждой колонки
    dailySheet[totalRowB] = { f: `SUM(${firstB}:${lastB})`, t: 'n' };
    dailySheet[totalRowC] = { f: `SUM(${firstC}:${lastC})`, t: 'n' };
    dailySheet[totalRowD] = { f: `SUM(${firstD}:${lastD})`, t: 'n' };
    dailySheet[totalRowE] = { f: `SUM(${firstE}:${lastE})`, t: 'n' };
    dailySheet[totalRowF] = { f: `SUM(${firstF}:${lastF})`, t: 'n' };
    
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
    
    // Теперь добавляем формулы в лист "Общая информация", которые ссылаются на "Детали по дням"
    // Используем уже объявленные переменные totalRowC и totalRowE для ссылки на итоговую строку
    
    // B11: Процент с продаж = ссылка на итоговую строку колонки C
    // Используем правильный синтаксис Excel для ссылок на другие листы
    summarySheet['B11'] = { f: `'Детали по дням'!${totalRowC}`, t: 'n' };
    
    // B12: Бонус за целевые товары = ссылка на итоговую строку колонки E
    summarySheet['B12'] = { f: `'Детали по дням'!${totalRowE}`, t: 'n' };
  } else {
    // Если нет рабочих дней, формулы ссылаются на пустые диапазоны
    summarySheet['B11'] = { f: 'SUM(\'Детали по дням\'!C2:C2)', t: 'n' };
    summarySheet['B12'] = { f: 'SUM(\'Детали по дням\'!E2:E2)', t: 'n' };
  }
  
  // B13: ИТОГО = B10 + B11 + B12 (добавляем после всех листов)
  summarySheet['B13'] = { f: 'B10+B11+B12', t: 'n' };

  // Генерируем имя файла с текущей датой
  const now = new Date();
  const fileName = `Расчет_зарплаты_${now.toISOString().split('T')[0]}.xlsx`;

  // Сохраняем файл
  XLSX.writeFile(workbook, fileName);
};

