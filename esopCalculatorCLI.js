#!/usr/bin/env node

const readline = require('readline');
const { 
  calculateBenefitsWhenExercisedAlready, 
  calculateBenefitsWhenNotExercisedYet, 
  compareScenarios,
  DEFAULT_USD_TO_INR_RATE,
  DEFAULT_SELLING_CAPS
} = require('./esopCalculator');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Format currency for display
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format USD currency for display
const formatUSD = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Format percentage
const formatPercent = (percent) => {
  return `${percent.toFixed(2)}%`;
};

// Display result in a formatted manner with improved visuals
function displayResults(results, scenarioType) {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + `${scenarioType} SCENARIO RESULTS` + ' '.repeat(25) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  
  const printRow = (label, value) => {
    console.log('║ ' + label.padEnd(40) + ' │ ' + value.padStart(35) + ' ║');
  };
  
  const printSection = (title) => {
    console.log('╟' + '─'.repeat(40) + '┬' + '─'.repeat(37) + '╢');
    console.log('║ ' + title.padEnd(40) + ' │' + ' '.repeat(36) + '║');
    console.log('╟' + '─'.repeat(40) + '┼' + '─'.repeat(37) + '╢');
  };
  
  if (scenarioType === 'EXERCISED ALREADY') {
    const r = results;
    
    printSection('BASIC INFORMATION');
    printRow('Vested ESOPs', `${r.units.toLocaleString()}`);
    printRow('User-defined Percentage', formatPercent(r.percentSellable));
    printRow('Actual Percentage Sellable', formatPercent(r.actualPercentageSold));
    printRow('Sellable Units', `${r.sellableUnits.toLocaleString()} of ${r.units.toLocaleString()}`);
    printRow('Non-sellable Units', `${r.nonSellableUnits.toLocaleString()}`);
    printRow('Limiting Factor', `${r.limitingFactor}`);
    
    printSection('PRICING INFORMATION');
    printRow('Exercise Price per Unit', `${formatUSD(r.exercisePriceUsd)} (${formatCurrency(r.exercisePrice)})`);
    printRow('Fair Market Value at Exercise', `${formatUSD(r.fairMarketValueUsd)} (${formatCurrency(r.fairMarketValue)})`);
    printRow('Buyback Price per Unit', `${formatUSD(r.buybackPriceUsd)} (${formatCurrency(r.buybackPrice)})`);
    printRow('USD to INR Rate', `${r.usdToInrRate}`);
    printRow('Maximum INR Cap', `${formatCurrency(r.maxAmountInr)}`);
    printRow('Capital Gains Tax Type', r.isLongTerm ? 'Long Term (>24 months)' : 'Short Term (<24 months)');
    
    printSection('COSTS');
    printRow('Exercise Cost', formatCurrency(r.exerciseCost));
    printRow('Perquisite Value', formatCurrency(r.perquisiteValue));
    printRow('Perquisite Tax', formatCurrency(r.perquisiteTax));
    printRow('Total Acquisition Cost', formatCurrency(r.totalAcquisitionCost));
    
    printSection('RETURNS (FOR SELLABLE UNITS)');
    printRow('Buyback Amount', formatCurrency(r.buybackAmount));
    printRow('Capital Gains', formatCurrency(r.capitalGains));
    printRow('Capital Gains Tax', formatCurrency(r.capitalGainsTax));
    printRow('Net Proceeds', formatCurrency(r.netProceeds));
    
    printSection('SUMMARY');
    printRow('Total Profit (for sellable units)', formatCurrency(r.totalProfit));
    printRow('Total Tax Paid', formatCurrency(r.taxPaid));
    printRow('Effective Tax Rate', formatPercent((r.taxPaid / r.buybackAmount) * 100));
    printRow('Estimated Value of Non-Sellable Units', formatCurrency(r.remainingValue));
  } else {
    const r = results;
    
    printSection('BASIC INFORMATION');
    printRow('Vested ESOPs', `${r.units.toLocaleString()}`);
    printRow('User-defined Percentage', formatPercent(r.percentSellable));
    printRow('Actual Percentage Sellable', formatPercent(r.actualPercentageSold));
    printRow('Sellable Units', `${r.sellableUnits.toLocaleString()} of ${r.units.toLocaleString()}`);
    printRow('Non-sellable Units', `${r.nonSellableUnits.toLocaleString()}`);
    printRow('Limiting Factor', `${r.limitingFactor}`);
    
    printSection('PRICING INFORMATION');
    printRow('Exercise Price (not paid)', `${formatUSD(r.exercisePriceUsd)} (${formatCurrency(r.exercisePrice)})`);
    printRow('Buyback Price per Unit', `${formatUSD(r.buybackPriceUsd)} (${formatCurrency(r.buybackPrice)})`);
    printRow('USD to INR Rate', `${r.usdToInrRate}`);
    printRow('Maximum INR Cap', `${formatCurrency(r.maxAmountInr)}`);
    
    printSection('FINANCIALS (FOR SELLABLE UNITS)');
    printRow('Notional Exercise Cost (saved)', formatCurrency(r.notionalExerciseCost));
    printRow('Buyback Amount', formatCurrency(r.buybackAmount));
    printRow('Perquisite Value', formatCurrency(r.perquisiteValue));
    printRow('Perquisite Tax', formatCurrency(r.perquisiteTax));
    printRow('Net Proceeds', formatCurrency(r.netProceeds));
    
    printSection('SUMMARY');
    printRow('Net Profit (for sellable units)', formatCurrency(r.netProfit));
    printRow('Total Tax Paid', formatCurrency(r.taxPaid));
    printRow('Effective Tax Rate', formatPercent((r.taxPaid / r.buybackAmount) * 100));
    printRow('Estimated Value of Non-Sellable Units', formatCurrency(r.nonSellableValue));
  }
  
  console.log('╚' + '═'.repeat(78) + '╝');
}

