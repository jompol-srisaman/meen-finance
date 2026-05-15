// Init.gs — One-time sheet setup + seed data. Run manually from GAS editor.

function createSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheetsConfig = [
    {
      name: 'Transactions',
      headers: ['date', 'type', 'category', 'amount', 'description', 'wallet', 'account_id']
    },
    {
      name: 'Accounts',
      headers: ['id', 'name', 'type', 'balance', 'wallet', 'color', 'notes']
    },
    {
      name: 'Assets',
      headers: ['id', 'name', 'category', 'value', 'monthly_cashflow', 'date_added', 'wallet', 'notes']
    },
    {
      name: 'Liabilities',
      headers: ['id', 'name', 'category', 'balance', 'monthly_payment', 'interest_rate', 'wallet', 'notes']
    },
    {
      name: 'Income_Sources',
      headers: ['id', 'name', 'type', 'monthly_amount', 'active']
    },
    {
      name: 'Expense_Categories',
      headers: ['id', 'name', 'type', 'monthly_budget']
    },
    {
      name: 'Goals',
      headers: ['id', 'name', 'target_amount', 'current_amount', 'target_date', 'type', 'status', 'wallet', 'notes']
    },
    {
      name: 'Insurance',
      headers: ['id', 'name', 'type', 'provider', 'premium_monthly', 'coverage_amount', 'start_date', 'end_date', 'wallet', 'notes']
    },
    {
      name: 'Settings',
      headers: ['key', 'value']
    }
  ];

  sheetsConfig.forEach(function(config) {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    } else {
      sheet.clearContents();
    }
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.getRange(1, 1, 1, config.headers.length)
      .setFontWeight('bold')
      .setBackground('#4A90D9')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  });

  const settingsSheet = ss.getSheetByName('Settings');
  settingsSheet.getRange('A2:B5').setValues([
    ['currency', 'THB'],
    ['language', 'th'],
    ['initialized', 'true'],
    ['version', '2.0']
  ]);

  Logger.log('Sheets created successfully (v3 schema with Accounts).');
}

