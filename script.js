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

// Fetch the current Bitcoin price from CoinGecko API or set to $69,420 if 2024
async function fetchCurrentPrice(currentYear) {
    try {
        if (currentYear === 2024) {
            return 69420;
        } else {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            const data = await response.json();
            const currentPrice = data.bitcoin.usd;
            return currentPrice;
        }
    } catch (error) {
        console.error('Error fetching current Bitcoin price:', error);
        // Default to 69,420 if there's an error
        return 69420;
    }
}

// Calculate the yearly prices
function calculatePrices(currentPrice, currentYear) {
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
        annualGrowthRate = Math.pow(futureValue / currentPrice, 1 / (years - 1)) - 1;
    }
    
    for (let i = 0; i < years; i++) {
        const year = startYear + i;
        let price;
        if (year === startYear) {
            price = currentPrice; // Starting price for 2024
        } else {
            price = currentPrice * Math.pow(1 + annualGrowthRate, i);
        }
        labels.push(year);
        prices.push(price.toFixed(2));
    }
    
    return { labels, prices };
}

// Generate the chart
async function generateChart() {
    const currentYear = new Date().getFullYear();
    
    // Show spinner
    currentPriceDisplay.innerHTML = `<span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
    Fetching current Bitcoin price...`;
    
    const currentPrice = await fetchCurrentPrice(currentYear);
    
    // Calculate prices
    const { labels, prices } = calculatePrices(currentPrice, currentYear);
    
    // Determine if current year is within the chart range
    if (currentYear < 2024 || currentYear > 2045) {
        currentPriceDisplay.innerHTML = `<span class="text-white fw-bold">Current year is out of the projection range (2024-2045).</span>`;
    } else {
        // Get target price for current year
        const targetPrices = {
            bear: 3000000,
            base: 13000000,
            bull: 49000000
        };
        const scenario = scenarioSelect.value;
        const targetPrice = targetPrices[scenario];
        
        // Calculate difference
        const difference = currentPrice - targetPrice;
        const isAbove = difference > 0;
        const differenceText = isAbove ? `+$${difference.toLocaleString()}` : `-$${Math.abs(difference).toLocaleString()}`;
        const differenceColor = isAbove ? 'green' : 'red';
        
        // Update current price display
        currentPriceDisplay.innerHTML = `<span class="text-white fw-bold">Current Bitcoin Price: $${currentPrice.toLocaleString()}</span>`;
        
        // Prepare point colors
        const pointBackgroundColors = Array(prices.length).fill('#ffc107'); // Default color
        const pointBorderColors = Array(prices.length).fill('#fff'); // Default border color
        
        // Find the index of the current year
        const currentYearIndex = labels.indexOf(currentYear);
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
                        if (currentYearIndex === -1) return;
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
}
