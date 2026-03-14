// Calcolatore Stipendio Netto - Logica di calcolo
// Based on Italian legislation

let salaryChart = null;
let currentSection = 'salary';

// Dati delle aliquote regionali (embedded per evitare problemi con fetch)
const regionalTaxRates = {
    "Abruzzo": { "rates": { "under_15000": 1.67, "15000_28000": 2.87, "28000_50000": 3.33, "over_50000": null } },
    "Basilicata": { "rates": { "under_15000": 1.23, "15000_28000": null, "28000_50000": null, "over_50000": null } },
    "Bolzano": { "rates": { "under_15000": 1.23, "15000_28000": 1.73, "28000_50000": null, "over_50000": null } },
    "Calabria": { "rates": { "under_15000": 1.73, "15000_28000": null, "28000_50000": null, "over_50000": null } },
    "Campania": { "rates": { "under_15000": 1.73, "15000_28000": 2.96, "28000_50000": 3.20, "over_50000": 3.33 } },
    "Emilia-Romagna": { "rates": { "under_15000": 1.33, "15000_28000": 1.93, "28000_50000": 2.93, "over_50000": 3.33 } },
    "Friuli-Venezia Giulia": { "rates": { "under_15000": 0.70, "15000_28000": 1.23, "28000_50000": null, "over_50000": null } },
    "Lazio": { "rates": { "under_15000": 1.73, "15000_28000": 3.33, "28000_50000": null, "over_50000": null } },
    "Liguria": { "rates": { "under_15000": 1.23, "15000_28000": 3.18, "28000_50000": 3.23, "over_50000": null } },
    "Lombardia": { "rates": { "under_15000": 1.23, "15000_28000": 1.58, "28000_50000": 1.72, "over_50000": 1.73 } },
    "Marche": { "rates": { "under_15000": 1.23, "15000_28000": 1.53, "28000_50000": 1.70, "over_50000": 1.73 } },
    "Molise": { "rates": { "under_15000": 2.03, "15000_28000": 2.23, "28000_50000": 2.63, "over_50000": null } },
    "Piemonte": { "rates": { "under_15000": 1.62, "15000_28000": 2.13, "28000_50000": 2.75, "over_50000": 3.33 } },
    "Puglia": { "rates": { "under_15000": 1.33, "15000_28000": 1.43, "28000_50000": 1.63, "over_50000": 1.85 } },
    "Sardegna": { "rates": { "under_15000": 1.23, "15000_28000": null, "28000_50000": null, "over_50000": null } },
    "Sicilia": { "rates": { "under_15000": 1.23, "15000_28000": null, "28000_50000": null, "over_50000": null } },
    "Toscana": { "rates": { "under_15000": 1.42, "15000_28000": 1.43, "28000_50000": 3.32, "over_50000": 3.33 } },
    "Trento": { "rates": { "under_15000": 1.23, "15000_28000": 1.73, "28000_50000": null, "over_50000": null } },
    "Umbria": { "rates": { "under_15000": 1.73, "15000_28000": 3.02, "28000_50000": 3.12, "over_50000": 3.33 } },
    "Valle d'Aosta": { "rates": { "under_15000": 1.23, "15000_28000": null, "28000_50000": null, "over_50000": null } },
    "Veneto": { "rates": { "under_15000": 1.23, "15000_28000": null, "28000_50000": null, "over_50000": null } }
};

// Funzione per caricare le sezioni dinamicamente
async function loadSection(sectionName) {
    const contentArea = document.getElementById('content-area');
    
    try {
        const response = await fetch(`sections/${sectionName}.html`);
        if (!response.ok) throw new Error(`Failed to load ${sectionName}`);
        const html = await response.text();
        contentArea.innerHTML = html;
        
        // Trigger MathJax rendering if MathJax is available
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
        
        // Initialize section-specific scripts
        if (sectionName === 'salary') {
            initializeSalaryCalculator();
        }
        
        currentSection = sectionName;
    } catch (error) {
        console.error('Error loading section:', error);
        contentArea.innerHTML = '<p class="error">Errore nel caricamento della sezione.</p>';
    }
}

// INPS calculation (9.1%)
function calculateINPS(grossAnnual) {
    return grossAnnual * 0.091;
}

