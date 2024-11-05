// script.js

// Get DOM elements
const scenarioSelect = document.getElementById('scenario');
const customInputDiv = document.getElementById('customInput');
const customGrowthInput = document.getElementById('customGrowth');
const priceChartCanvas = document.getElementById('priceChart');
const currentPriceDisplay = document.getElementById('currentPriceDisplay');
let priceChart;

// Event listeners
scenarioSelect.addEventListener('change', () => {
    updateScenario();
    generateChart();
});
customGrowthInput.addEventListener('input', generateChart);

// Initial chart generation
generateChart();

// Update scenario based on dropdown selection
function updateScenario() {
    if (scenarioSelect.value === 'custom') {
        customInputDiv.style.display = 'block';
    } else {
        customInputDiv.style.display = 'none';
    }
}

// Fetch the current Bitcoin price from CoinGecko API
async function fetchCurrentPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        const data = await response.json();
        const currentPrice = data.bitcoin.usd;
        return currentPrice;
    } catch (error) {
        console.error('Error fetching current Bitcoin price:', error);
        // Display error message to the user
        currentPriceDisplay.innerHTML = `<span class="text-white fw-bold">Error fetching Bitcoin price.</span>`;
        return null;
    }
}

// Calculate the yearly prices starting from $69,420 in 2024
function calculatePrices() {
    const targetPrices = {
        bear: 3000000,
        base: 13000000,
        bull: 49000000
    };
    const startYear = 2024;
    const endYear = 2045;
    const years = endYear - startYear + 1;
    const labels = [];
    const prices = [];

    const startingPrice = 69420; // Starting price in 2024

    let annualGrowthRate;

    if (scenarioSelect.value === 'custom') {
        annualGrowthRate = parseFloat(customGrowthInput.value) / 100;
        if (isNaN(annualGrowthRate)) {
            annualGrowthRate = 0;
        }
    } else {
        const futureValue = targetPrices[scenarioSelect.value];
        annualGrowthRate = Math.pow(futureValue / startingPrice, 1 / (years - 1)) - 1;
    }

    for (let i = 0; i < years; i++) {
        const year = startYear + i;
        const price = startingPrice * Math.pow(1 + annualGrowthRate, i);
        labels.push(year);
        prices.push(price.toFixed(2));
    }

    return { labels, prices };
}

// Generate the chart
async function generateChart() {
    const currentYear = new Date().getFullYear();

    // Fetch current Bitcoin price
    const currentPrice = await fetchCurrentPrice();
    if (currentPrice === null) {
        // If there's an error fetching the price, do not proceed further
        return;
    }

    // Update current price display
    currentPriceDisplay.innerHTML = `<span class="text-white fw-bold">Current Bitcoin Price: $${currentPrice.toLocaleString()}</span>`;

    // Calculate projected prices
    const { labels, prices } = calculatePrices();

    // Find the index of the current year
    const currentYearIndex = labels.indexOf(currentYear);

    // Get projected price for the current year
    let projectedPriceCurrentYear = null;
    if (currentYearIndex !== -1) {
        projectedPriceCurrentYear = parseFloat(prices[currentYearIndex]);
    }

    // Calculate difference
    let difference = null;
    let isAbove = false;
    let differenceText = '';
    let differenceColor = '';

    if (projectedPriceCurrentYear !== null) {
        difference = currentPrice - projectedPriceCurrentYear;
        isAbove = difference > 0;
        differenceText = isAbove
            ? `+$${difference.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : `-$${Math.abs(difference).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        differenceColor = isAbove ? 'green' : 'red';
    }

    // Prepare datasets
    const projectedData = prices.map(price => parseFloat(price));
    const currentPriceData = labels.map(year => (year === currentYear ? currentPrice : null));

    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Bitcoin Price Projection',
                data: projectedData,
                borderColor: '#ffc107',
                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                fill: true,
                tension: 0.1,
                pointBackgroundColor: '#ffc107',
                pointBorderColor: '#fff',
                pointRadius: 5,
                pointHoverRadius: 7,
            },
            {
                label: 'Current Bitcoin Price',
                data: currentPriceData,
                borderColor: 'transparent',
                backgroundColor: differenceColor,
                pointBackgroundColor: differenceColor,
                pointBorderColor: '#fff',
                pointRadius: labels.map(year => (year === currentYear ? 8 : 0)),
                pointHoverRadius: labels.map(year => (year === currentYear ? 10 : 0)),
                type: 'line',
                fill: false,
                showLine: false,
            },
        ],
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff', // Make legend text white
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return '$' + parseFloat(context.parsed.y).toLocaleString();
                        },
                    },
                },
                // Custom plugin to display the difference text
                afterDraw: function (chart) {
                    if (difference === null) return;
                    const ctx = chart.ctx;
                    const chartArea = chart.chartArea;

                    ctx.save();
                    ctx.font = 'bold 36px Roboto';
                    ctx.fillStyle = differenceColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Position the text in the center-top of the chart
                    ctx.fillText(differenceText, (chartArea.left + chartArea.right) / 2, chartArea.top + 30);
                    ctx.restore();
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function (value, index, values) {
                            return '$' + parseFloat(value).toLocaleString();
                        },
                        color: '#ffffff', // Make y-axis labels white
                    },
                },
                x: {
                    ticks: {
                        color: '#ffffff', // Make x-axis labels white
                    },
                },
            },
        },
    };

    if (priceChart) {
        priceChart.destroy();
    }
    priceChart = new Chart(priceChartCanvas, config);
}

// Generate QR codes after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Generate QR codes for cryptocurrencies
    new QRCode(document.getElementById("qrcode-bitcoin"), "bitcoin:bc1qtast7rja0qr6njgmxq2lepq7ygz8wymf338ggk");
    new QRCode(document.getElementById("qrcode-solana"), "solana:C82DPDGoyQdz8stbGJLkPZjqeFGrsxfpfGoj3iBMq8Cd");
    new QRCode(document.getElementById("qrcode-ethereum"), "ethereum:0xf8a1CcE17fdccFE997D65DAD9429EfF74Eb4B0F6");
    // Note: Buy Me A Coffee QR code is now a static image (bmc_qr.png)
});
