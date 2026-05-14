// api.js — Single fetch wrapper for all GAS calls

async function apiGet(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

async function apiPost(action, data = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('key', API_KEY);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, action, key: API_KEY })
  });
  if (!res.ok) throw new Error('API error: ' + res.status);
  return res.json();
}

// Convenience functions
const API = {
  getTransactions: (month, year) => apiGet('getTransactions', { month, year }),
  addTransaction: (data) => apiPost('addTransaction', data),
  getAssets: () => apiGet('getAssets'),
  addAsset: (data) => apiPost('addAsset', data),
  updateAsset: (data) => apiPost('updateAsset', data),
  deleteAsset: (id) => apiPost('deleteAsset', { id }),
  getLiabilities: () => apiGet('getLiabilities'),
  addLiability: (data) => apiPost('addLiability', data),
  updateLiability: (data) => apiPost('updateLiability', data),
  deleteLiability: (id) => apiPost('deleteLiability', { id }),
  getIncomeSources: () => apiGet('getIncomeSources'),
  addIncomeSource: (data) => apiPost('addIncomeSource', data),
  updateIncomeSource: (data) => apiPost('updateIncomeSource', data),
  getExpenseCategories: () => apiGet('getExpenseCategories'),
  addExpenseCategory: (data) => apiPost('addExpenseCategory', data),
  getGoals: () => apiGet('getGoals'),
  addGoal: (data) => apiPost('addGoal', data),
  updateGoal: (data) => apiPost('updateGoal', data),
  getIncomeStatement: (month, year) => apiGet('getIncomeStatement', { month, year }),
  getBalanceSheet: () => apiGet('getBalanceSheet'),
  getFreedomMeter: () => apiGet('getFreedomMeter'),
  getSettings: () => apiGet('getSettings'),
};

function showLoading(el) {
  if (el) el.innerHTML = '<div class="flex justify-center p-8"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>';
}

function showError(el, msg) {
  if (el) el.innerHTML = `<div class="text-red-500 p-4 text-center">${msg}</div>`;
}
