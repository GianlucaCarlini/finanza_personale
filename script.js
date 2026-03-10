// Calcolatore Stipendio Netto - Logica di calcolo
// Based on Italian legislation

let salaryChart = null;

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

// Calcolo progressivo dell'addizionale regionale (simile a IRPEF)
function calculateRegionalTax(region, imponibile) {
    if (!regionalTaxRates || !regionalTaxRates[region]) {
        return 0;
    }
    
    const rates = regionalTaxRates[region].rates;
    
    // Funzione ausiliaria per ottenere la tariffa più vicina disponibile
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
    
    // Calcolo progressivo a scaglioni
    let tax = 0;
    
    if (imponibile < 15000) {
        // Solo primo scaglione
        tax = imponibile * (getClosestRate('under_15000', []) / 100);
    } else if (imponibile <= 28000) {
        // Primo scaglione: 15000, secondo scaglione: (imponibile - 15000)
        const firstBracket = 15000;
        const secondBracket = imponibile - 15000;
        tax = firstBracket * (getClosestRate('under_15000', []) / 100);
        tax += secondBracket * (getClosestRate('15000_28000', ['under_15000']) / 100);
    } else if (imponibile <= 50000) {
        // Primo scaglione: 15000, secondo: 13000, terzo: (imponibile - 28000)
        const firstBracket = 15000;
        const secondBracket = 13000;
        const thirdBracket = imponibile - 28000;
        tax = firstBracket * (getClosestRate('under_15000', []) / 100);
        tax += secondBracket * (getClosestRate('15000_28000', ['under_15000']) / 100);
        tax += thirdBracket * (getClosestRate('28000_50000', ['15000_28000', 'under_15000']) / 100);
    } else {
        // Tutti e 4 gli scaglioni
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

document.addEventListener('DOMContentLoaded', function() {
    const salaryForm = document.getElementById('salary-form');
    const resultsSection = document.getElementById('results');
    
    // Elementi per i risultati
    const grossMonthlyEl = document.getElementById('gross-monthly');
    const netMonthlyEl = document.getElementById('net-monthly');
    const thirteenthMonthEl = document.getElementById('thirteenth-month');
    const fourteenthMonthEl = document.getElementById('fourteenth-month');
    const employerCostEl = document.getElementById('employer-cost');

    // Calcola la tredicesima (stima basata su stipendio lordo mensile)
    function calculateThirteenthMonth(grossMonthly, monthlyPayments) {
        if (monthlyPayments >= 13) {
            return grossMonthly;
        }
        return 0;
    }

    // Calcola la quattordicesima (stima basata su stipendio lordo mensile)
    function calculateFourteenthMonth(grossMonthly, monthlyPayments) {
        if (monthlyPayments >= 14) {
            return grossMonthly;
        }
        return 0;
    }

    // Calcolo del costo aziendale totale (stima)
    function calculateEmployerCost(grossAnnual, monthlyPayments) {
        const employerContributionRate = 0.31; // 31%
        const additionalCosts = grossAnnual * employerContributionRate;
        return grossAnnual + additionalCosts;
    }

    // Formattazione valori in euro
    function formatCurrency(value) {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    // Calcolo dei contributi INPS (9.1%)
    function calculateINPS(grossAnnual) {
        const inpsCoefficient = 0.091;
        return grossAnnual * inpsCoefficient;
    }

    // Calcolo della riduzione dell'imposta
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

    // Calcolo progressivo dell'IRPEF
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

    // Inizializza il grafico
    function initChart() {
        const ctx = document.getElementById('salary-chart').getContext('2d');
        
        salaryChart = new Chart(ctx, {
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
                                return context.label + ': ' + formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }

    // Aggiorna il grafico con i dati
    function updateChart(grossAnnual, inpsContributions, irpef, regionalTax, taxReduction, netAnnual) {
        if (!salaryChart) return;

        salaryChart.data.datasets[0].data = [
            inpsContributions,
            irpef,
            regionalTax,
            taxReduction,
            netAnnual
        ];
        salaryChart.update();
    }

    // Gestione del form
    salaryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const grossAnnual = parseFloat(document.getElementById('gross-salary').value) || 0;
        const monthlyPayments = parseInt(document.getElementById('monthly-payments').value) || 13;
        const region = document.getElementById('region').value;
        const municipalTaxRate = parseFloat(document.getElementById('municipal-tax').value) || 0.80;

        // Calcolo contributi INPS (9.1%)
        const inpsContributions = calculateINPS(grossAnnual);

        // Calcolo dell'imponibile (lordo - INPS)
        const imponibile = grossAnnual - inpsContributions;

        // Calcolo IRPEF progressiva
        const irpef = calculateIRPEF(imponibile);

        // Calcolo della riduzione dell'imposta
        const taxReduction = calculateTaxReduction(imponibile);

        // Calcolo IRPEF netta dopo riduzione
        const netIrpef = Math.max(0, irpef - taxReduction);

        // Calcolo addizionale regionale (progressivo a scaglioni)
        const regionalTaxAmount = calculateRegionalTax(region, imponibile);

        // Calcolo addizionale comunale
        const municipalTaxAmount = imponibile * (municipalTaxRate / 100);

        // Calcolo stipendio netto annuo e mensile (dopo INPS, IRPEF, regionale e comunale)
        const netAnnual = imponibile - netIrpef - regionalTaxAmount - municipalTaxAmount;
        const netMonthly = netAnnual / monthlyPayments;
        const grossMonthly = grossAnnual / monthlyPayments;

        // Calcolo tredicesima e quattordicesima (lorda)
        const thirteenthMonth = calculateThirteenthMonth(grossMonthly, monthlyPayments);
        const fourteenthMonth = calculateFourteenthMonth(grossMonthly, monthlyPayments);

        // Calcolo costo aziendale totale
        const employerCost = calculateEmployerCost(grossAnnual, monthlyPayments);

        // Aggiorna l'interfaccia con i risultati
        grossMonthlyEl.textContent = formatCurrency(grossMonthly);
        netMonthlyEl.textContent = formatCurrency(netMonthly);
        thirteenthMonthEl.textContent = formatCurrency(thirteenthMonth);
        fourteenthMonthEl.textContent = formatCurrency(fourteenthMonth);
        employerCostEl.textContent = formatCurrency(employerCost);

        // Aggiorna il grafico con 5 segmenti
        updateChart(grossAnnual, inpsContributions, irpef, regionalTaxAmount, taxReduction, netAnnual, municipalTaxAmount);

        // Mostra la sezione risultati
        resultsSection.style.display = 'block';
    });

    // Inizializza il grafico al caricamento
    initChart();

    // Pre-populate con un valore di esempio
    document.getElementById('gross-salary').value = '30000';
    
    // Calcola automaticamente al caricamento
    salaryForm.dispatchEvent(new Event('submit'));
});