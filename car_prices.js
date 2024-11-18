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
    }).filter(row => row && row["Price (in USD)"]);

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
        renderChart(data, event.target.value);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const filePath = "./Sport_car_price.csv";
    try {
        const carData = await loadCSV(filePath);
        populateBrandFilter(carData);
        renderChart(carData);
    } catch (error) {
        console.error("Erreur lors du chargement ou du rendu des données :", error);
    }
});
