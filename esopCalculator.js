/**
 * ESOP Buyback Benefit Calculator for Indian Tax Regulations
 * 
 * This calculator helps employees understand the financial benefits of an ESOP buyback,
 * including tax implications under Indian regulations for both scenarios:
 * 1. When options are already exercised and then sold in buyback
 * 2. When options are not yet exercised (transferred directly in buyback)
 */

// Tax rates as per Indian regulations (for FY 2025-26)
const TAX_RATES = {
  // For perquisite tax (at the time of exercise)
  PERQUISITE_TAX_RATE: 0.3, // 30% flat rate for perquisite tax
  
  // For capital gains
  SHORT_TERM_CAPITAL_GAINS: 0.3, // 30% for shares held less than 24 months
  LONG_TERM_CAPITAL_GAINS: 0.1, // 10% for shares held more than 24 months
  
  // Surcharges and cess can vary based on income level
  SURCHARGE_RATE: 0.1, // 10% surcharge for income > 50 lacs
  CESS_RATE: 0.04, // 4% health and education cess
};

// Default USD to INR conversion rate as of May 2025
const DEFAULT_USD_TO_INR_RATE = 83.50;

// Selling caps
const SELLING_CAPS = {
  MAX_AMOUNT_INR: 10000000, // 1 crore INR cap
  CURRENT_EMPLOYEE_PERCENT: 25, // 25% for current employees
  EX_EMPLOYEE_PERCENT: 12.5 // 12.5% for ex-employees
};

/**
 * Calculate the number of sellable units based on various constraints
 * 
 * @param {number} units - Total number of ESOP units
 * @param {number} percentSellable - User-defined percentage of units that can be sold (0-100)
 * @param {boolean} isCurrentEmployee - Whether the person is a current employee or ex-employee
 * @param {number} buybackPrice - Price per unit in INR
 * @return {object} Object containing sellable units and the limiting factor
 */
function calculateSellableUnits(units, percentSellable, isCurrentEmployee, buybackPrice) {
  // 1. Calculate based on user-defined percentage
  const userDefinedUnits = Math.floor(units * (percentSellable / 100));
  
  // 2. Calculate based on employment status
  const maxPercentByStatus = isCurrentEmployee ? SELLING_CAPS.CURRENT_EMPLOYEE_PERCENT : SELLING_CAPS.EX_EMPLOYEE_PERCENT;
  const statusLimitedUnits = Math.floor(units * (maxPercentByStatus / 100));
  
  // 3. Calculate based on monetary cap (1 crore INR)
  const monetaryCappedUnits = Math.floor(SELLING_CAPS.MAX_AMOUNT_INR / buybackPrice);
  
  // 4. Find the most restrictive constraint
  const sellableUnits = Math.min(userDefinedUnits, statusLimitedUnits, monetaryCappedUnits, units);
  
  // Determine the limiting factor
  let limitingFactor;
  if (sellableUnits === userDefinedUnits) {
    limitingFactor = "User-defined percentage";
  } else if (sellableUnits === statusLimitedUnits) {
    limitingFactor = isCurrentEmployee ? "Current employee limit (25%)" : "Ex-employee limit (12.5%)";
  } else if (sellableUnits === monetaryCappedUnits) {
    limitingFactor = "Monetary cap (1 crore INR)";
  } else {
    limitingFactor = "Total available units";
  }
  
  return {
    sellableUnits,
    limitingFactor
  };
}

/**
 * Calculate benefits when employee has already exercised the ESOPs and then participates in buyback
 * 
 * @param {number} units - Number of ESOP units
 * @param {number} exercisePrice - Price at which ESOPs were exercised (per unit in USD)
 * @param {number} fairMarketValue - Fair Market Value at the time of exercise (per unit in USD)
 * @param {number} buybackPrice - Price offered during buyback (per unit in USD)
 * @param {boolean} isLongTerm - Whether shares were held for more than 24 months (for capital gains calculation)
 * @param {number} percentSellable - User's percentage of units that can be sold in the buyback (0-100)
 * @param {boolean} isCurrentEmployee - Whether the person is a current employee or ex-employee
 * @param {number} usdToInrRate - USD to INR conversion rate
 * @return {object} Detailed breakdown of benefits and taxes
 */
