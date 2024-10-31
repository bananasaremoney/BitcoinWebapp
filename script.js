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
        // Default to a placeholder price if there's an error
        return 0;
    }
}

// Calculate the yearly prices
function calculatePrices(startingPrice) {
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
        let price;
        if (year === startYear) {
            price = startingPrice; // Starting price for 2024 is $69,420
        } else {
            price = startingPrice * Math.pow(1 + annualGrowthRate, i);
        }
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

    // Set starting price for projection in 2024 to $69,420
    const startingPrice = 69420;

    // Update current price display
    currentPriceDisplay.innerHTML = `<span class="text-white fw-bold">Current Bitcoin Price: $${currentPrice.toLocaleString()}</span>`;

    // Calculate projected prices
    const { labels, prices } = calculatePrices(startingPrice);

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
        differenceText = isAbove ? `+$${difference.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `-$${Math.abs(difference).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        differenceColor = isAbove ? 'green' : 'red';
    }

    // Prepare point colors
    const pointBackgroundColors = Array(prices.length).fill('#ffc107'); // Default color
    const pointBorderColors = Array(prices.length).fill('#fff'); // Default border color

    if (currentYearIndex !== -1) {
        pointBackgroundColors[currentYearIndex] = isAbove ? 'green' : 'red';
        pointBorderColors[currentYearIndex] = '#fff';
    }

    // Prepare the dataset with updated point colors
    const data = {
        labels: labels,
        datasets: [{
            label: 'Bitcoin Price Projection',
            data: prices,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            fill: true,
            tension: 0.1,
            pointBackgroundColor: pointBackgroundColors,
            pointBorderColor: pointBorderColors,
            pointRadius: prices.map((_, index) => (index === currentYearIndex ? 8 : 5)),
            pointHoverRadius: prices.map((_, index) => (index === currentYearIndex ? 10 : 7)),
            pointHoverBackgroundColor: pointBackgroundColors,
            pointHoverBorderColor: '#fff'
        }]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff' // Make legend text white
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '$' + parseFloat(context.parsed.y).toLocaleString();
                        }
                    }
                },
                // Custom plugin to display the difference text
                afterDraw: function(chart) {
                    if (currentYearIndex === -1 || difference === null) return;
                    const ctx = chart.ctx;
                    const chartArea = chart.chartArea;

                    ctx.save();
                    ctx.font = 'bold 36px Roboto';
                    ctx.fillStyle = differenceColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    // Position the text in the center-top of the chart
                    ctx.fillText(differenceText, (chartArea.left + chartArea.right) / 2, chartArea.top + 50);
                    ctx.restore();
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value, index, values) {
                            return '$' + parseFloat(value).toLocaleString();
                        },
                        color: '#ffffff' // Make y-axis labels white
                    }
                },
                x: {
                    ticks: {
                        color: '#ffffff' // Make x-axis labels white
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
 