// Run this after createSheets() to populate sample data
function seedSampleData() {
  createSheets(); // reset + recreate with v2 schema

  const ss = SpreadsheetApp.openById(SHEET_ID);

  // ── Transactions (May 2026) ────────────────────────────────
  const txSheet = ss.getSheetByName('Transactions');
  const txData = [
    ['2026-05-01', 'income',  'เงินเดือน',           45000, 'เงินเดือนเดือน พ.ค.',     'personal'],
    ['2026-05-03', 'expense', 'อาหาร/เครื่องดื่ม',   1200,  'ซื้อของ Big C',            'personal'],
    ['2026-05-05', 'expense', 'เดินทาง/น้ำมัน',      850,   'น้ำมัน + ทางด่วน',         'personal'],
    ['2026-05-08', 'income',  'Freelance/งานพิเศษ',  5000,  'งาน design logo',          'personal'],
    ['2026-05-10', 'expense', 'ที่พัก/บ้าน',          8000,  'ค่าเช่าบ้าน',              'family'],
    ['2026-05-10', 'expense', 'ค่าประกัน',            4300,  'ประกันชีวิต + สุขภาพ',    'personal'],
    ['2026-05-12', 'expense', 'สุขภาพ',              500,   'ค่ายาที่ร้านขายยา',        'personal'],
    ['2026-05-14', 'expense', 'อาหาร/เครื่องดื่ม',   900,   'กินข้าวนอกบ้านครอบครัว',  'family'],
    ['2026-05-15', 'income',  'ปันผล/กองทุน',        1200,  'ปันผล KTB-STD',            'personal'],
    ['2026-05-18', 'expense', 'ช้อปปิ้ง',            2500,  'ซื้อเสื้อผ้า Lazada',      'personal'],
    ['2026-05-20', 'expense', 'เดินทาง/น้ำมัน',      650,   'น้ำมัน',                   'personal'],
    ['2026-05-25', 'expense', 'บันเทิง',             800,   'ดูหนัง + ข้าว',            'family'],
    ['2026-05-28', 'expense', 'ออม/ลงทุน',           5000,  'โอนเข้ากองทุน LTF',        'personal'],
  ];
  txData.forEach(function(row) { txSheet.appendRow(row); });

  // ── Assets ────────────────────────────────────────────────
  const assetSheet = ss.getSheetByName('Assets');
  const assetData = [
    [generateId(), 'เงินฝากออมทรัพย์ KBank',  'savings',     120000,  0,    '2025-01-01', 'personal', ''],
    [generateId(), 'กองทุน LTF ทหารไทย',      'stocks',      85000,   1200, '2024-06-01', 'personal', 'ปันผลประมาณ 1,200 ต่อเดือน'],
    [generateId(), 'บ้านพักอาศัย (ราคาประเมิน)', 'real_estate', 2500000, 0,    '2022-03-01', 'family',   'ซื้อ 2565 ยังผ่อนอยู่'],
  ];
  assetData.forEach(function(row) { assetSheet.appendRow(row); });

  // ── Liabilities ───────────────────────────────────────────
  const liabSheet = ss.getSheetByName('Liabilities');
  const liabData = [
    [generateId(), 'สินเชื่อบ้าน ธอส.', 'mortgage',     1800000, 12000, 4.5,  'family',   ''],
    [generateId(), 'บัตรเครดิต KBank',   'credit_card',  15000,   5000,  18.0, 'personal', 'ตั้งใจปิดภายใน 3 เดือน'],
  ];
  liabData.forEach(function(row) { liabSheet.appendRow(row); });

  // ── Income Sources ────────────────────────────────────────
  const incSheet = ss.getSheetByName('Income_Sources');
  const incData = [
    [generateId(), 'เงินเดือน บริษัท ABC',  'salary',    45000, true],
    [generateId(), 'ปันผลกองทุน LTF',       'portfolio', 1200,  true],
  ];
  incData.forEach(function(row) { incSheet.appendRow(row); });

  // ── Expense Categories ────────────────────────────────────
  const expSheet = ss.getSheetByName('Expense_Categories');
  const expData = [
    [generateId(), 'อาหาร',     'food',       5000],
    [generateId(), 'เดินทาง',   'transport',  3000],
    [generateId(), 'ที่พัก/บ้าน','mortgage',   8000],
    [generateId(), 'ค่าประกัน',  'other',      4300],
    [generateId(), 'สุขภาพ',    'other',      1000],
    [generateId(), 'บันเทิง',   'other',      2000],
    [generateId(), 'ออม/ลงทุน', 'other',      5000],
  ];
  expData.forEach(function(row) { expSheet.appendRow(row); });

  // ── Goals ─────────────────────────────────────────────────
  const goalSheet = ss.getSheetByName('Goals');
  const goalData = [
    [generateId(), 'กองทุนฉุกเฉิน 6 เดือน',    'emergency_fund', 270000, 120000, '2026-12-31', 'active',    'personal', 'ออมเดือนละ 5,000'],
    [generateId(), 'ปิดหนี้บัตรเครดิต KBank', 'debt_payoff',    15000,  0,      '2026-08-31', 'active',    'personal', ''],
    [generateId(), 'ออมดาวน์รถ',               'savings',        150000, 35000,  '2027-06-30', 'active',    'family',   ''],
  ];
  goalData.forEach(function(row) { goalSheet.appendRow(row); });

  // ── Accounts ──────────────────────────────────────────────
  const accSheet = ss.getSheetByName('Accounts');
  const accData = [
    [generateId(), 'บัญชีออมทรัพย์ KBank',  'savings',     120000, 'personal', '#22c55e', ''],
    [generateId(), 'กระเป๋าเงินสด',           'cash',        8000,   'personal', '#f59e0b', ''],
    [generateId(), 'บัตรเครดิต KBank',        'credit_card', 15000,  'personal', '#ef4444', 'ยอดหนี้ปัจจุบัน'],
  ];
  accData.forEach(function(row) { accSheet.appendRow(row); });

  // ── Insurance ─────────────────────────────────────────────
  const insSheet = ss.getSheetByName('Insurance');
  const insData = [
    [generateId(), 'ประกันชีวิต AIA',         'life',     'AIA Thailand',  2500, 1000000, '2026-01-01', '2046-01-01', 'personal', 'จ่ายรายปี แต่หักรายเดือน'],
    [generateId(), 'ประกันสุขภาพ Cigna',       'health',   'Cigna Thailand', 1800, 500000, '2026-01-01', '2027-01-01', 'personal', 'คุ้มครอง OPD+IPD'],
    [generateId(), 'ประกันรถยนต์ ชั้น 1',      'vehicle',  'Tokio Marine',   3200, 500000, '2026-03-01', '2027-03-01', 'family',   'รถครอบครัว'],
  ];
  insData.forEach(function(row) { insSheet.appendRow(row); });

  Logger.log('Sample data seeded successfully!');
  Logger.log('Transactions: ' + txData.length + ', Assets: ' + assetData.length + ', Liabilities: ' + liabData.length);
  Logger.log('Income Sources: ' + incData.length + ', Goals: ' + goalData.length + ', Insurance: ' + insData.length);
}
