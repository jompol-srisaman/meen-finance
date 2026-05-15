// api.js — Single fetch wrapper for all GAS calls (v2)

async function apiGet(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

// GAS Web App drops POST body after redirect — use GET with encoded data param
async function apiPost(action, data = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('key', API_KEY);
  url.searchParams.set('data', JSON.stringify(data));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

const API = {
  getTransactions:       (month, year) => apiGet('getTransactions', { month, year }),
  addTransaction:        (data) => apiPost('addTransaction', data),
  getAccounts:           () => apiGet('getAccounts'),
  addAccount:            (data) => apiPost('addAccount', data),
  updateAccount:         (data) => apiPost('updateAccount', data),
  deleteAccount:         (id) => apiPost('deleteAccount', { id }),
  updateAccountBalance:  (id, delta) => apiPost('updateAccountBalance', { id, delta }),
  getAssets:             () => apiGet('getAssets'),
  addAsset:              (data) => apiPost('addAsset', data),
  updateAsset:           (data) => apiPost('updateAsset', data),
  deleteAsset:           (id) => apiPost('deleteAsset', { id }),
  getLiabilities:        () => apiGet('getLiabilities'),
  addLiability:          (data) => apiPost('addLiability', data),
  updateLiability:       (data) => apiPost('updateLiability', data),
  deleteLiability:       (id) => apiPost('deleteLiability', { id }),
  getIncomeSources:      () => apiGet('getIncomeSources'),
  addIncomeSource:       (data) => apiPost('addIncomeSource', data),
  updateIncomeSource:    (data) => apiPost('updateIncomeSource', data),
  deleteIncomeSource:    (id) => apiPost('deleteIncomeSource', { id }),
  getExpenseCategories:  () => apiGet('getExpenseCategories'),
  addExpenseCategory:    (data) => apiPost('addExpenseCategory', data),
  deleteExpenseCategory: (id) => apiPost('deleteExpenseCategory', { id }),
  getGoals:              () => apiGet('getGoals'),
  addGoal:               (data) => apiPost('addGoal', data),
  updateGoal:            (data) => apiPost('updateGoal', data),
  deleteGoal:            (id) => apiPost('deleteGoal', { id }),
  getInsurance:          () => apiGet('getInsurance'),
  addInsurance:          (data) => apiPost('addInsurance', data),
  updateInsurance:       (data) => apiPost('updateInsurance', data),
  deleteInsurance:       (id) => apiPost('deleteInsurance', { id }),
  getInsuranceSummary:   () => apiGet('getInsuranceSummary'),
  getIncomeStatement:    (month, year) => apiGet('getIncomeStatement', { month, year }),
  getBalanceSheet:       () => apiGet('getBalanceSheet'),
  getFreedomMeter:       () => apiGet('getFreedomMeter'),
  getSettings:           () => apiGet('getSettings'),
  getMilestones:           () => apiGet('getMilestones'),
  saveMilestones:          (milestones) => apiPost('saveMilestones', { milestones }),
  syncGoalsProgress:       () => apiGet('syncGoalsProgress'),
  getBudgetActual:         (month, year) => apiGet('getBudgetActual', { month, year }),
  getFIRENumber:           () => apiGet('getFIRENumber'),
  recordNetWorthSnapshot:  () => apiGet('recordNetWorthSnapshot'),
  getNetWorthHistory:      () => apiGet('getNetWorthHistory'),
  saveFireSettings:        (data) => apiPost('saveFireSettings', data),
  getDashboard:            (month, year) => apiGet('getDashboard', { month, year }),
};

function showLoading(el) {
  if (el) el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color:var(--primary)"></div></div>';
}

function showError(el, msg) {
  if (el) el.innerHTML = `<div class="text-red-500 p-4 text-center">${msg}</div>`;
}
