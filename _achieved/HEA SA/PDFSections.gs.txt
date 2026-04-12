// HEA Solar Analyser — https://hea-group.com.au
// REC 37307 — Jesse Heffernan, Bendigo VIC

// PDFSections.gs — sub-builders for buildReportHTML
// Each function returns an HTML string fragment.
// Called by buildReportHTML() in PDFBuilder.gs.
// Separated so each section can be tested, tweaked, or toggled independently.

// ── Finance Summary Table ──
function pdfFinanceSummary(engineSummary) {
  const eng = engineSummary || {};
  if (!eng.NPV && !eng.undis_be) return '';
  const rows = [
    ['Year 0 Customer Outlay',   eng.cash_deposit != null ? '-$'+Math.round(eng.cash_deposit).toLocaleString() : 'Cash purchase', ''],
    ['Year 1 Net Cashflow',      eng.year1_ncf    != null ? '$'+Math.round(eng.year1_ncf).toLocaleString() : '—', ''],
    ['CF+ Year',                 eng.ann_cf_pos_yr ? 'Year '+eng.ann_cf_pos_yr : 'Not in period', ''],
    ['Break-Even (BEP)',         eng.undis_frac != null ? 'Year '+eng.undis_frac : '—', 'cumulative nominal NCF ≥ 0'],
    ['Discounted Payback (DPB)', eng.dis_frac   != null ? 'Year '+eng.dis_frac  : '—', 'cumulative DCF ≥ 0'],
    ['Net Present Value (NPV)',  eng.NPV != null ? '$'+Math.round(eng.NPV).toLocaleString() : '—',
      (eng.assumptions ? (eng.assumptions.discount_rate*100).toFixed(0)+'% discount rate' : '') + (eng.NPV >= 0 ? ' ✓' : ' ✗')],
    ['IRR',   eng.IRR  != null ? eng.IRR.toFixed(1)+'%'  : '—', 'internal rate of return'],
    ['MIRR',  eng.MIRR != null ? eng.MIRR.toFixed(1)+'%' : '—', 'modified IRR'],
    ['Loan finish',      eng.loan_finish_yr ? 'Year '+eng.loan_finish_yr : (eng.loan_amt > 0 ? '>25yr' : 'Cash'), ''],
    ['Inverter replace', eng.inv_repl_yr    ? 'Year '+eng.inv_repl_yr   : '—', ''],
    ['Battery replace',  eng.assumptions && eng.assumptions.bat_repl_yr ? 'Year '+eng.assumptions.bat_repl_yr : '—', ''],
  ].filter(r => r[1] && r[1] !== '—');
  let h = '<table width="100%" style="margin-bottom:14px;border-collapse:collapse"><tr><td colspan="3" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px">';
  h += '<div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:8px">Finance Summary — Customer Cashflow View</div>';
  h += '<table width="100%" style="border-collapse:collapse;font-size:10px">';
  rows.forEach((r, i) => {
    const bg   = i % 2 === 0 ? '#f9fafb' : '#fff';
    const bold = r[0].includes('BEP') || r[0].includes('NPV') ? 'font-weight:700' : '';
    h += `<tr style="background:${bg}"><td style="padding:5px 8px;color:#374151;${bold}">${r[0]}</td>`;
    h += `<td style="padding:5px 8px;text-align:right;font-weight:700;color:#111827">${r[1]}</td>`;
    h += `<td style="padding:5px 8px;color:#6b7280;font-size:9px">${r[2]}</td></tr>`;
  });
  h += '</table></td></tr></table>';
  return h;
}

