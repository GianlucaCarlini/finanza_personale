// Calcolatore Stipendio Netto - Logica di calcolo
// Based on Italian legislation

let salaryChart = null;

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
            // La tredicesima è tipicamente equivalente a un mese di stipendio
            return grossMonthly;
        }
        return 0;
    }

    // Calcola la quattordicesima (stima basata su stipendio lordo mensile)
    function calculateFourteenthMonth(grossMonthly, monthlyPayments) {
        if (monthlyPayments >= 14) {
            // La quattordicesima è tipicamente equivalente a un mese di stipendio
            return grossMonthly;
        }
        return 0;
    }

    // Calcolo del costo aziendale totale (stima)
    // Include contributi INPS e altri oneri
    function calculateEmployerCost(grossAnnual, monthlyPayments) {
        // I contributi INPS per dipendenti privati sono circa il 30-32% del lordo
        // Questo è un valore approssimativo che dovrai personalizzare
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
        const inpsCoefficient = 0.091; // 9.1%
        return grossAnnual * inpsCoefficient;
    }

    // Calcolo della riduzione dell'imposta
    // Scaglioni:
    // < 15000 -> 1955
    // 15000 - 28000 -> 1910 + (1190 * (28000 - imponibile) / 13000)
    // 28000 - 50000 -> 1910 * ((50000 - imponibile) / 22000)
    // > 50000 -> 0
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
    // Scaglioni:
    // < 28000 -> 23%
    // 28000 - 50000 -> 33%
    // > 50000 -> 43%
    function calculateIRPEF(imponibile) {
        if (imponibile < 28000) {
            return 0.23 * imponibile;
        } else if (imponibile <= 50000) {
            // Primo scaglione: 23% su 28000
            // Secondo scaglione: 33% su (imponibile - 28000)
            const taxFirstBracket = 0.23 * 28000;
            const taxSecondBracket = 0.33 * (imponibile - 28000);
            return taxFirstBracket + taxSecondBracket;
        } else {
            // Primo scaglione: 23% su 28000
            // Secondo scaglione: 33% su (50000 - 28000)
            // Terzo scaglione: 43% su (imponibile - 50000)
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
                labels: ['Contributi INPS', 'IRPEF (Tasse)', 'Riduzione Fiscale', 'Stipendio Netto'],
                datasets: [{
                    data: [0, 0, 0, 100],
                    backgroundColor: [
                        '#2196F3', // Blue for INPS
                        '#F44336', // Red for IRPEF
                        '#81C784', // Light green for Tax Reduction
                        '#4CAF50'  // Green for Net Salary
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
    function updateChart(grossAnnual, inpsContributions, netIrpef, taxReduction, netAnnual) {
        if (!salaryChart) return;

        salaryChart.data.datasets[0].data = [
            inpsContributions,
            netIrpef,
            taxReduction,
            netAnnual
        ];
        salaryChart.update();
    }

    // Gestione del form
    salaryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Ottieni i valori dal form
        const grossAnnual = parseFloat(document.getElementById('gross-salary').value) || 0;
        const monthlyPayments = parseInt(document.getElementById('monthly-payments').value) || 13;
        const region = document.getElementById('region').value;
        const contractType = document.getElementById('contract-type').value;
        const dependents = parseInt(document.getElementById('dependents').value) || 0;

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

        // Calcolo stipendio netto annuo e mensile
        // Netto = Imponibile - IRPEF netta
        const netAnnual = imponibile - netIrpef;
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

        // Aggiorna il grafico con 4 segmenti
        updateChart(grossAnnual, inpsContributions, netIrpef, taxReduction, netAnnual);

        // Mostra la sezione risultati
        resultsSection.style.display = 'block';
    });

    // Inizializza il grafico al caricamento
    initChart();

    // Pre-populate con un valore di esempio per facilitare il test
    document.getElementById('gross-salary').value = '30000';
    
    // Calcola automaticamente al caricamento
    salaryForm.dispatchEvent(new Event('submit'));
});