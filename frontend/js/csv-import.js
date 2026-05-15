// csv-import.js — Bank statement CSV import

let _csvRows = [];
let _csvStep = 1;
let _csvRawText = '';

// ── CSV Parsing ───────────────────────────────────────────────

function splitCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  const sep = line.includes('\t') ? '\t' : ',';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === sep && !inQuote) { result.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim().replace(/^"|"$/g, ''));
  return result;
}

function parseCsvText(text) {
  text = text.replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  const DATE_HINT   = /date|วันที่|วนท|วัน/i;
  const AMOUNT_HINT = /amount|debit|credit|จำนวน|ถอน|ฝาก|withdraw|deposit/i;

  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.length < 2) continue;
    const joined = cells.join(' ');
    if (DATE_HINT.test(joined) || AMOUNT_HINT.test(joined)) { headerIdx = i; break; }
  }

  const headers = splitCsvLine(lines[headerIdx]).map(h => h.replace(/^"|"$/g, '').trim());
  return { headers, dataLines: lines.slice(headerIdx + 1) };
}

function autoDetectCols(headers) {
  const find = (re) => { const i = headers.findIndex(h => re.test(h)); return i >= 0 ? i : null; };
  return {
    date:   find(/date|วันที่|วนท|transaction.*date/i),
    desc:   find(/desc|detail|remark|narrat|รายการ|รายละเอียด|หมายเหตุ/i),
    debit:  find(/debit|withdraw|ถอน|จ่าย|รายจ่าย/i),
    credit: find(/credit|deposit|ฝาก|รับ|รายรับ/i),
    amount: find(/^amount$|^จำนวนเงิน$|^จำนวน$|^amt$/i),
  };
}

function parseAmount(str) {
  if (!str && str !== 0) return 0;
  return parseFloat(String(str).replace(/,/g, '').replace(/[฿$\s]/g, '')) || 0;
}

function parseThaiDate(str) {
  if (!str) return '';
  str = String(str).trim().replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    let y = parseInt(m[3]);
    if (y > 2400) y -= 543;
    return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  return str;
}

function buildTransactions(dataLines, headers, colMap, defaults) {
  const txs = [];
  dataLines.forEach(line => {
    if (!line.trim()) return;
    const cells = splitCsvLine(line);
    const get = (idx) => (idx !== null && idx !== undefined) ? (cells[idx] || '') : '';

    const dateStr = parseThaiDate(get(colMap.date));
    const desc    = get(colMap.desc);
    let amount = 0, type = 'expense';

    if (colMap.debit !== null && colMap.credit !== null) {
      const debit  = parseAmount(get(colMap.debit));
      const credit = parseAmount(get(colMap.credit));
      if (credit > 0)     { amount = credit; type = 'income'; }
      else if (debit > 0) { amount = debit;  type = 'expense'; }
      else return;
    } else if (colMap.amount !== null) {
      const raw = parseAmount(get(colMap.amount));
      if (raw === 0) return;
      if (raw < 0) { amount = Math.abs(raw); type = 'expense'; }
      else         { amount = raw;            type = 'income'; }
    } else { return; }

    txs.push({
      date: dateStr,
      type,
      category: type === 'income' ? 'รายได้อื่นๆ' : (defaults.category || 'อื่นๆ'),
      amount,
      description: desc,
      wallet: defaults.wallet || 'personal',
      account_id: '',
    });
  });
  return txs;
}

// ── Modal UI ──────────────────────────────────────────────────

function openCsvImport() {
  _csvRows = []; _csvStep = 1; _csvRawText = '';
  document.getElementById('csv-file').value = '';
  document.getElementById('csv-paste').value = '';
  document.getElementById('csv-step1').classList.remove('hidden');
  document.getElementById('csv-step2').classList.add('hidden');
  renderCsvFooter();
  document.getElementById('csv-modal').classList.remove('hidden');
}

function closeCsvModal() {
  document.getElementById('csv-modal').classList.add('hidden');
}

function onCsvFileSelect(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('csv-paste').value = e.target.result; };
  reader.readAsText(file, 'UTF-8');
}

function downloadCsvTemplate() {
  const csv = 'date,description,debit,credit\n2025-01-05,ค่าอาหาร,250,\n2025-01-05,เงินเดือน,,30000\n2025-01-10,ค่าน้ำมัน,500,\n2025-01-15,ค่าบ้าน,8000,\n';
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'meen-template.csv' });
  a.click(); URL.revokeObjectURL(url);
}

function processCsvStep1() {
  const text = document.getElementById('csv-paste').value.trim();
  if (!text) { alert('กรุณาวาง CSV หรือเลือกไฟล์ก่อน'); return; }
  _csvRawText = text;
  reprocessCsv();
  if (!_csvRows.length) { alert('ไม่พบรายการในไฟล์\nกรุณาตรวจสอบรูปแบบ CSV'); return; }
  _csvStep = 2;
  document.getElementById('csv-step1').classList.add('hidden');
  document.getElementById('csv-step2').classList.remove('hidden');
  renderCsvFooter();
}