// ── Assumptions Table ──
function pdfAssumptionBlock(engineSummary, supplyAnnual) {
  const a  = (engineSummary && engineSummary.assumptions) ? engineSummary.assumptions : {};
  const _s = parseFloat(supplyAnnual) || 380;
  return `<div style="margin:12px 0;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
    <div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:8px">Calculation Assumptions</div>
    <table style="width:100%;border-collapse:collapse;font-size:9px;color:#374151">
      <tr style="background:#f9fafb">
        <td style="padding:4px 6px">Discount rate</td><td style="padding:4px 6px;text-align:right;font-weight:700">${((a.discount_rate||0.07)*100).toFixed(0)}%</td>
        <td style="padding:4px 6px;font-weight:700">Tariff esc</td><td style="padding:4px 6px;text-align:right">${((a.import_esc||0.03)*100).toFixed(1)}%/yr</td>
      </tr>
      <tr>
        <td style="padding:4px 6px">Panel degradation</td><td style="padding:4px 6px;text-align:right;font-weight:700">${((a.pv_degradation||0.005)*100).toFixed(1)}%/yr</td>
        <td style="padding:4px 6px;font-weight:700">Battery degradation</td><td style="padding:4px 6px;text-align:right">${((a.bat_deg||0.025)*100).toFixed(1)}%/yr</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:4px 6px">Annual maintenance</td><td style="padding:4px 6px;text-align:right;font-weight:700">$${(a.maint_yr1||150).toLocaleString()}/yr</td>
        <td style="padding:4px 6px;font-weight:700">Supply charge</td><td style="padding:4px 6px;text-align:right">$${_s.toLocaleString()}/yr</td>
      </tr>
      <tr>
        <td style="padding:4px 6px">Inverter replacement</td><td style="padding:4px 6px;text-align:right;font-weight:700">Yr ${a.inv_repl_yr||15} @ ${((a.inv_repl_frac||0.20)*100).toFixed(0)}%</td>
        <td style="padding:4px 6px;font-weight:700">Battery replacement</td><td style="padding:4px 6px;text-align:right">Yr ${a.bat_repl_yr||12} @ ${((a.bat_repl_frac||0.60)*100).toFixed(0)}%</td>
      </tr>
      <tr style="background:#f9fafb">
        <td style="padding:4px 6px">Analysis period</td><td style="padding:4px 6px;text-align:right;font-weight:700">${a.analysis_years||25} yrs</td>
        <td style="padding:4px 6px;font-weight:700">Model</td><td style="padding:4px 6px;text-align:right">Customer Cashflow View</td>
      </tr>
    </table>
    <div style="font-size:8px;color:#9ca3af;margin-top:6px">
      Assumption sources: <strong>measured</strong> = from NEM12 data &nbsp;|&nbsp;
      <strong>market default</strong> = published benchmark (AER, IEC, manufacturer) &nbsp;|&nbsp;
      <strong>HEA commercial</strong> = internal pricing assumption
    </div>
  </div>`;
}

// ── Risks & Exclusions ──
function pdfRisksBlock() {
  return `<div style="margin-bottom:12px;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;">
    <div style="font-weight:800;font-size:11px;color:#111827;margin-bottom:6px">Important Notes &amp; Exclusions</div>
    <div style="font-size:8px;color:#374151;line-height:1.7">
      &bull; Solar yield based on actual NEM12 interval data and BOM irradiance for nominated zone. Generation varies with weather, shading, and equipment tolerances.<br>
      &bull; Usage patterns may change. Tariffs, feed-in rates, and rebates are subject to change without notice.<br>
      &bull; Replacement timing is estimated. Actual cost and timing may differ.<br>
      &bull; Projections use assumptions stated above. This proposal is not financial advice. Independent advice is recommended for investment decisions.<br>
      &bull; Warranties subject to manufacturer terms and conditions.
    </div>
  </div>`;
}

// ── Audit Footer ──
function pdfAuditFooter(engineSummary, result, quoteNo, dateS) {
  const nem = (result && result.nem12Validation) ? result.nem12Validation : {};
  return `<div style="font-size:7px;color:#9ca3af;text-align:center;margin-top:6px">
    Engine: ${APP_VERSION} &nbsp;&middot;&nbsp; Model: Customer Cashflow View (ICF0 = -Deposit)
    &nbsp;&middot;&nbsp; NEM12: ${nem.chosen_channel||'default'}, ${nem.days_accepted||0} days
    &nbsp;&middot;&nbsp; ${quoteNo} &nbsp;&middot;&nbsp; Generated: ${dateS}
  </div>`;
}
