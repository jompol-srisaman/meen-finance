# Meen Finance

Personal finance app with Robert Kiyosaki Cashflow Game mechanics.
Single user, bilingual (th/en), mobile-first. Cost = ฿0/month.

## Architecture

```
GitHub Pages (frontend/)  →  GAS Web App (gas/)  →  Google Sheets (7 sheets)
```

- **Frontend**: Static HTML + Tailwind CSS CDN + Chart.js CDN + Vanilla JS
- **Backend**: Google Apps Script Web App (`doGet`/`doPost`)
- **DB**: Google Sheets
- **Dev**: `clasp push` deploys GAS; `git push` triggers GitHub Actions → Pages

## Key Files

| File | Purpose |
|------|---------|
| `frontend/js/config.js` | `GAS_URL` and `API_KEY` constants |
| `frontend/js/api.js` | All `fetch()` calls to GAS (single source of truth) |
| `gas/Code.gs` | `doGet()`/`doPost()` router — maps `action` param to handlers |
| `gas/Sheets.gs` | All `SpreadsheetApp` CRUD — one function per action |
| `gas/Auth.gs` | API key validation via `PropertiesService` |
| `gas/Init.gs` | `createSheets()` — one-time setup, run manually from GAS editor |

## Google Sheets Schema

Sheet ID stored in `gas/Sheets.gs` as `SHEET_ID` constant.

### Transactions
`date | type(income/expense) | category | amount | description | account`

### Assets
`id | name | category(savings/stocks/real_estate/business/other) | value | monthly_cashflow | date_added | notes`

### Liabilities
`id | name | category(mortgage/car_loan/credit_card/student_loan/other) | balance | monthly_payment | interest_rate | notes`

### Income_Sources
`id | name | type(salary/passive/portfolio) | monthly_amount | active`

### Expense_Categories
`id | name | type(tax/mortgage/car_payment/credit_card/food/transport/other) | monthly_budget`

### Goals
`id | name | target_amount | current_amount | target_date | type(savings/debt_payoff/investment/emergency_fund) | status`

### Settings
`key | value`  — defaults: `currency=THB`, `language=th`

## GAS API Contract

Base URL: `https://script.google.com/macros/s/[SCRIPT_ID]/exec`
Auth: `?key=[API_KEY]` on every request.

| action | method | params | returns |
|--------|--------|--------|---------|
| `getTransactions` | GET | `month`, `year` | `[{...}]` |
| `addTransaction` | POST | body JSON | `{success, id}` |
| `getAssets` | GET | — | `[{...}]` |
| `addAsset` | POST | body JSON | `{success, id}` |
| `updateAsset` | POST | body JSON (include `id`) | `{success}` |
| `deleteAsset` | POST | body `{id}` | `{success}` |
| `getLiabilities` | GET | — | `[{...}]` |
| `addLiability` | POST | body JSON | `{success, id}` |
| `updateLiability` | POST | body JSON (include `id`) | `{success}` |
| `deleteLiability` | POST | body `{id}` | `{success}` |
| `getIncomeStatement` | GET | `month`, `year` | `{income:{salary,passive,portfolio,total}, expenses:{...categories...,total}, cashflow}` |
| `getBalanceSheet` | GET | — | `{totalAssets, totalLiabilities, netWorth}` |
| `getFreedomMeter` | GET | — | `{passiveIncome, totalExpenses, ratio, status('rat_race'/'fast_track')}` |
| `getIncomeSources` | GET | — | `[{...}]` |
| `addIncomeSource` | POST | body JSON | `{success, id}` |
| `updateIncomeSource` | POST | body JSON | `{success}` |
| `getGoals` | GET | — | `[{...}]` |
| `addGoal` | POST | body JSON | `{success, id}` |
| `updateGoal` | POST | body `{id, current_amount}` | `{success}` |
| `getSettings` | GET | — | `{currency, language}` |
| `initSheets` | GET | — | `{success}` — one-time setup only |

All responses: `Content-Type: application/json`, CORS header `Access-Control-Allow-Origin: *`

## Cashflow Game Logic

```
Monthly Cash Flow = Total Income - Total Expenses
Financial Freedom Ratio = Passive Income / Total Expenses × 100
Status: ratio >= 100 → "fast_track", else → "rat_race"
Net Worth = Total Assets - Total Liabilities
```

## Commands

```bash
# GAS development
clasp login
clasp push                          # push gas/ to Google Apps Script
clasp deploy --description "v1"     # create new deployment (get new URL)
clasp deployments                   # list deployment URLs

# Frontend: just edit files, then:
git add . && git commit -m "..." && git push   # triggers GitHub Actions
```

## Setup Steps (one-time)

1. Create Google Sheet → copy Sheet ID into `gas/Sheets.gs` `SHEET_ID`
2. `clasp create --type webapp --title "Meen Finance" --rootDir gas`
3. `clasp push`
4. In GAS editor: run `createSheets()` (Init.gs) then `setApiKey()` (Auth.gs)
5. `clasp deploy` → copy URL into `frontend/js/config.js` `GAS_URL`
6. Copy API key into `frontend/js/config.js` `API_KEY`
7. Create GitHub repo → push code → enable GitHub Pages (Actions source)
