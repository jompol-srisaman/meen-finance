// Code.gs — doGet router (v2)

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || '';
  const key = params.key || '';

  let body = {};
  if (params.data) {
    try { body = JSON.parse(params.data); } catch (_) {}
  }

  if (action !== 'initSheets' && action !== 'seedData' && !validateApiKey(key)) {
    return jsonResponse({ error: 'Unauthorized' });
  }

  try {
    let result;
    switch (action) {
      case 'getTransactions':       result = getTransactions(params.month, params.year); break;
      case 'addTransaction':        result = addTransaction(body); break;
      case 'getAccounts':           result = getAccounts(); break;
      case 'addAccount':            result = addAccount(body); break;
      case 'updateAccount':         result = updateAccount(body); break;
      case 'deleteAccount':         result = deleteAccount(body.id); break;
      case 'updateAccountBalance':  result = updateAccountBalance(body.id, body.delta); break;
      case 'getAssets':             result = getAssets(); break;
      case 'addAsset':              result = addAsset(body); break;
      case 'updateAsset':           result = updateAsset(body); break;
      case 'deleteAsset':           result = deleteAsset(body.id); break;
      case 'getLiabilities':        result = getLiabilities(); break;
      case 'addLiability':          result = addLiability(body); break;
      case 'updateLiability':       result = updateLiability(body); break;
      case 'deleteLiability':       result = deleteLiability(body.id); break;
      case 'getIncomeSources':      result = getIncomeSources(); break;
      case 'addIncomeSource':       result = addIncomeSource(body); break;
      case 'updateIncomeSource':    result = updateIncomeSource(body); break;
      case 'deleteIncomeSource':    result = deleteIncomeSource(body.id); break;
      case 'getExpenseCategories':  result = getExpenseCategories(); break;
      case 'addExpenseCategory':    result = addExpenseCategory(body); break;
      case 'deleteExpenseCategory': result = deleteExpenseCategory(body.id); break;
      case 'getGoals':              result = getGoals(); break;
      case 'addGoal':              result = addGoal(body); break;
      case 'updateGoal':           result = updateGoal(body); break;
      case 'deleteGoal':           result = deleteGoal(body.id); break;
      case 'getInsurance':          result = getInsurance(); break;
      case 'addInsurance':          result = addInsurance(body); break;
      case 'updateInsurance':       result = updateInsurance(body); break;
      case 'deleteInsurance':       result = deleteInsurance(body.id); break;
      case 'getInsuranceSummary':   result = getInsuranceSummary(); break;
      case 'getIncomeStatement':    result = getIncomeStatement(params.month, params.year); break;
      case 'getBalanceSheet':       result = getBalanceSheet(); break;
      case 'getFreedomMeter':       result = getFreedomMeter(); break;
      case 'getSettings':           result = getSettings(); break;
      case 'getMilestones':           result = getMilestones(); break;
      case 'saveMilestones':         result = saveMilestones(body.milestones); break;
      case 'syncGoalsProgress':      result = syncGoalsProgress(); break;
      case 'getBudgetActual':        result = getBudgetActual(params.month, params.year); break;
      case 'getFIRENumber':          result = getFIRENumber(); break;
      case 'recordNetWorthSnapshot': result = recordNetWorthSnapshot(); break;
      case 'getNetWorthHistory':     result = getNetWorthHistory(); break;
      case 'saveFireSettings':       result = saveFireSettings(body); break;
      case 'getDashboard':            result = getDashboard(params.month, params.year); break;
      case 'initSheets':             createSheets(); result = { success: true }; break;
      default: return jsonResponse({ error: 'Unknown action: ' + action });
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

function doPost(e) {
  return doGet(e);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