// Display comparison between the two scenarios with improved visuals
function displayComparison(comparison) {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(22) + 'COMPARISON BETWEEN SCENARIOS' + ' '.repeat(22) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  
  const printRow = (label, value) => {
    console.log('║ ' + label.padEnd(40) + ' │ ' + value.padStart(35) + ' ║');
  };
  
  const printSection = (title) => {
    console.log('╟' + '─'.repeat(40) + '┬' + '─'.repeat(37) + '╢');
    console.log('║ ' + title.padEnd(40) + ' │' + ' '.repeat(36) + '║');
    console.log('╟' + '─'.repeat(40) + '┼' + '─'.repeat(37) + '╢');
  };
  
  printSection('PROFIT COMPARISON');
  printRow('Profit in "Exercised Already" Scenario', formatCurrency(comparison.exercisedAlreadyScenario.totalProfit));
  printRow('Profit in "Not Exercised Yet" Scenario', formatCurrency(comparison.notExercisedYetScenario.netProfit));
  printRow('Profit Difference', formatCurrency(comparison.profitDifference));
  
  printSection('TAX COMPARISON');
  printRow('Tax Paid in "Exercised Already" Scenario', formatCurrency(comparison.exercisedAlreadyScenario.taxPaid));
  printRow('Tax Paid in "Not Exercised Yet" Scenario', formatCurrency(comparison.notExercisedYetScenario.taxPaid));
  printRow('Tax Difference', formatCurrency(comparison.taxDifference));
  
  printSection('RECOMMENDATION');
  const recommendation = comparison.recommendation;
  const wrappedRecommendation = recommendation.length > 35 ? 
    recommendation.substring(0, 35) + '\n║' + ' '.repeat(41) + '│ ' + recommendation.substring(35).padStart(35) + ' ║' : 
    recommendation;
  printRow('Recommendation', wrappedRecommendation);
  
  console.log('╚' + '═'.repeat(78) + '╝');
}

// Display selling caps information with improved visuals
function displayDefaultSettings() {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + 'DEFAULT SETTINGS' + ' '.repeat(25) + '║');
  console.log('╠' + '═'.repeat(78) + '╣');
  
  const printRow = (label, value) => {
    console.log('║ ' + label.padEnd(40) + ' │ ' + value.padStart(35) + ' ║');
  };
  
  printRow('Default Maximum Selling Amount', `${formatCurrency(DEFAULT_SELLING_CAPS.MAX_AMOUNT_INR)} (1 crore INR)`);
  printRow('Default Percentage', `${DEFAULT_SELLING_CAPS.DEFAULT_PERCENT}% of total units`);
  
  console.log('╚' + '═'.repeat(78) + '╝');
}

