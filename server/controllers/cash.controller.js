import { CashService } from '../services/cash.service.js';

export const calculate = async (req, res) => {
  try {
    const { initialAmount, bills, coinsRubles, coinsKopecks } = req.body;

    if (initialAmount === undefined || !bills || !coinsRubles || !coinsKopecks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const totalAmount = CashService.calculateTotal(
      parseFloat(initialAmount),
      bills,
      coinsRubles,
      coinsKopecks
    );

    res.json({ totalAmount });
  } catch (error) {
    console.error('Calculate cash error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveEntry = async (req, res) => {
  try {
    const { initialAmount, bills, coinsRubles, coinsKopecks } = req.body;
    const userId = req.user.id;

    if (initialAmount === undefined || !bills || !coinsRubles || !coinsKopecks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const entry = await CashService.saveEntry(userId, {
      initialAmount: parseFloat(initialAmount),
      bills,
      coinsRubles,
      coinsKopecks,
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Save cash entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const history = await CashService.getHistory(userId, limit, offset);

    res.json(history);
  } catch (error) {
    console.error('Get cash history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await CashService.deleteEntry(id, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete cash entry error:', error);
    if (error.message === 'Entry not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

