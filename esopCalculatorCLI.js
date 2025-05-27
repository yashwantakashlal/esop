#!/usr/bin/env node

const readline = require('readline');
const { 
  calculateBenefitsWhenExercisedAlready, 
  calculateBenefitsWhenNotExercisedYet, 
  compareScenarios,
  DEFAULT_USD_TO_INR_RATE,
  SELLING_CAPS
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

// Display result in a formatted manner
function displayResults(results, scenarioType) {
  console.log('\n' + '='.repeat(80));
  console.log(`${scenarioType} SCENARIO RESULTS`);
  console.log('='.repeat(80));
  
  if (scenarioType === 'EXERCISED ALREADY') {
    const r = results;
    console.log(`\nUnits: ${r.units}`);
    console.log(`Employment Status: ${r.isCurrentEmployee ? 'Current Employee' : 'Ex-Employee'}`);
    console.log(`Requested Percentage Sellable: ${r.percentSellable.toFixed(2)}%`);
    console.log(`Actual Percentage Sellable: ${r.actualPercentageSold.toFixed(2)}%`);
    console.log(`Sellable Units: ${r.sellableUnits} of ${r.units} (${r.nonSellableUnits} non-sellable)`);
    console.log(`Limiting Factor: ${r.limitingFactor}`);
    console.log(`Exercise Price: ${formatUSD(r.exercisePriceUsd)} (${formatCurrency(r.exercisePrice)}) per unit`);
    console.log(`Fair Market Value at Exercise: ${formatUSD(r.fairMarketValueUsd)} (${formatCurrency(r.fairMarketValue)}) per unit`);
    console.log(`Buyback Price: ${formatUSD(r.buybackPriceUsd)} (${formatCurrency(r.buybackPrice)}) per unit`);
    console.log(`USD to INR Rate: ${r.usdToInrRate}`);
    console.log(`Capital Gains Tax Type: ${r.isLongTerm ? 'Long Term (>24 months)' : 'Short Term (<24 months)'}`);
    
    console.log('\nCOSTS:');
    console.log(`Exercise Cost: ${formatCurrency(r.exerciseCost)}`);
    console.log(`Perquisite Value: ${formatCurrency(r.perquisiteValue)}`);
    console.log(`Perquisite Tax: ${formatCurrency(r.perquisiteTax)}`);
    console.log(`Total Acquisition Cost: ${formatCurrency(r.totalAcquisitionCost)}`);
    
    console.log('\nRETURNS (for sellable units):');
    console.log(`Buyback Amount: ${formatCurrency(r.buybackAmount)}`);
    console.log(`Capital Gains: ${formatCurrency(r.capitalGains)}`);
    console.log(`Capital Gains Tax: ${formatCurrency(r.capitalGainsTax)}`);
    console.log(`Net Proceeds: ${formatCurrency(r.netProceeds)}`);
    
    console.log('\nSUMMARY:');
    console.log(`Total Profit (for sellable units): ${formatCurrency(r.totalProfit)}`);
    console.log(`Total Tax Paid: ${formatCurrency(r.taxPaid)}`);
    console.log(`Tax Rate: ${((r.taxPaid / r.buybackAmount) * 100).toFixed(2)}%`);
    console.log(`Estimated Value of Non-Sellable Units: ${formatCurrency(r.remainingValue)}`);
  } else {
    const r = results;
    console.log(`\nUnits: ${r.units}`);
    console.log(`Employment Status: ${r.isCurrentEmployee ? 'Current Employee' : 'Ex-Employee'}`);
    console.log(`Requested Percentage Sellable: ${r.percentSellable.toFixed(2)}%`);
    console.log(`Actual Percentage Sellable: ${r.actualPercentageSold.toFixed(2)}%`);
    console.log(`Sellable Units: ${r.sellableUnits} of ${r.units} (${r.nonSellableUnits} non-sellable)`);
    console.log(`Limiting Factor: ${r.limitingFactor}`);
    console.log(`Exercise Price (not paid): ${formatUSD(r.exercisePriceUsd)} (${formatCurrency(r.exercisePrice)}) per unit`);
    console.log(`Buyback Price: ${formatUSD(r.buybackPriceUsd)} (${formatCurrency(r.buybackPrice)}) per unit`);
    console.log(`USD to INR Rate: ${r.usdToInrRate}`);
    
    console.log('\nFINANCIALS (for sellable units):');
    console.log(`Notional Exercise Cost (saved): ${formatCurrency(r.notionalExerciseCost)}`);
    console.log(`Buyback Amount: ${formatCurrency(r.buybackAmount)}`);
    console.log(`Perquisite Value: ${formatCurrency(r.perquisiteValue)}`);
    console.log(`Perquisite Tax: ${formatCurrency(r.perquisiteTax)}`);
    console.log(`Net Proceeds: ${formatCurrency(r.netProceeds)}`);
    
    console.log('\nSUMMARY:');
    console.log(`Net Profit (for sellable units): ${formatCurrency(r.netProfit)}`);
    console.log(`Total Tax Paid: ${formatCurrency(r.taxPaid)}`);
    console.log(`Tax Rate: ${((r.taxPaid / r.buybackAmount) * 100).toFixed(2)}%`);
    console.log(`Estimated Value of Non-Sellable Units: ${formatCurrency(r.nonSellableValue)}`);
  }
}

// Display comparison between the two scenarios
function displayComparison(comparison) {
  console.log('\n' + '='.repeat(80));
  console.log('COMPARISON BETWEEN SCENARIOS');
  console.log('='.repeat(80));
  
  console.log(`\nProfit in "Exercised Already" Scenario: ${formatCurrency(comparison.exercisedAlreadyScenario.totalProfit)}`);
  console.log(`Profit in "Not Exercised Yet" Scenario: ${formatCurrency(comparison.notExercisedYetScenario.netProfit)}`);
  console.log(`Profit Difference: ${formatCurrency(comparison.profitDifference)}`);
  
  console.log(`\nTax Paid in "Exercised Already" Scenario: ${formatCurrency(comparison.exercisedAlreadyScenario.taxPaid)}`);
  console.log(`Tax Paid in "Not Exercised Yet" Scenario: ${formatCurrency(comparison.notExercisedYetScenario.taxPaid)}`);
  console.log(`Tax Difference: ${formatCurrency(comparison.taxDifference)}`);
  
  console.log(`\nRECOMMENDATION: ${comparison.recommendation}`);
}

// Display selling caps information
function displaySellingCaps() {
  console.log('\n' + '-'.repeat(80));
  console.log('SELLING CAPS INFORMATION');
  console.log('-'.repeat(80));
  console.log(`Maximum selling amount: ${formatCurrency(SELLING_CAPS.MAX_AMOUNT_INR)} (1 crore INR)`);
  console.log(`Current employee cap: ${SELLING_CAPS.CURRENT_EMPLOYEE_PERCENT}% of total units`);
  console.log(`Ex-employee cap: ${SELLING_CAPS.EX_EMPLOYEE_PERCENT}% of total units`);
  console.log('-'.repeat(80));
}

// Main function to start the calculator
async function startCalculator() {
  console.log('\n' + '*'.repeat(80));
  console.log('ESOP BUYBACK BENEFIT CALCULATOR (INDIAN TAX REGULATIONS)');
  console.log('All prices are entered in USD and results are shown in INR');
  console.log('*'.repeat(80));
  
  // Display selling caps information
  displaySellingCaps();
  
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
    const units = parseInt(await getUserInput('\nEnter number of ESOP units: '));
    if (isNaN(units) || units <= 0) throw new Error('Invalid number of units');
    
    const employmentStatus = await getUserInput('Are you a current employee? (y/n): ');
    const isCurrentEmployee = employmentStatus.toLowerCase() === 'y' || employmentStatus.toLowerCase() === 'yes';
    
    const percentSellable = parseFloat(await getUserInput(`Enter desired percentage of units to sell (1-100) [Current limit: ${isCurrentEmployee ? '25%' : '12.5%'}]: `));
    if (isNaN(percentSellable) || percentSellable < 0 || percentSellable > 100) throw new Error('Invalid percentage');
    
    const exercisePrice = parseFloat(await getUserInput('Enter exercise price per unit (USD): '));
    if (isNaN(exercisePrice) || exercisePrice < 0) throw new Error('Invalid exercise price');
    
    const buybackPrice = parseFloat(await getUserInput('Enter buyback price per unit (USD): '));
    if (isNaN(buybackPrice) || buybackPrice <= 0) throw new Error('Invalid buyback price');
    
    const usdToInrRateInput = await getUserInput(`Enter USD to INR conversion rate [default: ${DEFAULT_USD_TO_INR_RATE}]: `);
    const usdToInrRate = usdToInrRateInput ? parseFloat(usdToInrRateInput) : DEFAULT_USD_TO_INR_RATE;
    if (isNaN(usdToInrRate) || usdToInrRate <= 0) throw new Error('Invalid USD to INR rate');
    
    // Calculate maximum sellable value
    const maxSellableValueInr = SELLING_CAPS.MAX_AMOUNT_INR;
    const maxSellableValueUsd = maxSellableValueInr / usdToInrRate;
    console.log(`\nBased on your inputs, maximum sellable value is ${formatCurrency(maxSellableValueInr)} (${formatUSD(maxSellableValueUsd)})`);
    
    // Calculate scenario when not exercised yet
    const notExercisedYetScenario = calculateBenefitsWhenNotExercisedYet(
      units, 
      exercisePrice, 
      buybackPrice,
      percentSellable,
      isCurrentEmployee,
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
      isCurrentEmployee,
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