// Main function to start the calculator
async function startCalculator() {
  console.log('\n' + '╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(15) + 'ESOP BUYBACK BENEFIT CALCULATOR (INDIA)' + ' '.repeat(16) + '║');
  console.log('║' + ' '.repeat(10) + 'All prices are entered in USD and results are shown in INR' + ' '.repeat(11) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  
  // Display default settings information
  displayDefaultSettings();
  
  // Helper function to get user input
  const getUserInput = (question) => {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  };
  
  try {
    // Get common inputs
    const units = parseInt(await getUserInput('\nEnter number of vested ESOPs: '));
    if (isNaN(units) || units <= 0) throw new Error('Invalid number of vested ESOPs');
    
    const percentInput = await getUserInput(`Enter percentage of units allowed to sell [default: ${DEFAULT_SELLING_CAPS.DEFAULT_PERCENT}%]: `);
    const percentSellable = percentInput ? parseFloat(percentInput) : DEFAULT_SELLING_CAPS.DEFAULT_PERCENT;
    if (isNaN(percentSellable) || percentSellable <= 0 || percentSellable > 100) throw new Error('Invalid percentage: must be between 0 and 100');
    
    const maxCapInput = await getUserInput(`Enter maximum INR cap in crores [default: ${DEFAULT_SELLING_CAPS.MAX_AMOUNT_INR / 10000000} crore]: `);
    const maxAmountInr = maxCapInput ? parseFloat(maxCapInput) * 10000000 : DEFAULT_SELLING_CAPS.MAX_AMOUNT_INR;
    if (isNaN(maxAmountInr) || maxAmountInr <= 0) throw new Error('Invalid INR cap: must be greater than 0');
    
    const exercisePrice = parseFloat(await getUserInput('Enter exercise price per unit (USD): '));
    if (isNaN(exercisePrice) || exercisePrice < 0) throw new Error('Invalid exercise price');
    
    const buybackPrice = parseFloat(await getUserInput('Enter buyback price per unit (USD): '));
    if (isNaN(buybackPrice) || buybackPrice <= 0) throw new Error('Invalid buyback price');
    
    const usdToInrRateInput = await getUserInput(`Enter USD to INR conversion rate [default: ${DEFAULT_USD_TO_INR_RATE}]: `);
    const usdToInrRate = usdToInrRateInput ? parseFloat(usdToInrRateInput) : DEFAULT_USD_TO_INR_RATE;
    if (isNaN(usdToInrRate) || usdToInrRate <= 0) throw new Error('Invalid USD to INR rate');
    
    // Display maximum sellable value
    const maxSellableValueInr = maxAmountInr;
    const maxSellableValueUsd = maxSellableValueInr / usdToInrRate;
    console.log(`\nMaximum sellable value is ${formatCurrency(maxSellableValueInr)} (${formatUSD(maxSellableValueUsd)})`);
    
    // Calculate scenario when not exercised yet
    const notExercisedYetScenario = calculateBenefitsWhenNotExercisedYet(
      units, 
      exercisePrice, 
      buybackPrice,
      percentSellable,
      maxAmountInr,
      usdToInrRate
    );
    
    // Get additional inputs for already exercised scenario
    const fairMarketValue = parseFloat(await getUserInput('\nFor "Exercised Already" scenario, enter Fair Market Value at time of exercise (USD): '));
    if (isNaN(fairMarketValue) || fairMarketValue < 0) throw new Error('Invalid fair market value');
    
    const holdingPeriod = await getUserInput('Were shares held for more than 24 months after exercise? (y/n): ');
    const isLongTerm = holdingPeriod.toLowerCase() === 'y' || holdingPeriod.toLowerCase() === 'yes';
    
    // Calculate scenario when already exercised
    const exercisedAlreadyScenario = calculateBenefitsWhenExercisedAlready(
      units, 
      exercisePrice, 
      fairMarketValue, 
      buybackPrice, 
      isLongTerm,
      percentSellable,
      maxAmountInr,
      usdToInrRate
    );
    
    // Display results for both scenarios
    displayResults(exercisedAlreadyScenario, 'EXERCISED ALREADY');
    displayResults(notExercisedYetScenario, 'NOT EXERCISED YET');
    
    // Compare scenarios
    const comparison = compareScenarios(exercisedAlreadyScenario, notExercisedYetScenario);
    displayComparison(comparison);
    
  } catch (error) {
    console.error(`\nError: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Start the calculator
startCalculator();