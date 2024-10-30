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
        // Default to 27,000 if there's an error
        return 27000;
    }
}

// Calculate the yearly prices
function calculatePrices(currentPrice) {
    const targetPrices = {
        bear: 3000000,
        base: 13000000,
        bull: 49000000
    };
    const startYear = new Date().getFullYear();
    const endYear = 2045;
    const years = endYear - startYear + 1;
    const labels = [];
    const prices = [];

    let annualGrowthRate;

    if (scenarioSelect.value === 'custom') {
        annualGrowthRate = parseFloat(customGrowthInput.value) / 100;
        if (isNaN(annualGrowthRate)) {
            annualGrowthRate = 0;
        }
    } else {
        const futureValue = targetPrices[scenarioSelect.value];
        annualGrowthRate = Math.pow(futureValue / currentPrice, 1 / (years - 1)) - 1;
    }

    for (let i = 0; i < years; i++) {
        const year = startYear + i;
        const price = currentPrice * Math.pow(1 + annualGrowthRate, i);
        labels.push(year);
        prices.push(price.toFixed(2));
    }

    return { labels, prices };
}

// Generate the chart
async function generateChart() {
    // Show spinner
    currentPriceDisplay.innerHTML = `<span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span> Fetching current Bitcoin price...`;

    const currentPrice = await fetchCurrentPrice();

    // Display the current price
    currentPriceDisplay.innerHTML = `Current Bitcoin Price: $${currentPrice.toLocaleString()}`;

    const { labels, prices } = calculatePrices(currentPrice);

    const data = {
        labels: labels,
        datasets: [{
            label: 'Bitcoin Price Projection',
            data: prices,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            fill: true,
            tension: 0.1,
            pointBackgroundColor: '#ffc107',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#ffc107'
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value, index, values) {
                            return '$' + parseFloat(value).toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + parseFloat(context.parsed.y).toLocaleString();
                        }
                    }
                }
            }
        }
    };

    if (priceChart) {
        priceChart.destroy();
    }
    priceChart = new Chart(priceChartCanvas, config);
}
