// tax.js — Thai personal income tax calculator

let childCount = 0;

const BRACKETS = [
  { limit: 150000,  rate: 0 },
  { limit: 300000,  rate: 0.05 },
  { limit: 500000,  rate: 0.10 },
  { limit: 750000,  rate: 0.15 },
  { limit: 1000000, rate: 0.20 },
  { limit: 2000000, rate: 0.25 },
  { limit: 5000000, rate: 0.30 },
  { limit: Infinity, rate: 0.35 },
];

function adjustChild(delta) {
  childCount = Math.max(0, Math.min(3, childCount + delta));
  document.getElementById('child-count').textContent = childCount;
  calcTax();
}

function v(id) { return parseFloat(document.getElementById(id)?.value) || 0; }

function fmt(n) {
  return '฿' + Math.round(n).toLocaleString('th-TH');
}

function calcTax() {
  const salary = v('t-salary');
  const other = v('t-other');
  if (salary + other <= 0) {
    document.getElementById('tax-result').classList.add('hidden');
    return;
  }

  const grossIncome = salary + other;

  // ── Deductible expenses ──────────────────────────────────────
  // Salary: 50% max 100,000
  const salaryDed = Math.min(salary * 0.5, 100000);
  // Other income: 40% max 60,000 (simplified)
  const otherDed = Math.min(other * 0.4, 60000);
  const totalExpenseDed = salaryDed + otherDed;

  // ── Allowances ────────────────────────────────────────────────
  const personalAllow = 60000;
  const socialSec = Math.min(salary * (750 / 15000), 9000); // 750/month
  const lifeIns = Math.min(v('t-life-ins') + v('t-health-ins'), 100000);
  const rmf = Math.min(v('t-rmf'), grossIncome * 0.30, 500000);
  const ssf = Math.min(v('t-ssf'), grossIncome * 0.30, 200000);
  const children = childCount * 30000;
  const homeInterest = Math.min(v('t-home-interest'), 100000);
  const donate = Math.min(v('t-donate') * 2, grossIncome * 0.10);

  const totalAllowance = personalAllow + socialSec + lifeIns + rmf + ssf + children + homeInterest + donate;
  const taxableIncome = Math.max(0, grossIncome - totalExpenseDed - totalAllowance);

  // ── Progressive tax ───────────────────────────────────────────
  let tax = 0;
  let prev = 0;
  for (const b of BRACKETS) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome - prev, b.limit - prev);
    tax += chunk * b.rate;
    prev = b.limit;
  }

  const effectiveRate = grossIncome > 0 ? (tax / grossIncome * 100) : 0;

  // ── Render result ─────────────────────────────────────────────
  document.getElementById('r-gross').textContent = fmt(grossIncome);
  document.getElementById('r-emp-ded').textContent = '−' + fmt(totalExpenseDed);
  document.getElementById('r-allow').textContent = '−' + fmt(totalAllowance);
  document.getElementById('r-taxable').textContent = fmt(taxableIncome);
  document.getElementById('r-tax').textContent = fmt(tax);
  document.getElementById('r-monthly').textContent = fmt(tax / 12) + '/เดือน';
  document.getElementById('r-effective').textContent = effectiveRate.toFixed(2) + '%';

  // Deduction breakdown
  const deductions = [
    { label: 'ลดหย่อนส่วนตัว', value: personalAllow },
    { label: 'ประกันสังคม', value: socialSec },
    { label: 'ประกันชีวิต/สุขภาพ', value: lifeIns },
    { label: 'กองทุน RMF', value: rmf },
    { label: 'กองทุน SSF', value: ssf },
    { label: 'ค่าลดหย่อนบุตร', value: children },
    { label: 'ดอกเบี้ยบ้าน', value: homeInterest },
    { label: 'เงินบริจาค (×2)', value: donate },
  ].filter(d => d.value > 0);

  document.getElementById('deduction-rows').innerHTML = deductions.map(d => `
    <div class="tax-row">
      <span style="color:var(--text-muted)">${d.label}</span>
      <span class="font-medium" style="color:var(--text)">฿${d.value.toLocaleString()}</span>
    </div>
  `).join('') + `
    <div class="tax-row" style="border:none">
      <span class="font-bold" style="color:var(--text)">รวมค่าลดหย่อน</span>
      <span class="font-bold" style="color:var(--primary)">฿${Math.round(totalAllowance).toLocaleString()}</span>
    </div>`;

  // Bracket visualization
  const BRACKET_LABELS = ['0-150K (0%)', '150-300K (5%)', '300-500K (10%)', '500-750K (15%)', '750K-1M (20%)', '1-2M (25%)', '2-5M (30%)', '5M+ (35%)'];
  let prev2 = 0;
  const bars = BRACKETS.map((b, i) => {
    const low = prev2;
    const high = b.limit === Infinity ? prev2 + 1 : b.limit;
    const chunk = Math.max(0, Math.min(taxableIncome - low, high - low));
    const taxFromBracket = chunk * b.rate;
    prev2 = high;
    if (low >= taxableIncome && b.rate > 0) return '';
    const pct = Math.round(b.rate * 100);
    const active = chunk > 0;
    return `
      <div class="flex items-center gap-2 mb-1.5">
        <div class="text-xs w-28 flex-shrink-0" style="color:${active ? 'var(--text)' : 'var(--text-sub)'}">${pct}%</div>
        <div class="flex-1 rounded-full h-2" style="background:var(--divider)">
          ${active ? `<div class="h-2 rounded-full" style="width:${Math.min(chunk / (taxableIncome || 1) * 100, 100)}%;background:var(--primary)"></div>` : ''}
        </div>
        <div class="text-xs w-20 text-right flex-shrink-0 font-medium" style="color:${active ? 'var(--primary)' : 'var(--text-sub)'}">
          ${active ? fmt(taxFromBracket) : '—'}
        </div>
      </div>`;
  }).join('');
  document.getElementById('bracket-bars').innerHTML = bars;

  document.getElementById('tax-result').classList.remove('hidden');
}