// Tax reduction calculation
function calculateTaxReduction(imponibile) {
    if (imponibile < 15000) {
        return 1955;
    } else if (imponibile <= 28000) {
        return 1910 + (1190 * (28000 - imponibile) / 13000);
    } else if (imponibile <= 50000) {
        return 1910 * ((50000 - imponibile) / 22000);
    } else {
        return 0;
    }
}

// Fiscal cut calculation
function calculateTaglioCuneoFiscale(imponibile) {
    if (imponibile <= 20000) {
        if (imponibile <= 8500) {
            return imponibile * 0.071;
        } else if (imponibile <= 15000) {
            return 8500 * 0.071 + (imponibile - 8500) * 0.053;
        } else {
            return 8500 * 0.071 + (15000 - 8500) * 0.053 + (imponibile - 15000) * 0.048;
        }
    } else if (imponibile <= 32000) {
        return 1000;
    } else if (imponibile <= 40000) {
        return 1000 * ((40000 - imponibile) / 8000);
    } else {
        return 0;
    }
}

// Progressive IRPEF calculation
function calculateIRPEF(imponibile) {
    if (imponibile < 28000) {
        return 0.23 * imponibile;
    } else if (imponibile <= 50000) {
        const taxFirstBracket = 0.23 * 28000;
        const taxSecondBracket = 0.33 * (imponibile - 28000);
        return taxFirstBracket + taxSecondBracket;
    } else {
        const taxFirstBracket = 0.23 * 28000;
        const taxSecondBracket = 0.33 * (50000 - 28000);
        const taxThirdBracket = 0.43 * (imponibile - 50000);
        return taxFirstBracket + taxSecondBracket + taxThirdBracket;
    }
}

// Regional tax calculation
function calculateRegionalTax(region, imponibile) {
    if (!regionalTaxRates || !regionalTaxRates[region]) {
        return 0;
    }

    const rates = regionalTaxRates[region].rates;

    function getClosestRate(rateKey, fallbackKeys) {
        let rate = rates[rateKey];
        if (rate !== null && rate !== undefined && !isNaN(rate)) {
            return rate;
        }
        for (const fallbackKey of fallbackKeys) {
            rate = rates[fallbackKey];
            if (rate !== null && rate !== undefined && !isNaN(rate)) {
                return rate;
            }
        }
        return 0;
    }

    let tax = 0;

    if (imponibile < 15000) {
        tax = imponibile * (getClosestRate('under_15000', []) / 100);
    } else if (imponibile <= 28000) {
        const firstBracket = 15000;
        const secondBracket = imponibile - 15000;
        tax = firstBracket * (getClosestRate('under_15000', []) / 100);
        tax += secondBracket * (getClosestRate('15000_28000', ['under_15000']) / 100);
    } else if (imponibile <= 50000) {
        const firstBracket = 15000;
        const secondBracket = 13000;
        const thirdBracket = imponibile - 28000;
        tax = firstBracket * (getClosestRate('under_15000', []) / 100);
        tax += secondBracket * (getClosestRate('15000_28000', ['under_15000']) / 100);
        tax += thirdBracket * (getClosestRate('28000_50000', ['15000_28000', 'under_15000']) / 100);
    } else {
        const firstBracket = 15000;
        const secondBracket = 13000;
        const thirdBracket = 22000;
        const fourthBracket = imponibile - 50000;
        tax = firstBracket * (getClosestRate('under_15000', []) / 100);
        tax += secondBracket * (getClosestRate('15000_28000', ['under_15000']) / 100);
        tax += thirdBracket * (getClosestRate('28000_50000', ['15000_28000', 'under_15000']) / 100);
        tax += fourthBracket * (getClosestRate('over_50000', ['28000_50000', '15000_28000', 'under_15000']) / 100);
    }

    return tax;
}

