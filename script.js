let npkChart, soilMoistureChart, phChart;
let soilMoistureTimer, phTimer; // Timers for soil moisture and pH updates

document.addEventListener("DOMContentLoaded", () => {
    initializeCharts();
    fetchData(); // Fetch initial data for the default zone
});

// Initialize all charts with empty data
function initializeCharts() {
    const ctxNPK = document.getElementById("npkChart").getContext("2d");
    const ctxSoilMoisture = document.getElementById("soilMoistureChart").getContext("2d");
    const ctxPH = document.getElementById("phChart").getContext("2d");

    // NPK Pie Chart
    npkChart = new Chart(ctxNPK, {
        type: "pie",
        data: {
            labels: ["Nitrogen", "Phosphorus", "Potassium"],
            datasets: [
                {
                    label: "Nutrient Levels",
                    data: [],
                    backgroundColor: ['rgb(255, 99, 132)', 'rgb(54, 162, 235)', 'rgb(255, 206, 86)'],
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: "bottom",
                },
            },
        },
    });

    // Soil Moisture Line Chart
    soilMoistureChart = new Chart(ctxSoilMoisture, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label: "Soil Moisture (%)",
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 2,
                    tension: 0.1,
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Timestamps",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "Soil Moisture (%)",
                    },
                },
            },
        },
    });

    // pH Bar Chart
    phChart = new Chart(ctxPH, {
        type: "bar",
        data: {
            labels: [],
            datasets: [
                {
                    label: "pH Levels",
                    data: [],
                    backgroundColor: 'rgb(153, 102, 255)',
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Timestamps",
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: "pH Levels",
                    },
                },
            },
        },
    });
}

// Fetch data from API
async function fetchData() {
    const selectedZone = document.getElementById("zoneSelect").value;
    try {
        const response = await fetch("https://bad7vxj7yh.execute-api.ap-south-1.amazonaws.com/SugarcaneS3"); // Replace with your actual API URL
        const result = await response.json();
        const zoneData = result.body[`zone_${selectedZone}`];

        if (zoneData) {
            updateCharts(zoneData);
            startTimers(zoneData); // Restart timers for the new zone data
        } else {
            console.error("No data available for the selected zone");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Update charts with fetched data
function updateCharts(data) {
    const nitrogen = data.map(item => parseFloat(item.Nitrogen));
    const phosphorus = data.map(item => parseFloat(item.Phosphorus));
    const potassium = data.map(item => parseFloat(item.Potassium));

    // Calculate average NPK levels
    const avgNitrogen = nitrogen.reduce((a, b) => a + b, 0) / nitrogen.length;
    const avgPhosphorus = phosphorus.reduce((a, b) => a + b, 0) / phosphorus.length;
    const avgPotassium = potassium.reduce((a, b) => a + b, 0) / potassium.length;

    // Update NPK Pie Chart
    npkChart.data.datasets[0].data = [avgNitrogen, avgPhosphorus, avgPotassium];
    npkChart.update();

    // Check NPK levels and trigger alerts
    if (avgNitrogen < 15 || avgPhosphorus < 15 || avgPotassium < 15) {
        alert("NPK levels are low. Apply necessary fertilizers!");
    }

    // Initialize soil moisture and pH charts with empty data
    soilMoistureChart.data.labels = [];
    soilMoistureChart.data.datasets[0].data = [];
    phChart.data.labels = [];
    phChart.data.datasets[0].data = [];
}

// Start or restart timers for soil moisture and pH
function startTimers(data) {
    if (soilMoistureTimer) clearInterval(soilMoistureTimer);
    if (phTimer) clearInterval(phTimer);

    let soilMoistureIndex = 0;
    let phIndex = 0;

    // Soil Moisture Timer
    soilMoistureTimer = setInterval(() => {
        if (soilMoistureIndex < data.length) {
            const item = data[soilMoistureIndex];
            const soilMoistureValue = parseFloat(item.SoilMoisture);
            const timestamp = item.Timestamp;

            soilMoistureChart.data.labels.push(timestamp);
            soilMoistureChart.data.datasets[0].data.push(soilMoistureValue);

            if (soilMoistureChart.data.labels.length > 10) {
                soilMoistureChart.data.labels.shift();
                soilMoistureChart.data.datasets[0].data.shift();
            }

            soilMoistureChart.update();

            // Trigger soil moisture alerts
            if (soilMoistureValue < 40) {
                alert("Soil moisture is low. Sprinkler is turned ON.");
            } else if (soilMoistureValue > 70) {
                alert("Soil moisture is high. Sprinkler is turned OFF.");
            }

            soilMoistureIndex++;
        } else {
            clearInterval(soilMoistureTimer); // Stop timer when all data points are displayed
        }
    }, 5000); // Update every 5 seconds

    // pH Timer
    phTimer = setInterval(() => {
        if (phIndex < data.length) {
            const item = data[phIndex];
            const phValue = parseFloat(item.pH);
            const timestamp = item.Timestamp;

            phChart.data.labels.push(timestamp);
            phChart.data.datasets[0].data.push(phValue);

            if (phChart.data.labels.length > 10) {
                phChart.data.labels.shift();
                phChart.data.datasets[0].data.shift();
            }

            phChart.update();
            phIndex++;
        } else {
            clearInterval(phTimer); // Stop timer when all data points are displayed
        }
    }, 5000); // Update every 5 seconds
}
