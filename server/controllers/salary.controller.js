import { SalaryService } from '../services/salary.service.js';
import { MoyskladService } from '../services/moysklad.service.js';
import { MoyskladSettings } from '../models/MoyskladSettings.js';

export const calculate = async (req, res) => {
  try {
    const { dailyRate, workDays, salesPercentage, salesByDay, targetProductsCount } = req.body;

    if (
      dailyRate === undefined ||
      !Array.isArray(workDays) ||
      salesPercentage === undefined ||
      !salesByDay ||
      !targetProductsCount
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const state = {
      dailyRate: parseFloat(dailyRate),
      workDays,
      salesPercentage: parseFloat(salesPercentage),
      salesByDay,
      targetProductsCount,
    };

    const totalSalary = SalaryService.calculateSalary(state);
    const breakdown = SalaryService.calculateSalaryBreakdown(state);

    res.json({
      totalSalary,
      breakdown,
    });
  } catch (error) {
    console.error('Calculate salary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMoyskladData = async (req, res) => {
  try {
    const { dates } = req.query; // dates - массив дат в формате YYYY-MM-DD

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array required' });
    }

    const settings = await MoyskladSettings.findLatest();
    if (!settings || !settings.store_id) {
      return res.status(400).json({ error: 'Moysklad settings not configured' });
    }

    const results = {};

    for (const date of dates) {
      try {
        const salesData = await MoyskladService.calculateSalesByDay(date, settings.store_id);
        const targetProducts = await MoyskladService.calculateTargetProductsByDay(
          date,
          settings.store_id
        );

        results[date] = {
          sales: salesData.total,
          targetProducts,
        };
      } catch (error) {
        console.error(`Error getting data for date ${date}:`, error);
        results[date] = {
          error: error.message || 'Failed to fetch data',
        };
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Get Moysklad data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveCalculation = async (req, res) => {
  try {
    const { dailyRate, workDays, salesPercentage, salesByDay, targetProductsCount } = req.body;
    const userId = req.user.id;

    if (
      dailyRate === undefined ||
      !Array.isArray(workDays) ||
      salesPercentage === undefined ||
      !salesByDay ||
      !targetProductsCount
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const calculation = await SalaryService.saveCalculation(userId, {
      dailyRate: parseFloat(dailyRate),
      workDays,
      salesPercentage: parseFloat(salesPercentage),
      salesByDay,
      targetProductsCount,
    });

    res.status(201).json(calculation);
  } catch (error) {
    console.error('Save salary calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await SalaryService.getHistory(userId, limit, offset);

    res.json(history);
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCalculation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await SalaryService.deleteCalculation(id, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete salary calculation error:', error);
    if (error.message === 'Calculation not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