function calculateBenefitsWhenExercisedAlready(units, exercisePrice, fairMarketValue, buybackPrice, isLongTerm = false, 
                                              percentSellable = 100, isCurrentEmployee = true, usdToInrRate = DEFAULT_USD_TO_INR_RATE) {
  // Convert USD prices to INR
  const exercisePriceInr = exercisePrice * usdToInrRate;
  const fairMarketValueInr = fairMarketValue * usdToInrRate;
  const buybackPriceInr = buybackPrice * usdToInrRate;
  
  // Calculate sellable and non-sellable units with all constraints
  const sellableInfo = calculateSellableUnits(units, percentSellable, isCurrentEmployee, buybackPriceInr);
  const sellableUnits = sellableInfo.sellableUnits;
  const limitingFactor = sellableInfo.limitingFactor;
  const nonSellableUnits = units - sellableUnits;
  
  // 1. Calculate the cost of exercise (for all units)
  const exerciseCost = units * exercisePriceInr;
  
  // 2. Calculate perquisite value (FMV - Exercise Price) at the time of exercise (for all units)
  const perquisiteValue = (fairMarketValueInr - exercisePriceInr) * units;
  
  // 3. Calculate perquisite tax
  const perquisiteTaxRate = TAX_RATES.PERQUISITE_TAX_RATE + 
                          (TAX_RATES.PERQUISITE_TAX_RATE * TAX_RATES.SURCHARGE_RATE) +
                          TAX_RATES.CESS_RATE;
  const perquisiteTax = perquisiteValue * perquisiteTaxRate;
  
  // 4. Calculate total cost of acquisition (Exercise cost + Perquisite tax)
  const totalAcquisitionCost = exerciseCost + perquisiteTax;
  
  // 5. Calculate buyback amount (only for sellable units)
  const buybackAmount = sellableUnits * buybackPriceInr;
  
  // 6. Calculate capital gains (only for sellable units)
  const capitalGains = buybackAmount - (sellableUnits * exercisePriceInr + (sellableUnits / units) * perquisiteValue);
  
  // 7. Calculate capital gains tax
  const capitalGainsTaxRate = isLongTerm ? 
    TAX_RATES.LONG_TERM_CAPITAL_GAINS : 
    TAX_RATES.SHORT_TERM_CAPITAL_GAINS;
  
  // Apply surcharge and cess to capital gains tax rate
  const effectiveCapitalGainsTaxRate = capitalGainsTaxRate + 
                                    (capitalGainsTaxRate * TAX_RATES.SURCHARGE_RATE) + 
                                    TAX_RATES.CESS_RATE;
  
  const capitalGainsTax = Math.max(0, capitalGains * effectiveCapitalGainsTaxRate);
  
  // 8. Calculate net proceeds
  const netProceeds = buybackAmount - capitalGainsTax;
  
  // 9. Calculate total profit (Net proceeds - Total acquisition cost for sellable units)
  const acquisitionCostForSellableUnits = (sellableUnits / units) * totalAcquisitionCost;
  const totalProfit = netProceeds - acquisitionCostForSellableUnits;
  
  // 10. Calculate remaining value (for non-sellable units)
  const remainingValue = nonSellableUnits * fairMarketValueInr;
  
  // Calculate actual percentage sold
  const actualPercentageSold = (sellableUnits / units) * 100;
  
  return {
    units,
    sellableUnits,
    nonSellableUnits,
    limitingFactor,
    percentSellable: percentSellable,
    actualPercentageSold,
    isCurrentEmployee,
    exercisePrice: exercisePriceInr,
    exercisePriceUsd: exercisePrice,
    fairMarketValue: fairMarketValueInr,
    fairMarketValueUsd: fairMarketValue,
    buybackPrice: buybackPriceInr,
    buybackPriceUsd: buybackPrice,
    exerciseCost,
    perquisiteValue,
    perquisiteTax,
    totalAcquisitionCost,
    buybackAmount,
    capitalGains,
    capitalGainsTax,
    netProceeds,
    totalProfit,
    taxPaid: perquisiteTax + capitalGainsTax,
    isLongTerm,
    remainingValue,
    usdToInrRate
  };
}