// Currency formatting
function formatCurrency(value) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Initialize Chart
function initChart() {
    const canvas = document.getElementById('salary-chart');
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Contributi INPS', 'IRPEF', 'Addizionale Regionale', 'Riduzione Fiscale', 'Stipendio Netto'],
            datasets: [{
                data: [0, 0, 0, 0, 100],
                backgroundColor: [
                    '#2196F3',
                    '#F44336',
                    '#FF9800',
                    '#81C784',
                    '#4CAF50'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0 && (context.dataIndex === 3 || context.dataIndex === 4)) {
                                const rawData = salaryChart.data.datasets[0].rawData || [];
                                const netSalary = rawData[5];
                                return 'Stipendio Netto: ' + formatCurrency(netSalary);
                            }
                            return context.label + ': ' + formatCurrency(context.raw);
                        },
                        afterLabel: function(context) {
                            if (context.datasetIndex === 0 && (context.dataIndex === 3 || context.dataIndex === 4)) {
                                const rawData = salaryChart.data.datasets[0].rawData || [];
                                if (rawData.length >= 6) {
                                    const taxReduction = rawData[3];
                                    const taglioCuneo = rawData[4];
                                    const netSalary = rawData[5];
                                    const totalReductions = taxReduction + taglioCuneo;
                                    const totalNet = totalReductions + netSalary;
                                    const percent = context.dataIndex === 3
                                        ? (totalReductions / totalNet * 100).toFixed(1)
                                        : (netSalary / totalNet * 100).toFixed(1);
                                    return 'di cui riduzioni totali (fiscale + cuneo): ' + formatCurrency(totalReductions) + ' (' + percent + '%)';
                                }
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Update chart with data
function updateChart(chart, grossAnnual, inpsContributions, irpef, regionalTax, taxReduction, netAnnual, taglioCuneo, municipalTax) {
    if (!chart) return;

    const totalReductions = taxReduction + taglioCuneo;

    chart.data.datasets[0].data = [
        inpsContributions,
        irpef,
        regionalTax,
        totalReductions,
        netAnnual
    ];
    chart.data.datasets[0].rawData = [
        inpsContributions,
        irpef,
        regionalTax,
        taxReduction,
        taglioCuneo,
        netAnnual
    ];
    chart.update();
}

// Update breakdown table
function updateTable(grossAnnual, inpsContributions, imponibile, irpef, taxReduction, taglioCuneo, netIrpef, regionalTaxAmount, municipalTaxAmount, netAnnual, netMonthly) {
    const totalDeductions = inpsContributions + netIrpef + regionalTaxAmount + municipalTaxAmount;

    const getElement = (id) => document.getElementById(id);
    
    if (getElement('gross-yearly')) getElement('gross-yearly').textContent = formatCurrency(grossAnnual);
    if (getElement('inps-amount')) getElement('inps-amount').textContent = formatCurrency(inpsContributions);
    if (getElement('taxable-income')) getElement('taxable-income').textContent = formatCurrency(imponibile);
    if (getElement('irpef-gross')) getElement('irpef-gross').textContent = formatCurrency(irpef);
    if (getElement('tax-reduction')) getElement('tax-reduction').textContent = formatCurrency(taxReduction);
    if (getElement('cuneo-fiscale')) getElement('cuneo-fiscale').textContent = formatCurrency(taglioCuneo);
    if (getElement('irpef-net')) getElement('irpef-net').textContent = formatCurrency(netIrpef);
    if (getElement('regional-tax')) getElement('regional-tax').textContent = formatCurrency(regionalTaxAmount);
    if (getElement('municipal-tax-amount')) getElement('municipal-tax-amount').textContent = formatCurrency(municipalTaxAmount);
    if (getElement('total-deductions')) getElement('total-deductions').textContent = formatCurrency(totalDeductions);
    if (getElement('net-yearly')) getElement('net-yearly').textContent = formatCurrency(netAnnual);
    if (getElement('net-monthly-table')) getElement('net-monthly-table').textContent = formatCurrency(netMonthly);
}

// Calculate thirteenth month
function calculateThirteenthMonth(grossMonthly, monthlyPayments) {
    return monthlyPayments >= 13 ? grossMonthly : 0;
}

// Calculate fourteenth month
function calculateFourteenthMonth(grossMonthly, monthlyPayments) {
    return monthlyPayments >= 14 ? grossMonthly : 0;
}

// Calculate employer cost
function calculateEmployerCost(grossAnnual) {
    return grossAnnual * 1.31;
}

// Initialize salary calculator
function initializeSalaryCalculator() {
    salaryChart = null;
    
    const salaryForm = document.getElementById('salary-form');
    if (!salaryForm) return;

    const grossMonthlyEl = document.getElementById('gross-monthly');
    const netMonthlyEl = document.getElementById('net-monthly');
    const thirteenthMonthEl = document.getElementById('thirteenth-month');
    const fourteenthMonthEl = document.getElementById('fourteenth-month');
    const employerCostEl = document.getElementById('employer-cost');

    // Initialize chart
    salaryChart = initChart();

    // Form submission handler
    salaryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const grossAnnual = parseFloat(document.getElementById('gross-salary').value) || 0;
        const monthlyPayments = parseInt(document.getElementById('monthly-payments').value) || 13;
        const region = document.getElementById('region').value;
        const municipalTaxRate = parseFloat(document.getElementById('municipal-tax').value) || 0.80;

        // Calculate all values
        const inpsContributions = calculateINPS(grossAnnual);
        const imponibile = grossAnnual - inpsContributions;
        const irpef = calculateIRPEF(imponibile);
        const taxReduction = calculateTaxReduction(imponibile);
        const taglioCuneoFiscale = calculateTaglioCuneoFiscale(imponibile);
        const netIrpef = Math.max(0, irpef - taxReduction - taglioCuneoFiscale);
        const regionalTaxAmount = calculateRegionalTax(region, imponibile);
        const municipalTaxAmount = imponibile * (municipalTaxRate / 100);
        const netAnnual = imponibile - netIrpef - regionalTaxAmount - municipalTaxAmount;
        const netMonthly = netAnnual / monthlyPayments;
        const grossMonthly = grossAnnual / monthlyPayments;

        const thirteenthMonth = calculateThirteenthMonth(grossMonthly, monthlyPayments);
        const fourteenthMonth = calculateFourteenthMonth(grossMonthly, monthlyPayments);
        const employerCost = calculateEmployerCost(grossAnnual);

        // Update UI
        if (grossMonthlyEl) grossMonthlyEl.textContent = formatCurrency(grossMonthly);
        if (netMonthlyEl) netMonthlyEl.textContent = formatCurrency(netMonthly);
        if (thirteenthMonthEl) thirteenthMonthEl.textContent = formatCurrency(thirteenthMonth);
        if (fourteenthMonthEl) fourteenthMonthEl.textContent = formatCurrency(fourteenthMonth);
        if (employerCostEl) employerCostEl.textContent = formatCurrency(employerCost);

        // Update chart and table
        updateChart(salaryChart, grossAnnual, inpsContributions, irpef, regionalTaxAmount, taxReduction, netAnnual, taglioCuneoFiscale, municipalTaxAmount);
        updateTable(grossAnnual, inpsContributions, imponibile, irpef, taxReduction, taglioCuneoFiscale, netIrpef, regionalTaxAmount, municipalTaxAmount, netAnnual, netMonthly);

        // Show results section
        const resultsSection = document.getElementById('results');
        if (resultsSection) resultsSection.style.display = 'block';
    });

    // Pre-populate with example value
    const grossSalaryInput = document.getElementById('gross-salary');
    if (grossSalaryInput) {
        grossSalaryInput.value = '30000';
        // Auto-submit
        salaryForm.dispatchEvent(new Event('submit'));
    }
}

// TFR Calculation
function calculateTFR(annualSalary, yearsOfService, monthsOfService, inflationRate) {
    // Annual accrual: salary / 13.5
    const annualAccrual = annualSalary / 13.5;
    
    // Total service period in years (including fractional months)
    const totalYears = yearsOfService + (monthsOfService / 12);
    
    // Gross TFR (without revaluation)
    const grossTFR = annualAccrual * totalYears;
    
    // Revaluation rate: 1.5% fixed + 75% of ISTAT inflation
    const revaluationRate = 0.015 + (0.75 * (inflationRate / 100));
    
    // Indexed TFR with compound interest
    const indexedTFR = grossTFR * Math.pow(1 + revaluationRate, yearsOfService);
    
    // Estimated effective tax rate (progressive IRPEF based on average income)
    // Simplified calculation based on TFR amount brackets
    let estimatedTaxRate;
    if (indexedTFR < 8500) {
        estimatedTaxRate = 0.23;
    } else if (indexedTFR < 25000) {
        estimatedTaxRate = 0.25;
    } else if (indexedTFR < 40000) {
        estimatedTaxRate = 0.35;
    } else {
        estimatedTaxRate = 0.43;
    }
    
    // Net TFR
    const netTFR = indexedTFR * (1 - estimatedTaxRate);
    
    return {
        annualAccrual,
        totalYears,
        grossTFR,
        revaluationRate,
        indexedTFR,
        estimatedTaxRate,
        netTFR
    };
}

// Calculate effective tax rate for TFR
function calculateTFRTaxRate(tfrAmount) {
    if (tfrAmount < 8500) {
        return 0.23;
    } else if (tfrAmount < 25000) {
        return 0.25;
    } else if (tfrAmount < 40000) {
        return 0.35;
    } else {
        return 0.43;
    }
}

// Initialize TFR calculator
function initializeTFRCalculator() {
    const tfrForm = document.getElementById('tfr-form');
    if (!tfrForm) return;

    const tfrResults = document.getElementById('tfr-results');
    if (!tfrResults) return;

    tfrForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const annualSalary = parseFloat(document.getElementById('annual-salary').value) || 0;
        const yearsOfService = parseInt(document.getElementById('years-of-service').value) || 0;
        const monthsOfService = parseInt(document.getElementById('months-of-service').value) || 0;
        const inflationRate = parseFloat(document.getElementById('inflation-rate').value) || 2.0;

        // Calculate TFR
        const tfr = calculateTFR(annualSalary, yearsOfService, monthsOfService, inflationRate);

        // Update results display
        document.getElementById('result-annual-salary').textContent = formatCurrency(annualSalary);
        document.getElementById('result-annual-accrual').textContent = formatCurrency(tfr.annualAccrual);
        document.getElementById('result-accrual-rate').textContent = '7.41%';
        document.getElementById('result-service-period').textContent = `${yearsOfService} anni, ${monthsOfService} mesi`;
        document.getElementById('result-gross-tfr').textContent = formatCurrency(tfr.grossTFR);
        document.getElementById('result-revaluation-rate').textContent = (tfr.revaluationRate * 100).toFixed(2) + '%';
        document.getElementById('result-indexed-tfr').textContent = formatCurrency(tfr.indexedTFR);
        document.getElementById('result-tax-rate').textContent = (tfr.estimatedTaxRate * 100).toFixed(1) + '%';
        document.getElementById('result-net-tfr').textContent = formatCurrency(tfr.netTFR);

        // Update formula display
        document.getElementById('formula-annual-accrual').textContent = formatCurrency(tfr.annualAccrual);
        document.getElementById('formula-gross-tfr').textContent = formatCurrency(tfr.grossTFR);
        document.getElementById('formula-inflation').textContent = inflationRate.toFixed(1);
        document.getElementById('formula-revaluation-rate').textContent = (tfr.revaluationRate * 100).toFixed(2);
        document.getElementById('formula-indexed-tfr').textContent = formatCurrency(tfr.indexedTFR);
        document.getElementById('formula-tax-rate').textContent = (tfr.estimatedTaxRate * 100).toFixed(1) + '%';

        // Show results section
        tfrResults.classList.remove('hidden');
        
        // Scroll to results
        tfrResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Pre-populate with example values
    const annualSalaryInput = document.getElementById('annual-salary');
    if (annualSalaryInput) annualSalaryInput.value = '30000';
    
    const yearsOfServiceInput = document.getElementById('years-of-service');
    if (yearsOfServiceInput) yearsOfServiceInput.value = '10';
    
    // Auto-calculate
    setTimeout(() => {
        tfrForm.dispatchEvent(new Event('submit'));
    }, 500);
}

// DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup navigation
    const statusItems = document.querySelectorAll('.status-item');

    statusItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            statusItems.forEach(si => si.classList.remove('active'));
            this.classList.add('active');

            const section = this.getAttribute('data-section');
            loadSection(section);
        });
    });

    // Load initial section (salary)
    loadSection('salary');
    
    // Initialize TFR calculator if on TFR page
    initializeTFRCalculator();
});
