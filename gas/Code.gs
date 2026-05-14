// Code.gs — doGet router (all ops via GET to avoid GAS redirect POST-body drop)

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';
  const key = params.key || '';

  // Parse optional data param (used by write operations)
  let body = {};
  if (params.data) {
    try { body = JSON.parse(params.data); } catch (_) {}
  }

  if (action !== 'initSheets' && !validateApiKey(key)) {
    return jsonResponse({ error: 'Unauthorized' });
  }

  try {
    let result;
    switch (action) {
      case 'getTransactions':      result = getTransactions(params.month, params.year); break;
      case 'addTransaction':       result = addTransaction(body); break;
      case 'getAssets':            result = getAssets(); break;
      case 'addAsset':             result = addAsset(body); break;
      case 'updateAsset':          result = updateAsset(body); break;
      case 'deleteAsset':          result = deleteAsset(body.id); break;
      case 'getLiabilities':       result = getLiabilities(); break;
      case 'addLiability':         result = addLiability(body); break;
      case 'updateLiability':      result = updateLiability(body); break;
      case 'deleteLiability':      result = deleteLiability(body.id); break;
      case 'getIncomeSources':     result = getIncomeSources(); break;
      case 'addIncomeSource':      result = addIncomeSource(body); break;
      case 'updateIncomeSource':   result = updateIncomeSource(body); break;
      case 'deleteIncomeSource':   result = deleteIncomeSource(body.id); break;
      case 'getExpenseCategories': result = getExpenseCategories(); break;
      case 'addExpenseCategory':   result = addExpenseCategory(body); break;
      case 'deleteExpenseCategory':result = deleteExpenseCategory(body.id); break;
      case 'getGoals':             result = getGoals(); break;
      case 'addGoal':              result = addGoal(body); break;
      case 'updateGoal':           result = updateGoal(body); break;
      case 'getIncomeStatement':   result = getIncomeStatement(params.month, params.year); break;
      case 'getBalanceSheet':      result = getBalanceSheet(); break;
      case 'getFreedomMeter':      result = getFreedomMeter(); break;
      case 'getSettings':          result = getSettings(); break;
      case 'initSheets':           createSheets(); result = { success: true }; break;
      default: return jsonResponse({ error: 'Unknown action: ' + action });
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// Keep doPost as fallback
function doPost(e) {
  return doGet(e);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
