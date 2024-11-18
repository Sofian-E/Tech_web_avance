async function loadCSV(filePath) {
    const response = await fetch(filePath);
    const text = await response.text();
    return parseCSV(text);
}

function parseCSV(content) {
    const lines = content.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",");

    const data = lines.slice(1).map(line => {
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/"/g, "").trim());
        if (values.length === headers.length) {
            return headers.reduce((acc, header, index) => {
                acc[header.trim()] = values[index];
                return acc;
            }, {});
        }
        return null;
    }).filter(row => row && row["Price (in USD)"] && row["0-60 MPH Time (seconds)"] && row["Horsepower"]);

    return removeDuplicates(data, "Car Model");
}

function removeDuplicates(data, key) {
    const seen = new Set();
    return data.filter(item => {
        const duplicate = seen.has(item[key]);
        seen.add(item[key]);
        return !duplicate;
    });
}

function renderChart(data, brand = "all") {
    const filteredData = brand === "all" ? data : data.filter(car => car["Car Make"] === brand);
    const labels = filteredData.map(car => car["Car Model"]);
    const prices = filteredData.map(car => parseFloat(car["Price (in USD)"].replace(/,/g, "")));

    const ctx = document.getElementById('priceChart').getContext('2d');
    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Price (USD) - ${brand}`,
                data: prices,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `$${value.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

function renderAccelerationChart(data, brand = "all") {
    const filteredData = brand === "all" ? data : data.filter(car => car["Car Make"] === brand);
    const labels = filteredData.map(car => car["Car Model"]);
    const accelerationTimes = filteredData.map(car => parseFloat(car["0-60 MPH Time (seconds)"]));

    const ctx = document.getElementById('accelerationChart').getContext('2d');
    if (window.myAccelerationChart) {
        window.myAccelerationChart.destroy();
    }

    window.myAccelerationChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `0-60 MPH Time (seconds) - ${brand}`,
                data: accelerationTimes,
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} seconds`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return `${value} s`;
                        }
                    }
                }
            }
        }
    });
}

function renderHorsepowerChart(data, brand = "all") {
    const filteredData = brand === "all" ? data : data.filter(car => car["Car Make"] === brand);
    const labels = filteredData.map(car => car["Car Model"]);
    const horsepowerValues = filteredData.map(car => parseFloat(car["Horsepower"]));

    const ctx = document.getElementById('horsepowerChart').getContext('2d');
    if (window.myHorsepowerChart) {
        window.myHorsepowerChart.destroy();
    }

    window.myHorsepowerChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Horsepower - ${brand}`,
                data: horsepowerValues,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function populateBrandFilter(data) {
    const uniqueBrands = Array.from(new Set(data.map(car => car["Car Make"])));
    const select = document.getElementById("brandFilter");
    uniqueBrands.forEach(brand => {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
        updateChart(data, event.target.value);
    });
}

function updateChart(data, brand) {
    const chartSelector = document.getElementById('chartSelector').value;

    document.querySelectorAll('canvas').forEach(canvas => {
        canvas.style.display = 'none';
    });

    if (chartSelector === 'priceChart') {
        document.getElementById('priceChart').style.display = 'block';
        renderChart(data, brand);
    } else if (chartSelector === 'accelerationChart') {
        document.getElementById('accelerationChart').style.display = 'block';
        renderAccelerationChart(data, brand);
    } else if (chartSelector === 'horsepowerChart') {
        document.getElementById('horsepowerChart').style.display = 'block';
        renderHorsepowerChart(data, brand);
    }
}

document.getElementById('chartSelector').addEventListener('change', () => {
    updateChart(window.currentData, document.getElementById('brandFilter').value);
});

document.addEventListener("DOMContentLoaded", async () => {
    const filePath = "./Sport_car_price.csv";
    try {
        const carData = await loadCSV(filePath);
        window.currentData = carData;
        populateBrandFilter(carData);
        updateChart(carData, 'all');
    } catch (error) {
        console.error("Erreur lors du chargement ou du rendu des données :", error);
    }
});