function reprocessCsv() {
  if (!_csvRawText) return;
  const { headers, dataLines } = parseCsvText(_csvRawText);
  const colMap = autoDetectCols(headers);
  const defaults = {
    category: document.getElementById('csv-cat').value || 'อื่นๆ',
    wallet:   document.getElementById('csv-wallet').value || 'personal',
  };
  _csvRows = buildTransactions(dataLines, headers, colMap, defaults);

  const fmt = [];
  if (colMap.debit !== null && colMap.credit !== null) fmt.push('Bank Statement (Debit/Credit)');
  else if (colMap.amount !== null) fmt.push('Single Amount Column');
  else fmt.push('ไม่พบคอลัมน์จำนวนเงิน');
  if (colMap.date !== null) fmt.push(`วันที่: "${headers[colMap.date]}"`);
  const info = document.getElementById('csv-detect-info');
  if (info) info.innerHTML = `<i class="fas fa-info-circle mr-1" style="color:var(--primary)"></i><strong>ตรวจพบ:</strong> ${fmt.join(' · ')}`;

  renderCsvPreview(_csvRows.slice(0, 5));
  const cnt = document.getElementById('csv-count');
  if (cnt) cnt.textContent = `พบ ${_csvRows.length} รายการ`;
  const btn = document.getElementById('csv-import-btn');
  if (btn) btn.textContent = `นำเข้า ${_csvRows.length} รายการ`;
}

function renderCsvPreview(rows) {
  const el = document.getElementById('csv-preview');
  if (!el) return;
  if (!rows.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs" style="min-width:340px">
        <thead>
          <tr style="background:var(--divider)">
            <th class="px-3 py-2 font-semibold" style="color:var(--text-sub)">วันที่</th>
            <th class="px-3 py-2 font-semibold" style="color:var(--text-sub)">รายละเอียด</th>
            <th class="px-3 py-2 font-semibold" style="color:var(--text-sub)">ประเภท</th>
            <th class="px-3 py-2 font-semibold text-right" style="color:var(--text-sub)">จำนวน</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(tx => `
            <tr class="border-t" style="border-color:var(--divider)">
              <td class="px-3 py-2" style="color:var(--text)">${tx.date || '—'}</td>
              <td class="px-3 py-2" style="color:var(--text-muted);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${tx.description}">${tx.description || '—'}</td>
              <td class="px-3 py-2">
                <span class="px-2 py-0.5 rounded-full font-medium ${tx.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}">${tx.type === 'income' ? 'รายรับ' : 'รายจ่าย'}</span>
              </td>
              <td class="px-3 py-2 text-right font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}">${formatMoney(tx.amount)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function backToCsvStep1() {
  _csvStep = 1;
  document.getElementById('csv-step2').classList.add('hidden');
  document.getElementById('csv-step1').classList.remove('hidden');
  renderCsvFooter();
}

function renderCsvFooter() {
  const footer = document.getElementById('csv-footer');
  if (_csvStep === 1) {
    footer.innerHTML = `<button onclick="processCsvStep1()" style="background-color:var(--primary)">ถัดไป →</button>`;
  } else {
    footer.innerHTML = `
      <button onclick="backToCsvStep1()" class="flex-1" style="background:var(--bg);color:var(--text);border:1px solid var(--divider);border-radius:0.75rem;padding:0.875rem;font-weight:600">← ย้อนกลับ</button>
      <button id="csv-import-btn" onclick="doImport()" class="flex-1" style="background-color:var(--primary)">นำเข้า ${_csvRows.length} รายการ</button>`;
  }
}

async function doImport() {
  if (!_csvRows.length) return;
  const btn = document.getElementById('csv-import-btn');
  btn.disabled = true;

  const CHUNK = 30;
  let inserted = 0;
  try {
    for (let i = 0; i < _csvRows.length; i += CHUNK) {
      const chunk = _csvRows.slice(i, i + CHUNK);
      btn.textContent = `กำลังนำเข้า ${Math.min(i + CHUNK, _csvRows.length)}/${_csvRows.length}...`;
      const res = await API.addTransactionsBatch({ transactions: chunk });
      inserted += res.inserted || chunk.length;
    }
    closeCsvModal();
    loadTransactions();
    showCsvToast(`นำเข้าสำเร็จ ${inserted} รายการ`);
  } catch (e) {
    alert('นำเข้าไม่สำเร็จ: ' + e.message);
    btn.disabled = false;
    btn.textContent = `นำเข้า ${_csvRows.length} รายการ`;
  }
}

function showCsvToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#22c55e;color:white;padding:10px 20px;border-radius:100px;font-size:14px;font-weight:600;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,.2);white-space:nowrap';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
