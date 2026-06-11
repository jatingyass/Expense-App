const { Expense, DownloadHistory } = require('../models');
const storageService = require('../services/storageService');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const audit = require('../services/auditService');

// requirePremium middleware gates this route.
const downloadExpenseReport = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const expenses = await Expense.findAll({
    where: { userId },
    order: [['occurredAt', 'DESC']],
  });

  if (!expenses.length) throw ApiError.notFound('No expenses to export');

  // Format occurredAt as YYYY-MM-DD regardless of whether Sequelize returns a string or Date
  const toDateStr = (v) => {
    if (!v) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const s = String(v);
    // 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss...' → take first 10 chars
    return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
  };

  const rows = expenses.map((e) => ({
    Date: toDateStr(e.occurredAt),
    Description: e.description,
    Category: e.category,
    Kind: e.kind,
    Amount: (Number(e.amount) / 100).toFixed(2),
  }));

  // Build CSV manually to avoid json2csv API differences across versions
  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','),
    ),
  ];
  const csvBuffer = Buffer.from(csvLines.join('\n'), 'utf8');

  const filename = `expenses_${userId}_${Date.now()}.csv`;
  const { fileUrl, sizeBytes } = await storageService.writeBuffer(csvBuffer, {
    filename,
    prefix: 'reports',
    contentType: 'text/csv',
  });

  await DownloadHistory.create({
    userId,
    fileUrl,
    rowCount: expenses.length,
    sizeBytes,
  });

  await audit.record({
    userId,
    event: 'report.downloaded',
    payload: { rowCount: expenses.length, sizeBytes },
    req,
  });

  res.json({ message: 'Report generated', fileUrl, rowCount: expenses.length });
});

const getDownloadHistory = catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const history = await DownloadHistory.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 50,
  });
  res.json({ history });
});

module.exports = { downloadExpenseReport, getDownloadHistory };