/**
 * Calculate benefits when employee has NOT exercised the ESOPs and directly transfers them in buyback
 * 
 * @param {number} units - Number of ESOP units
 * @param {number} exercisePrice - Price at which ESOPs could have been exercised (per unit in USD)
 * @param {number} buybackPrice - Price offered during buyback (per unit in USD)
 * @param {number} percentSellable - User's percentage of units that can be sold in the buyback (0-100)
 * @param {boolean} isCurrentEmployee - Whether the person is a current employee or ex-employee
 * @param {number} usdToInrRate - USD to INR conversion rate
 * @return {object} Detailed breakdown of benefits and taxes
 */
function calculateBenefitsWhenNotExercisedYet(units, exercisePrice, buybackPrice, percentSellable = 100, 
                                             isCurrentEmployee = true, usdToInrRate = DEFAULT_USD_TO_INR_RATE) {
  // Convert USD prices to INR
  const exercisePriceInr = exercisePrice * usdToInrRate;
  const buybackPriceInr = buybackPrice * usdToInrRate;
  
  // Calculate sellable and non-sellable units with all constraints
  const sellableInfo = calculateSellableUnits(units, percentSellable, isCurrentEmployee, buybackPriceInr);
  const sellableUnits = sellableInfo.sellableUnits;
  const limitingFactor = sellableInfo.limitingFactor;
  const nonSellableUnits = units - sellableUnits;
  
  // When ESOPs are directly transferred in buyback without exercise,
  // the entire amount is treated as perquisite income taxable at normal slab rates
  
  // 1. Calculate total buyback amount (only for sellable units)
  const buybackAmount = sellableUnits * buybackPriceInr;
  
  // 2. Calculate notional exercise cost (what employee would have paid to exercise)
  const notionalExerciseCost = sellableUnits * exercisePriceInr;
  
  // 3. Calculate taxable perquisite value (buyback price - exercise price)
  const perquisiteValue = (buybackPriceInr - exercisePriceInr) * sellableUnits;
  
  // 4. Calculate perquisite tax
  const perquisiteTaxRate = TAX_RATES.PERQUISITE_TAX_RATE + 
                          (TAX_RATES.PERQUISITE_TAX_RATE * TAX_RATES.SURCHARGE_RATE) +
                          TAX_RATES.CESS_RATE;
  const perquisiteTax = perquisiteValue * perquisiteTaxRate;
  
  // 5. Calculate net proceeds
  const netProceeds = buybackAmount - perquisiteTax;
  
  // 6. Calculate net profit (no capital gains when not exercised)
  const netProfit = netProceeds - notionalExerciseCost;
  
  // 7. Calculate value of non-sellable units (potential future value)
  const nonSellableValue = nonSellableUnits * buybackPriceInr;
  
  // Calculate actual percentage sold
  const actualPercentageSold = (sellableUnits / units) * 100;
  
  return {
    units,
    sellableUnits,
    nonSellableUnits,
    limitingFactor,
    percentSellable: percentSellable,
    actualPercentageSold,
    isCurrentEmployee,
    exercisePrice: exercisePriceInr,
    exercisePriceUsd: exercisePrice,
    buybackPrice: buybackPriceInr,
    buybackPriceUsd: buybackPrice,
    notionalExerciseCost,
    buybackAmount,
    perquisiteValue,
    perquisiteTax,
    netProceeds,
    netProfit,
    taxPaid: perquisiteTax,
    nonSellableValue,
    usdToInrRate
  };
}

/**
 * Generate a comparative report of both scenarios
 * 
 * @param {object} exercisedAlreadyScenario - Results from calculateBenefitsWhenExercisedAlready
 * @param {object} notExercisedYetScenario - Results from calculateBenefitsWhenNotExercisedYet
 * @return {object} Comparative analysis of both scenarios
 */
function compareScenarios(exercisedAlreadyScenario, notExercisedYetScenario) {
  const profitDifference = exercisedAlreadyScenario.totalProfit - notExercisedYetScenario.netProfit;
  const taxDifference = exercisedAlreadyScenario.taxPaid - notExercisedYetScenario.taxPaid;
  
  return {
    exercisedAlreadyScenario,
    notExercisedYetScenario,
    profitDifference,
    taxDifference,
    recommendation: profitDifference > 0 ? 
      "Having already exercised options and then selling in buyback is more profitable" : 
      "Directly transferring without exercising is more profitable"
  };
}

module.exports = {
  calculateBenefitsWhenExercisedAlready,
  calculateBenefitsWhenNotExercisedYet,
  compareScenarios,
  TAX_RATES,
  DEFAULT_USD_TO_INR_RATE,
  SELLING_CAPS
};