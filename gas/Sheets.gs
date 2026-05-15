// Sheets.gs — All SpreadsheetApp CRUD operations (v2)

const SHEET_ID = '1ZpiHavAZOm_-j1_pvJ_w_jN_A2-gPnKOPRFHwr597yc';

var _ss = null;
function getSpreadsheet() {
  return _ss || (_ss = SpreadsheetApp.openById(SHEET_ID));
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(function(row) {
    const obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function generateId() {
  return new Date().getTime().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── Transactions ──────────────────────────────────────────────

function getTransactions(month, year) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return [];
  const all = sheetToObjects(sheet);
  if (!month && !year) return all;
  return all.filter(function(t) {
    if (!t.date) return false;
    const d = new Date(t.date);
    const matchMonth = month ? (d.getMonth() + 1) === parseInt(month) : true;
    const matchYear = year ? d.getFullYear() === parseInt(year) : true;
    return matchMonth && matchYear;
  });
}

function addTransaction(data) {
  const sheet = getSpreadsheet().getSheetByName('Transactions');
  const amount = parseFloat(data.amount) || 0;
  sheet.appendRow([
    data.date || new Date().toISOString().split('T')[0],
    data.type,
    data.category,
    amount,
    data.description || '',
    data.wallet || 'personal',
    data.account_id || ''
  ]);
  // Auto-update account balance
  if (data.account_id) {
    var acc = getAccounts().filter(function(a) { return a.id == data.account_id; })[0];
    if (acc) {
      var delta;
      if (acc.type === 'credit_card') {
        delta = data.type === 'expense' ? amount : -amount;
      } else {
        delta = data.type === 'income' ? amount : -amount;
      }
      updateAccountBalance(data.account_id, delta);
    }
  }
  return { success: true };
}

// ── Accounts ──────────────────────────────────────────────────

function getAccounts() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName('Accounts');
  if (!sheet) {
    sheet = ss.insertSheet('Accounts');
    sheet.getRange(1, 1, 1, 7).setValues([['id','name','type','balance','wallet','color','notes']]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#4A90D9').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    return [];
  }
  return sheetToObjects(sheet);
}

function addAccount(data) {
  getAccounts(); // ensures sheet exists
  var sheet = getSpreadsheet().getSheetByName('Accounts');
  var id = generateId();
  sheet.appendRow([
    id,
    data.name,
    data.type || 'bank',
    parseFloat(data.balance) || 0,
    data.wallet || 'personal',
    data.color || '#3b82f6',
    data.notes || ''
  ]);
  return { success: true, id: id };
}

function updateAccount(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Accounts'), data);
}

function deleteAccount(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Accounts'), id);
}

function updateAccountBalance(id, delta) {
  var sheet = getSpreadsheet().getSheetByName('Accounts');
  if (!sheet) return { error: 'No Accounts sheet' };
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  var balCol = headers.indexOf('balance');
  for (var i = 1; i < data.length; i++) {
    if (data[i][idCol] == id) {
      var newBal = (parseFloat(data[i][balCol]) || 0) + delta;
      sheet.getRange(i + 1, balCol + 1).setValue(newBal);
      return { success: true, newBalance: newBal };
    }
  }
  return { error: 'Account not found' };
}

// ── Assets ────────────────────────────────────────────────────

function getAssets() {
  const sheet = getSpreadsheet().getSheetByName('Assets');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addAsset(data) {
  const sheet = getSpreadsheet().getSheetByName('Assets');
  const id = generateId();
  sheet.appendRow([
    id,
    data.name,
    data.category || 'other',
    parseFloat(data.value) || 0,
    parseFloat(data.monthly_cashflow) || 0,
    data.date_added || new Date().toISOString().split('T')[0],
    data.wallet || 'personal',
    data.notes || ''
  ]);
  return { success: true, id: id };
}

function updateAsset(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Assets'), data);
}

function deleteAsset(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Assets'), id);
}

// ── Liabilities ───────────────────────────────────────────────

function getLiabilities() {
  const sheet = getSpreadsheet().getSheetByName('Liabilities');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addLiability(data) {
  const sheet = getSpreadsheet().getSheetByName('Liabilities');
  const id = generateId();
  sheet.appendRow([
    id,
    data.name,
    data.category || 'other',
    parseFloat(data.balance) || 0,
    parseFloat(data.monthly_payment) || 0,
    parseFloat(data.interest_rate) || 0,
    data.wallet || 'personal',
    data.notes || ''
  ]);
  return { success: true, id: id };
}

function updateLiability(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Liabilities'), data);
}

function deleteLiability(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Liabilities'), id);
}

// ── Income Sources ────────────────────────────────────────────

function getIncomeSources() {
  const sheet = getSpreadsheet().getSheetByName('Income_Sources');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addIncomeSource(data) {
  const sheet = getSpreadsheet().getSheetByName('Income_Sources');
  const id = generateId();
  sheet.appendRow([
    id,
    data.name,
    data.type || 'salary',
    parseFloat(data.monthly_amount) || 0,
    data.active !== false ? true : false
  ]);
  return { success: true, id: id };
}

function updateIncomeSource(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Income_Sources'), data);
}

function deleteIncomeSource(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Income_Sources'), id);
}

// ── Expense Categories ────────────────────────────────────────

function getExpenseCategories() {
  const sheet = getSpreadsheet().getSheetByName('Expense_Categories');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addExpenseCategory(data) {
  const sheet = getSpreadsheet().getSheetByName('Expense_Categories');
  const id = generateId();
  sheet.appendRow([id, data.name, data.type || 'other', parseFloat(data.monthly_budget) || 0]);
  return { success: true, id: id };
}

function deleteExpenseCategory(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Expense_Categories'), id);
}

// ── Goals ─────────────────────────────────────────────────────

function getGoals() {
  const sheet = getSpreadsheet().getSheetByName('Goals');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addGoal(data) {
  const sheet = getSpreadsheet().getSheetByName('Goals');
  const id = generateId();
  sheet.appendRow([
    id,
    data.name,
    parseFloat(data.target_amount) || 0,
    parseFloat(data.current_amount) || 0,
    data.target_date || '',
    data.type || 'savings',
    data.status || 'active',
    data.wallet || 'personal',
    data.notes || ''
  ]);
  return { success: true, id: id };
}

function updateGoal(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Goals'), data);
}

function deleteGoal(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Goals'), id);
}

// ── Insurance ─────────────────────────────────────────────────

function getInsurance() {
  const sheet = getSpreadsheet().getSheetByName('Insurance');
  if (!sheet) return [];
  return sheetToObjects(sheet);
}

function addInsurance(data) {
  const sheet = getSpreadsheet().getSheetByName('Insurance');
  const id = generateId();
  sheet.appendRow([
    id,
    data.name,
    data.type || 'life',
    data.provider || '',
    parseFloat(data.premium_monthly) || 0,
    parseFloat(data.coverage_amount) || 0,
    data.start_date || '',
    data.end_date || '',
    data.wallet || 'personal',
    data.notes || ''
  ]);
  return { success: true, id: id };
}

function updateInsurance(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Insurance'), data);
}

function deleteInsurance(id) {
  return deleteRowById(getSpreadsheet().getSheetByName('Insurance'), id);
}

function getInsuranceSummary() {
  const list = getInsurance();
  let totalMonthly = 0;
  const byType = {};
  list.forEach(function(ins) {
    const pm = parseFloat(ins.premium_monthly) || 0;
    totalMonthly += pm;
    byType[ins.type] = (byType[ins.type] || 0) + pm;
  });
  return {
    list: list,
    totalMonthly: totalMonthly,
    totalAnnual: totalMonthly * 12,
    byType: byType,
    count: list.length
  };
}

// ── Settings ──────────────────────────────────────────────────

function getSettings() {
  const sheet = getSpreadsheet().getSheetByName('Settings');
  if (!sheet) return {};
  const rows = sheetToObjects(sheet);
  const settings = {};
  rows.forEach(function(r) { settings[r.key] = r.value; });
  return settings;
}

// ── Milestones (stored as JSON in Settings) ───────────────────

var DEFAULT_MILESTONES = [
  { pct: 0,   label: 'Rat Race', emoji: '🐀' },
  { pct: 25,  label: 'เริ่มตื่นรู้', emoji: '🌱' },
  { pct: 50,  label: 'Fast Track', emoji: '🌿' },
  { pct: 75,  label: 'ใกล้อิสระ', emoji: '🌳' },
  { pct: 100, label: 'Financial Freedom', emoji: '🏆' }
];

function getMilestones() {
  var settings = getSettings();
  if (settings.milestones) {
    try { return JSON.parse(settings.milestones); } catch(e) {}
  }
  return DEFAULT_MILESTONES;
}

function saveMilestones(milestones) {
  var sheet = getSpreadsheet().getSheetByName('Settings');
  if (!sheet) return { error: 'No Settings sheet' };
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'milestones') {
      sheet.getRange(i + 1, 2).setValue(JSON.stringify(milestones));
      return { success: true };
    }
  }
  sheet.appendRow(['milestones', JSON.stringify(milestones)]);
  return { success: true };
}

// ── Goals Auto-Sync ───────────────────────────────────────────

function syncGoalsProgress() {
  var now = new Date();
  var assets = getAssets();
  var liabilities = getLiabilities();
  var txs = getTransactions(now.getMonth() + 1, now.getFullYear());
  var expCats = getExpenseCategories();

  var savingsTotal = assets.filter(function(a) { return a.category === 'savings'; })
    .reduce(function(s, a) { return s + (parseFloat(a.value) || 0); }, 0);
  var investTotal = assets.filter(function(a) { return ['stocks','real_estate','business'].indexOf(a.category) >= 0; })
    .reduce(function(s, a) { return s + (parseFloat(a.value) || 0); }, 0);
  var liabTotal = liabilities.reduce(function(s, l) { return s + (parseFloat(l.balance) || 0); }, 0);
  var incomeTotal = txs.filter(function(t) { return t.type === 'income'; })
    .reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);
  var expenseTotal = txs.filter(function(t) { return t.type === 'expense'; })
    .reduce(function(s, t) { return s + (parseFloat(t.amount) || 0); }, 0);
  var monthlyExpenses = expCats.reduce(function(s, c) { return s + (parseFloat(c.monthly_budget) || 0); }, 0);

  var sheet = getSpreadsheet().getSheetByName('Goals');
  if (!sheet) return { synced: 0 };
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return { synced: 0 };

  var headers = data[0];
  var typeIdx = headers.indexOf('type');
  var currentIdx = headers.indexOf('current_amount');
  var targetIdx = headers.indexOf('target_amount');

  var synced = 0;
  for (var i = 1; i < data.length; i++) {
    var type = data[i][typeIdx];
    var newCurrent = null;
    var newTarget = null;

    if (type === 'savings') {
      newCurrent = savingsTotal;
    } else if (type === 'investment') {
      newCurrent = investTotal;
    } else if (type === 'debt_payoff') {
      var origTarget = parseFloat(data[i][targetIdx]) || 0;
      newCurrent = Math.max(0, origTarget - liabTotal);
    } else if (type === 'emergency_fund') {
      newCurrent = savingsTotal;
      if (monthlyExpenses > 0) newTarget = monthlyExpenses * 6;
    } else if (type === 'monthly_cashflow') {
      newCurrent = incomeTotal - expenseTotal;
    }

    if (newCurrent !== null) {
      sheet.getRange(i + 1, currentIdx + 1).setValue(newCurrent);
      synced++;
    }
    if (newTarget !== null) {
      sheet.getRange(i + 1, targetIdx + 1).setValue(newTarget);
    }
  }

  return {
    synced: synced,
    snapshot: {
      savingsTotal: savingsTotal,
      investTotal: investTotal,
      liabTotal: liabTotal,
      monthlyCashflow: incomeTotal - expenseTotal,
      emergencyFundTarget: monthlyExpenses * 6
    }
  };
}

// ── Cashflow Game Aggregates ──────────────────────────────────

function getIncomeStatement(month, year) {
  const sources = getIncomeSources().filter(function(s) { return s.active !== false && s.active !== 'false'; });
  const income = { salary: 0, passive: 0, portfolio: 0, total: 0 };
  sources.forEach(function(s) {
    const amt = parseFloat(s.monthly_amount) || 0;
    if (s.type === 'salary') income.salary += amt;
    else if (s.type === 'passive') income.passive += amt;
    else if (s.type === 'portfolio') income.portfolio += amt;
    income.total += amt;
  });

  const categories = getExpenseCategories();
  const expenses = { total: 0 };
  categories.forEach(function(c) {
    const amt = parseFloat(c.monthly_budget) || 0;
    expenses[c.type] = (expenses[c.type] || 0) + amt;
    expenses.total += amt;
  });

  return {
    income: income,
    expenses: expenses,
    cashflow: income.total - expenses.total,
    month: month || null,
    year: year || null
  };
}

function getBalanceSheet() {
  var assets = getAssets();
  var liabilities = getLiabilities();
  var accounts = getAccounts();

  var accountAssets = accounts
    .filter(function(a) { return a.type !== 'credit_card'; })
    .reduce(function(s, a) { return s + (parseFloat(a.balance) || 0); }, 0);
  var accountLiabs = accounts
    .filter(function(a) { return a.type === 'credit_card'; })
    .reduce(function(s, a) { return s + (parseFloat(a.balance) || 0); }, 0);

  var totalAssets = assets.reduce(function(sum, a) { return sum + (parseFloat(a.value) || 0); }, 0) + accountAssets;
  var totalLiabilities = liabilities.reduce(function(sum, l) { return sum + (parseFloat(l.balance) || 0); }, 0) + accountLiabs;
  return {
    totalAssets: totalAssets,
    totalLiabilities: totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assets: assets,
    liabilities: liabilities,
    accounts: accounts
  };
}

function getBudgetActual(month, year) {
  var categories = getExpenseCategories();
  var txs = getTransactions(month, year);
  var expenses = txs.filter(function(t) { return t.type === 'expense'; });

  var actualByName = {};
  expenses.forEach(function(t) {
    var cat = t.category || 'อื่นๆ';
    actualByName[cat] = (actualByName[cat] || 0) + (parseFloat(t.amount) || 0);
  });

  var result = categories.map(function(c) {
    var budget = parseFloat(c.monthly_budget) || 0;
    var actual = actualByName[c.name] || 0;
    return { id: c.id, name: c.name, type: c.type, budget: budget, actual: actual,
             variance: budget - actual, pct: budget > 0 ? Math.round((actual / budget) * 100) : null };
  });

  var budgetNames = categories.map(function(c) { return c.name; });
  Object.keys(actualByName).forEach(function(name) {
    if (budgetNames.indexOf(name) < 0) {
      result.push({ id: null, name: name, type: 'other', budget: 0,
                    actual: actualByName[name], variance: -actualByName[name], pct: null });
    }
  });

  return {
    items: result,
    totalBudget: result.reduce(function(s, r) { return s + r.budget; }, 0),
    totalActual: result.reduce(function(s, r) { return s + r.actual; }, 0),
    totalVariance: result.reduce(function(s, r) { return s + r.variance; }, 0)
  };
}

function getFIRENumber() {
  var settings = getSettings();
  var stmt = getIncomeStatement();
  var assets = getAssets();

  var monthlyExpenses = stmt.expenses.total;
  var swr = parseFloat(settings.fire_swr) || 4;
  var fireNumber = (monthlyExpenses * 12) / (swr / 100);
  var targetMonthly = parseFloat(settings.fire_target_monthly) || monthlyExpenses;

  var passiveAssets = assets
    .filter(function(a) { return ['stocks','real_estate','business'].indexOf(a.category) >= 0; })
    .reduce(function(s, a) { return s + (parseFloat(a.value) || 0); }, 0);

  var passiveIncome = stmt.income.passive + stmt.income.portfolio;
  var progress = fireNumber > 0 ? Math.min((passiveAssets / fireNumber) * 100, 100) : 0;

  return {
    fireNumber: fireNumber,
    annualExpenses: monthlyExpenses * 12,
    monthlyExpenses: monthlyExpenses,
    targetMonthlyPassive: targetMonthly,
    currentPassiveIncome: passiveIncome,
    currentPassiveAssets: passiveAssets,
    swr: swr,
    progress: Math.round(progress * 10) / 10,
    shortfall: Math.max(0, fireNumber - passiveAssets),
    incomeGap: Math.max(0, targetMonthly - passiveIncome)
  };
}

function recordNetWorthSnapshot() {
  var bs = getBalanceSheet();
  var now = new Date();
  var key = 'networth_' + now.getFullYear() + '_' + String(now.getMonth() + 1).padStart(2, '0');
  var value = JSON.stringify({
    netWorth: bs.netWorth,
    assets: bs.totalAssets,
    liabilities: bs.totalLiabilities,
    date: now.toISOString().split('T')[0]
  });
  var sheet = getSpreadsheet().getSheetByName('Settings');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return { success: true, key: key };
    }
  }
  sheet.appendRow([key, value]);
  return { success: true, key: key };
}

function getNetWorthHistory() {
  var settings = getSettings();
  var history = [];
  Object.keys(settings).forEach(function(k) {
    if (k.indexOf('networth_') === 0) {
      try { history.push(JSON.parse(settings[k])); } catch(e) {}
    }
  });
  history.sort(function(a, b) { return a.date > b.date ? 1 : -1; });
  return history;
}

function saveFireSettings(data) {
  var sheet = getSpreadsheet().getSheetByName('Settings');
  if (!sheet) return { error: 'No Settings sheet' };
  var rows = sheet.getDataRange().getValues();
  var toSet = { fire_target_monthly: data.fire_target_monthly || '', fire_swr: data.fire_swr || '4' };
  Object.keys(toSet).forEach(function(key) {
    var found = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(toSet[key]);
        found = true; break;
      }
    }
    if (!found) sheet.appendRow([key, toSet[key]]);
  });
  return { success: true };
}

function getFreedomMeter() {
  const stmt = getIncomeStatement();
  const passiveIncome = stmt.income.passive + stmt.income.portfolio;
  const totalExpenses = stmt.expenses.total;
  const ratio = totalExpenses > 0 ? (passiveIncome / totalExpenses) * 100 : 0;
  return {
    passiveIncome: passiveIncome,
    totalExpenses: totalExpenses,
    ratio: Math.round(ratio * 10) / 10,
    status: ratio >= 100 ? 'financial_freedom' : ratio >= 50 ? 'fast_track' : 'rat_race'
  };
}

// ── Generic Helpers ───────────────────────────────────────────

function updateRowById(sheet, data) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return { success: false, error: 'No id column' };

  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] == data.id) {
      const row = values[i].slice();
      headers.forEach(function(h, j) {
        if (data[h] !== undefined) row[j] = data[h];
      });
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}

// ── Dashboard Aggregate ───────────────────────────────────────

function getDashboard(month, year) {
  var now = new Date();
  var m = parseInt(month) || (now.getMonth() + 1);
  var y = parseInt(year) || now.getFullYear();
  return {
    balanceSheet: getBalanceSheet(),
    freedomMeter: getFreedomMeter(),
    incomeStatement: getIncomeStatement(m, y),
    recentTransactions: getTransactions(m, y)
  };
}

// ── Batch Import ─────────────────────────────────────────────

function addTransactionsBatch(data) {
  var sheet = getSpreadsheet().getSheetByName('Transactions');
  if (!sheet) return { error: 'No Transactions sheet' };
  var txs = data.transactions || [];
  if (!txs.length) return { success: true, inserted: 0 };
  var rows = txs.map(function(tx) {
    return [
      tx.date || new Date().toISOString().split('T')[0],
      tx.type || 'expense',
      tx.category || 'อื่นๆ',
      parseFloat(tx.amount) || 0,
      tx.description || '',
      tx.wallet || 'personal',
      tx.account_id || ''
    ];
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 7).setValues(rows);
  return { success: true, inserted: rows.length };
}

function deleteRowById(sheet, id) {
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return { success: false, error: 'No id column' };

  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] == id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}
