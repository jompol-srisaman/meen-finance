// Init.gs — One-time sheet setup. Run createSheets() manually from GAS editor.

function createSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheetsConfig = [
    {
      name: 'Transactions',
      headers: ['date', 'type', 'category', 'amount', 'description', 'account']
    },
    {
      name: 'Assets',
      headers: ['id', 'name', 'category', 'value', 'monthly_cashflow', 'date_added', 'notes']
    },
    {
      name: 'Liabilities',
      headers: ['id', 'name', 'category', 'balance', 'monthly_payment', 'interest_rate', 'notes']
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
      headers: ['id', 'name', 'target_amount', 'current_amount', 'target_date', 'type', 'status']
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

  // Seed default settings
  const settingsSheet = ss.getSheetByName('Settings');
  settingsSheet.getRange('A2:B5').setValues([
    ['currency', 'THB'],
    ['language', 'th'],
    ['initialized', 'true'],
    ['version', '1.0']
  ]);

  Logger.log('Sheets created successfully.');
}
