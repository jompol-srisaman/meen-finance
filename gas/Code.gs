// Code.gs — doGet/doPost router

function doGet(e) {
  return handleRequest(e, null);
}

function doPost(e) {
  let body = {};
  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (_) {}
  return handleRequest(e, body);
}

function handleRequest(e, body) {
  const params = e.parameter || {};
  const action = params.action || (body && body.action) || '';
  const key = params.key || (body && body.key) || '';

  // Special case: initSheets is allowed without auth during first-time setup
  if (action !== 'initSheets' && !validateApiKey(key)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    let result;
    switch (action) {
      // Transactions
      case 'getTransactions':
        result = getTransactions(params.month, params.year);
        break;
      case 'addTransaction':
        result = addTransaction(body);
        break;

      // Assets
      case 'getAssets':
        result = getAssets();
        break;
      case 'addAsset':
        result = addAsset(body);
        break;
      case 'updateAsset':
        result = updateAsset(body);
        break;
      case 'deleteAsset':
        result = deleteAsset(body.id);
        break;

      // Liabilities
      case 'getLiabilities':
        result = getLiabilities();
        break;
      case 'addLiability':
        result = addLiability(body);
        break;
      case 'updateLiability':
        result = updateLiability(body);
        break;
      case 'deleteLiability':
        result = deleteLiability(body.id);
        break;

      // Income Sources
      case 'getIncomeSources':
        result = getIncomeSources();
        break;
      case 'addIncomeSource':
        result = addIncomeSource(body);
        break;
      case 'updateIncomeSource':
        result = updateIncomeSource(body);
        break;

      // Expense Categories
      case 'getExpenseCategories':
        result = getExpenseCategories();
        break;
      case 'addExpenseCategory':
        result = addExpenseCategory(body);
        break;

      // Goals
      case 'getGoals':
        result = getGoals();
        break;
      case 'addGoal':
        result = addGoal(body);
        break;
      case 'updateGoal':
        result = updateGoal(body);
        break;

      // Cashflow Game
      case 'getIncomeStatement':
        result = getIncomeStatement(params.month, params.year);
        break;
      case 'getBalanceSheet':
        result = getBalanceSheet();
        break;
      case 'getFreedomMeter':
        result = getFreedomMeter();
        break;

      // Settings
      case 'getSettings':
        result = getSettings();
        break;

      // Setup
      case 'initSheets':
        createSheets();
        result = { success: true, message: 'Sheets initialized' };
        break;

      default:
        return jsonResponse({ error: 'Unknown action: ' + action }, 400);
    }

    return jsonResponse(result, 200);
  } catch (err) {
    return jsonResponse({ error: err.message, stack: err.stack }, 500);
  }
}

function jsonResponse(data, statusCode) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
