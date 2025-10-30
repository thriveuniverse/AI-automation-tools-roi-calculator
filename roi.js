/**
 * roi.js
 *
 * A dependency-free ES module for calculating Automation ROI metrics.
 * Contains pure functions for validation, computation, and formatting.
 */

// --- JSDoc Type Definitions ---

/**
 * @typedef {object} RoiInputs
 * @description The set of inputs required for the ROI calculation.
 * @property {number} wageEurPerHour - €/hour
 * @property {number} hoursSavedPerUnit - hours saved per unit of work
 * @property {number} unitsPerMonth - workload volume per month
 * @property {number} baselineErrorsPerMonth - count of errors per month before automation
 * @property {number} errorReductionPct - % of baseline errors avoided [0..100]
 * @property {number} costPerErrorEur - € cost per error
 * @property {number} oneTimeCostEur - € one-time setup/implementation
 * @property {number} monthlyRecurringCostEur - € ongoing subscription/maintenance
 */

/**
 * @typedef {object} RoiOutputs
 * @description The set of computed ROI metrics.
 * @property {number} laborSavingsMonthly - Monthly savings from reduced labor
 * @property {number} errorSavingsMonthly - Monthly savings from error reduction
 * @property {number} grossBenefitMonthly - Total monthly savings (labor + error)
 * @property {number} netBenefitMonthly - Monthly benefit after recurring costs
 * @property {number} annualGrossBenefit - Total annual savings (before costs)
 * @property {number} annualTotalCost - Total annual cost (one-time + recurring)
 * @property {number} annualNetBenefit - Net annual benefit (Year 1)
 * @property {number} roi - Return on Investment (Year 1) as a decimal (e.g., 0.42)
 * @property {number} paybackMonths - Time to recoup one-time cost (can be Infinity)
 * @property {number} annualizedBenefitEur - Same as annualNetBenefit
 */

// --- Configuration ---

/**
 * Default locale for number formatting.
 * Change to 'en-US' for English formatting or other locales as needed.
 */
const DEFAULT_LOCALE = 'de-DE';

// --- Validation ---

/**
 * Validates the input object for correct types and ranges.
 * @param {Partial<RoiInputs>} i - The partial or complete input object.
 * @returns {{ok: boolean, errors: Record<string, string>}} - Validation result.
 */
export function validateInputs(i) {
  const errors = {};
  const fields = [
    'wageEurPerHour', 'hoursSavedPerUnit', 'unitsPerMonth',
    'baselineErrorsPerMonth', 'errorReductionPct', 'costPerErrorEur',
    'oneTimeCostEur', 'monthlyRecurringCostEur'
  ];

  for (const field of fields) {
    const value = i[field];
    if (value === null || value === undefined) {
      errors[field] = 'is required.';
    } else if (typeof value !== 'number') {
      errors[field] = 'must be a number.';
    } else if (Number.isNaN(value)) {
      errors[field] = 'cannot be NaN.';
    } else if (value < 0) {
      errors[field] = 'cannot be negative.';
    }
  }

  if (typeof i.errorReductionPct === 'number' && !Number.isNaN(i.errorReductionPct) && i.errorReductionPct >= 0) {
    if (i.errorReductionPct > 100) {
      errors.errorReductionPct = 'must be between 0 and 100.';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

// --- Computation ---

function sanitize(i) {
  return {
    wageEurPerHour: Math.max(0, i.wageEurPerHour || 0),
    hoursSavedPerUnit: Math.max(0, i.hoursSavedPerUnit || 0),
    unitsPerMonth: Math.max(0, i.unitsPerMonth || 0),
    baselineErrorsPerMonth: Math.max(0, i.baselineErrorsPerMonth || 0),
    errorReductionPct: Math.max(0, Math.min(100, i.errorReductionPct || 0)),
    costPerErrorEur: Math.max(0, i.costPerErrorEur || 0),
    oneTimeCostEur: Math.max(0, i.oneTimeCostEur || 0),
    monthlyRecurringCostEur: Math.max(0, i.monthlyRecurringCostEur || 0),
  };
}

export function compute(inputs) {
  const i = sanitize(inputs);

  const laborSavingsMonthly = i.unitsPerMonth * i.hoursSavedPerUnit * i.wageEurPerHour;
  const errorSavingsMonthly = i.baselineErrorsPerMonth * (i.errorReductionPct / 100) * i.costPerErrorEur;
  const grossBenefitMonthly = laborSavingsMonthly + errorSavingsMonthly;
  const netBenefitMonthly = grossBenefitMonthly - i.monthlyRecurringCostEur;
  const annualGrossBenefit = 12 * grossBenefitMonthly;
  const annualTotalCost = i.oneTimeCostEur + (12 * i.monthlyRecurringCostEur);
  const annualNetBenefit = annualGrossBenefit - annualTotalCost;
  const roi = (annualTotalCost > 0) ? (annualNetBenefit / annualTotalCost) : Infinity;
  const paybackMonths = (netBenefitMonthly > 0) ? (i.oneTimeCostEur / netBenefitMonthly) : Infinity;
  const annualizedBenefitEur = annualNetBenefit;

  return {
    laborSavingsMonthly,
    errorSavingsMonthly,
    grossBenefitMonthly,
    netBenefitMonthly,
    annualGrossBenefit,
    annualTotalCost,
    annualNetBenefit,
    roi,
    paybackMonths,
    annualizedBenefitEur
  };
}

export const formatters = {
  toMoney: (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '€--';
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  },
  toPct: (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return '--%';
    if (!Number.isFinite(value)) return value > 0 ? '∞%' : '-∞%';
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
  toMonths: (value) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value === Infinity || value < 0) {
      return 'No payback';
    }
    const rounded = Math.round(value * 10) / 10;
    return `${rounded} months`;
  }
};
