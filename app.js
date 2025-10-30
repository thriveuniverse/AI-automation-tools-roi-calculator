import * as ROI from './roi.js';

const fieldIds = [
  'wageEurPerHour',
  'hoursSavedPerUnit',
  'unitsPerMonth',
  'baselineErrorsPerMonth',
  'errorReductionPct',
  'costPerErrorEur',
  'oneTimeCostEur',
  'monthlyRecurringCostEur'
];

const exampleDefaults = {
  wageEurPerHour: 35,
  hoursSavedPerUnit: 0.25,
  unitsPerMonth: 1200,
  baselineErrorsPerMonth: 60,
  errorReductionPct: 40,
  costPerErrorEur: 25,
  oneTimeCostEur: 8000,
  monthlyRecurringCostEur: 400
};

const inputEls = {};
const errorEls = {};
const resultEls = {
  laborSavingsMonthly: document.getElementById('laborSavingsMonthly'),
  errorSavingsMonthly: document.getElementById('errorSavingsMonthly'),
  grossBenefitMonthly: document.getElementById('grossBenefitMonthly'),
  netBenefitMonthly: document.getElementById('netBenefitMonthly'),
  annualGrossBenefit: document.getElementById('annualGrossBenefit'),
  annualTotalCost: document.getElementById('annualTotalCost'),
  annualNetBenefit: document.getElementById('annualNetBenefit'),
  roiPct: document.getElementById('roiPct'),
  paybackMonths: document.getElementById('paybackMonths'),
  annualizedBenefitEur: document.getElementById('annualizedBenefitEur')
};

const resultsStatus = document.getElementById('results-status');
const resultsGrid = document.querySelector('.results-grid');
const downloadBtn = document.getElementById('download-csv');
const resetBtn = document.getElementById('reset-example');
const form = document.getElementById('roi-form');

let lastSnapshot = null;

function setupFields() {
  fieldIds.forEach((id) => {
    const input = document.getElementById(id);
    const error = document.getElementById(`${id}-error`);
    if (!input || !error) return;
    inputEls[id] = input;
    errorEls[id] = error;

    input.addEventListener('input', () => {
      clampInputValue(id);
      update();
    });

    input.addEventListener('blur', () => {
      clampInputValue(id);
      update();
    });
  });
}

function clampInputValue(id) {
  const input = inputEls[id];
  if (!input) return;
  const raw = input.value.trim();
  if (raw === '') {
    return;
  }
  let value = Number(raw);
  if (Number.isNaN(value)) {
    return;
  }
  if (value < 0) {
    value = 0;
  }
  if (id === 'errorReductionPct') {
    value = Math.min(100, Math.max(0, value));
  }
  if (value !== Number(raw)) {
    input.value = String(value);
  }
}

function clearErrors() {
  fieldIds.forEach((id) => {
    if (errorEls[id]) {
      errorEls[id].textContent = '';
    }
  });
}

function getInputValues() {
  const values = {};
  let hasParsingErrors = false;

  fieldIds.forEach((id) => {
    const input = inputEls[id];
    const error = errorEls[id];
    if (!input || !error) return;
    const raw = input.value.trim();
    if (raw === '') {
      error.textContent = 'This field is required.';
      hasParsingErrors = true;
      return;
    }
    const numberValue = Number(raw);
    if (Number.isNaN(numberValue)) {
      error.textContent = 'Enter a valid number.';
      hasParsingErrors = true;
      return;
    }
    values[id] = numberValue;
  });

  return { values, hasParsingErrors };
}

function disableResults(message) {
  resultsGrid.classList.add('is-disabled');
  resultsStatus.textContent = message;
  resultEls.laborSavingsMonthly.textContent = '€--';
  resultEls.errorSavingsMonthly.textContent = '€--';
  resultEls.grossBenefitMonthly.textContent = '€--';
  resultEls.netBenefitMonthly.textContent = '€--';
  resultEls.annualGrossBenefit.textContent = '€--';
  resultEls.annualTotalCost.textContent = '€--';
  resultEls.annualNetBenefit.textContent = '€--';
  resultEls.roiPct.textContent = '--%';
  resultEls.paybackMonths.textContent = 'No payback';
  resultEls.annualizedBenefitEur.textContent = '€--';
  downloadBtn.disabled = true;
  lastSnapshot = null;
}

function renderResults(values, outputs) {
  resultsGrid.classList.remove('is-disabled');
  resultEls.laborSavingsMonthly.textContent = ROI.formatters.toMoney(outputs.laborSavingsMonthly);
  resultEls.errorSavingsMonthly.textContent = ROI.formatters.toMoney(outputs.errorSavingsMonthly);
  resultEls.grossBenefitMonthly.textContent = ROI.formatters.toMoney(outputs.grossBenefitMonthly);
  resultEls.netBenefitMonthly.textContent = ROI.formatters.toMoney(outputs.netBenefitMonthly);
  resultEls.annualGrossBenefit.textContent = ROI.formatters.toMoney(outputs.annualGrossBenefit);
  resultEls.annualTotalCost.textContent = ROI.formatters.toMoney(outputs.annualTotalCost);
  resultEls.annualNetBenefit.textContent = ROI.formatters.toMoney(outputs.annualNetBenefit);
  resultEls.roiPct.textContent = ROI.formatters.toPct(outputs.roi);
  resultEls.paybackMonths.textContent = ROI.formatters.toMonths(outputs.paybackMonths);
  resultEls.annualizedBenefitEur.textContent = ROI.formatters.toMoney(outputs.annualizedBenefitEur);
  resultsStatus.textContent = 'Results updated. All inputs are valid.';
  downloadBtn.disabled = false;
  lastSnapshot = { inputs: { ...values }, outputs };
}

function update() {
  clearErrors();
  const { values, hasParsingErrors } = getInputValues();

  if (hasParsingErrors) {
    disableResults('Please complete all required fields with valid numbers.');
    return;
  }

  const validation = ROI.validateInputs(values);
  if (!validation.ok) {
    Object.entries(validation.errors).forEach(([field, message]) => {
      if (errorEls[field]) {
        errorEls[field].textContent = `Value ${message}`;
      }
    });
    disableResults('Please correct the highlighted fields.');
    return;
  }

  const outputs = ROI.compute(values);
  renderResults(values, outputs);
}

function setDefaults() {
  fieldIds.forEach((id) => {
    if (inputEls[id]) {
      inputEls[id].value = String(exampleDefaults[id] ?? '');
    }
  });
}

function downloadCsv() {
  if (!lastSnapshot) {
    return;
  }
  const { inputs, outputs } = lastSnapshot;
  const rows = [['Type', 'Metric', 'Value']];
  Object.entries(inputs).forEach(([key, value]) => {
    rows.push(['Input', key, String(value)]);
  });
  Object.entries(outputs).forEach(([key, value]) => {
    rows.push(['Output', key, String(value)]);
  });

  const csvContent = rows
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `automation-roi-${timestamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvValue(value) {
  if (value == null) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function init() {
  setupFields();
  setDefaults();
  update();
  form.addEventListener('submit', (event) => event.preventDefault());
  resetBtn.addEventListener('click', () => {
    setDefaults();
    update();
    inputEls.wageEurPerHour.focus();
  });
  downloadBtn.addEventListener('click', downloadCsv);
}

init();