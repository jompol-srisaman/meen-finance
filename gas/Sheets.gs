// Sheets.gs — All SpreadsheetApp CRUD operations (v2)

const SHEET_ID = '1ZpiHavAZOm_-j1_pvJ_w_jN_A2-gPnKOPRFHwr597yc';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SHEET_ID);
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
  sheet.appendRow([
    data.date || new Date().toISOString().split('T')[0],
    data.type,
    data.category,
    parseFloat(data.amount) || 0,
    data.description || '',
    data.wallet || 'personal'
  ]);
  return { success: true };
}

// ── Assets ────────────────────────────────────────────────────

function getAssets() {
  const sheet = getSpreadsheet().getSheetByName('Assets');
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
    data.status || 'active'
  ]);
  return { success: true, id: id };
}

function updateGoal(data) {
  return updateRowById(getSpreadsheet().getSheetByName('Goals'), data);
}

// ── Insurance ─────────────────────────────────────────────────

function getInsurance() {
  const sheet = getSpreadsheet().getSheetByName('Insurance');
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
  const rows = sheetToObjects(sheet);
  const settings = {};
  rows.forEach(function(r) { settings[r.key] = r.value; });
  return settings;
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
  const assets = getAssets();
  const liabilities = getLiabilities();
  const totalAssets = assets.reduce(function(sum, a) { return sum + (parseFloat(a.value) || 0); }, 0);
  const totalLiabilities = liabilities.reduce(function(sum, l) { return sum + (parseFloat(l.balance) || 0); }, 0);
  return {
    totalAssets: totalAssets,
    totalLiabilities: totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assets: assets,
    liabilities: liabilities
  };
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
    status: ratio >= 100 ? 'fast_track' : 'rat_race'
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
      headers.forEach(function(h, j) {
        if (data[h] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(data[h]);
        }
      });
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
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
