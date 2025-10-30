# Automation ROI Calculator

A single-page calculator that helps teams estimate the financial impact of automation initiatives. Enter a few baseline metrics, and the tool instantly computes savings, ROI, and payback period.

## Getting started

1. Clone or download this repository.
2. Open `automation-roi-calculator/index.html` directly in a modern browser **or** serve the folder through any static file server.
3. Adjust the inputs to match your scenario and review the results panel.

No build step or external dependencies are required.

## Inputs

| Field | Description |
| --- | --- |
| Average wage (€/hour) | Fully loaded hourly cost of the team members currently doing the work. |
| Hours saved per unit | Time the automation saves for every unit of work. |
| Units per month | Expected monthly volume of work handled by the automation. |
| Baseline errors per month | Typical monthly number of mistakes before automation. |
| Error reduction (%) | Percentage of baseline errors that automation will prevent. |
| Cost per error (€) | Estimated cost to remediate each mistake. |
| One-time cost (€) | Upfront implementation and enablement investment. |
| Monthly recurring cost (€) | Ongoing subscription, support, or maintenance fee. |

## Outputs & formulas

All monetary values are shown in euros with thousands separators.

| Output | Formula |
| --- | --- |
| Labor savings (monthly) | `unitsPerMonth × hoursSavedPerUnit × wageEurPerHour` |
| Error savings (monthly) | `baselineErrorsPerMonth × (errorReductionPct ÷ 100) × costPerErrorEur` |
| Gross benefit (monthly) | `laborSavingsMonthly + errorSavingsMonthly` |
| Net benefit (monthly) | `grossBenefitMonthly - monthlyRecurringCostEur` |
| Annual gross benefit | `grossBenefitMonthly × 12` |
| Annual total cost | `oneTimeCostEur + (monthlyRecurringCostEur × 12)` |
| Annual net benefit | `annualGrossBenefit - annualTotalCost` |
| ROI (Year 1) | `annualNetBenefit ÷ annualTotalCost` (returns ∞ when total cost is 0) |
| Payback period | `oneTimeCostEur ÷ netBenefitMonthly` (reported as “No payback” if net benefit ≤ 0) |
| Annualized benefit | Equal to annual net benefit |

## Accessibility

Every input has an associated `<label>`, helper text, and inline error messaging. The form is keyboard accessible, and live regions announce result updates for assistive technologies.

## FAQ

**Can I use different currencies?**  
Yes. Adjust the labels and display formatting as needed; the math remains the same.

**Why does ROI show “∞%”?**  
If the total cost is zero, the return on investment is mathematically infinite. The tool surfaces that using the infinity symbol.

**How accurate are the results?**  
The calculator provides directional estimates based on the inputs you supply. Validate the assumptions before using the figures in financial planning.

## License

TBD