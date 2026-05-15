// config.js — Replace these values after deploying GAS

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyw9LWb2ElxbkjnRfZ3IHcCPoSDPqOGz1_R2sQQ7HsjqZy7DgAem1nMp6mrPD7ycClI/exec';
const API_KEY = '3080759533cd0cdc02401db6803306168f874e4772ada356';

const LANG = {
  th: {
    dashboard: 'ภาพรวม',
    cashflow: 'กระแสเงินสด',
    transactions: 'รายการ',
    assets: 'ทรัพย์สิน',
    goals: 'เป้าหมาย',
    income: 'รายรับ',
    expense: 'รายจ่าย',
    salary: 'เงินเดือน',
    passive: 'รายได้ passive',
    portfolio: 'รายได้ portfolio',
    totalIncome: 'รายรับรวม',
    totalExpenses: 'รายจ่ายรวม',
    monthlyCashflow: 'กระแสเงินสดรายเดือน',
    netWorth: 'มูลค่าสุทธิ',
    totalAssets: 'ทรัพย์สินรวม',
    totalLiabilities: 'หนี้สินรวม',
    freedomMeter: 'วัดอิสรภาพทางการเงิน',
    ratRace: 'RAT RACE 🐀',
    fastTrack: 'FAST TRACK 🚀',
    financialFreedom: 'อิสรภาพทางการเงิน',
    addNew: 'เพิ่มใหม่',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    baht: '฿',
    currency: 'THB'
  },
  en: {
    dashboard: 'Dashboard',
    cashflow: 'Cashflow',
    transactions: 'Transactions',
    assets: 'Assets',
    goals: 'Goals',
    income: 'Income',
    expense: 'Expense',
    salary: 'Salary',
    passive: 'Passive Income',
    portfolio: 'Portfolio Income',
    totalIncome: 'Total Income',
    totalExpenses: 'Total Expenses',
    monthlyCashflow: 'Monthly Cashflow',
    netWorth: 'Net Worth',
    totalAssets: 'Total Assets',
    totalLiabilities: 'Total Liabilities',
    freedomMeter: 'Freedom Meter',
    ratRace: 'RAT RACE 🐀',
    fastTrack: 'FAST TRACK 🚀',
    financialFreedom: 'Financial Freedom',
    addNew: 'Add New',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    baht: '฿',
    currency: 'THB'
  }
};

let currentLang = localStorage.getItem('lang') || 'th';
function t(key) { return (LANG[currentLang] || LANG.th)[key] || key; }
function toggleLang() {
  currentLang = currentLang === 'th' ? 'en' : 'th';
  localStorage.setItem('lang', currentLang);
  location.reload();
}

function formatMoney(n) {
  const num = parseFloat(n) || 0;
  return '฿' + num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
