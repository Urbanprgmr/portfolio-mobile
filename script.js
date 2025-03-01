// script.js
document.addEventListener("DOMContentLoaded", function () {
    const cryptoSearch = document.getElementById("cryptoSearch");
    const cryptoSelect = document.getElementById("cryptoSelect");
    const cryptoQuantity = document.getElementById("cryptoQuantity");
    const cryptoCost = document.getElementById("cryptoCost");
    const addCryptoBtn = document.getElementById("addCryptoBtn");
    const portfolioTable = document.getElementById("portfolioTable").getElementsByTagName("tbody")[0];
    const priceTargetsContainer = document.getElementById("priceTargetsContainer");

    let allCryptos = [];

    // Fetch all cryptocurrencies from CoinGecko API
    async function fetchAllCryptos() {
        try {
            const response = await fetch("https://api.coingecko.com/api/v3/coins/list");
            allCryptos = await response.json();
            populateCryptoSelect(allCryptos);
        } catch (error) {
            console.error("Error fetching cryptos:", error);
        }
    }

    // Populate the crypto select dropdown
    function populateCryptoSelect(cryptos) {
        cryptos.forEach(crypto => {
            const option = document.createElement("option");
            option.value = crypto.id;
            option.textContent = `${crypto.name} (${crypto.symbol.toUpperCase()})`;
            cryptoSelect.appendChild(option);
        });
    }

    // Add crypto to portfolio
    addCryptoBtn.addEventListener("click", function () {
        const cryptoId = cryptoSelect.value;
        const quantity = parseFloat(cryptoQuantity.value);
        const cost = parseFloat(cryptoCost.value);

        if (cryptoId && quantity && cost) {
            const crypto = allCryptos.find(c => c.id === cryptoId);
            addCryptoToPortfolio(crypto.name, crypto.symbol.toUpperCase(), quantity, cost);
            cryptoSelect.value = "";
            cryptoQuantity.value = "";
            cryptoCost.value = "";
            savePortfolio();
        } else {
            alert("Please fill in all fields.");
        }
    });

    // Add crypto to the table
    function addCryptoToPortfolio(name, symbol, quantity, cost) {
        const row = portfolioTable.insertRow();
        row.setAttribute("data-symbol", symbol);

        const nameCell = row.insertCell(0);
        const symbolCell = row.insertCell(1);
        const quantityCell = row.insertCell(2);
        const costCell = row.insertCell(3);
        const currentPriceCell = row.insertCell(4);
        const totalValueCell = row.insertCell(5);
        const profitLossCell = row.insertCell(6);
        const priceTargetsCell = row.insertCell(7);
        const actionCell = row.insertCell(8);

        nameCell.textContent = name;
        symbolCell.textContent = symbol;
        quantityCell.textContent = quantity;
        costCell.textContent = `$${cost.toFixed(2)}`;
        currentPriceCell.textContent = "Loading...";
        totalValueCell.textContent = "Loading...";
        profitLossCell.textContent = "Loading...";

        // Price Targets Section
        const priceTargetsDiv = document.createElement("div");
        priceTargetsDiv.classList.add("price-targets");

        for (let i = 1; i <= 3; i++) {
            const targetDiv = document.createElement("div");
            targetDiv.classList.add("price-target");

            const multiplierInput = document.createElement("input");
            multiplierInput.type = "number";
            multiplierInput.placeholder = `Target ${i}`;
            multiplierInput.addEventListener("input", function () {
                updateProfit(row, multiplierInput.value, i);
            });

            const profitSpan = document.createElement("span");
            profitSpan.textContent = "Profit: $0.00";

            targetDiv.appendChild(multiplierInput);
            targetDiv.appendChild(profitSpan);
            priceTargetsDiv.appendChild(targetDiv);
        }

        priceTargetsCell.appendChild(priceTargetsDiv);

        // Action Buttons
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("editBtn");
        editBtn.addEventListener("click", function () {
            editCrypto(row);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("deleteBtn");
        deleteBtn.addEventListener("click", function () {
            row.remove();
            savePortfolio();
        });

        actionCell.appendChild(editBtn);
        actionCell.appendChild(deleteBtn);

        // Fetch current price
        fetchCurrentPrice(symbol, quantity, cost, currentPriceCell, totalValueCell, profitLossCell);
    }

    // Fetch current price from CoinGecko API
    async function fetchCurrentPrice(symbol, quantity, cost, currentPriceCell, totalValueCell, profitLossCell) {
        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`);
            const data = await response.json();
            const currentPrice = data[symbol.toLowerCase()].usd;

            currentPriceCell.textContent = `$${currentPrice.toFixed(2)}`;
            const totalValue = quantity * currentPrice;
            totalValueCell.textContent = `$${totalValue.toFixed(2)}`;

            const profitLoss = totalValue - quantity * cost;
            profitLossCell.textContent = `$${profitLoss.toFixed(2)}`;
            profitLossCell.style.color = profitLoss >= 0 ? "green" : "red";
        } catch (error) {
            console.error("Error fetching price:", error);
            currentPriceCell.textContent = "Error";
            totalValueCell.textContent = "Error";
            profitLossCell.textContent = "Error";
        }
    }

    // Update profit for price targets
    function updateProfit(row, multiplier, targetIndex) {
        const quantity = parseFloat(row.cells[2].textContent);
        const cost = parseFloat(row.cells[3].textContent.replace("$", ""));
        const currentPrice = parseFloat(row.cells[4].textContent.replace("$", ""));

        if (multiplier && !isNaN(multiplier)) {
            const targetPrice = currentPrice * multiplier;
            const profit = (targetPrice - cost) * quantity;
            const profitSpan = row.cells[7].querySelectorAll("span")[targetIndex - 1];
            profitSpan.textContent = `Profit: $${profit.toFixed(2)}`;
        }
    }

    // Edit crypto details
    function editCrypto(row) {
        const name = row.cells[0].textContent;
        const symbol = row.cells[1].textContent;
        const quantity = parseFloat(row.cells[2].textContent);
        const cost = parseFloat(row.cells[3].textContent.replace("$", ""));

        const newQuantity = prompt("Enter new quantity:", quantity);
        const newCost = prompt("Enter new average cost:", cost);

        if (newQuantity && newCost) {
            row.cells[2].textContent = newQuantity;
            row.cells[3].textContent = `$${parseFloat(newCost).toFixed(2)}`;
            savePortfolio();
            fetchCurrentPrice(symbol, newQuantity, newCost, row.cells[4], row.cells[5], row.cells[6]);
        }
    }

    // Save portfolio to local storage
    function savePortfolio() {
        const portfolio = [];
        portfolioTable.querySelectorAll("tr").forEach(function (row) {
            const name = row.cells[0].textContent;
            const symbol = row.cells[1].textContent;
            const quantity = parseFloat(row.cells[2].textContent);
            const cost = parseFloat(row.cells[3].textContent.replace("$", ""));
            portfolio.push({ name, symbol, quantity, cost });
        });
        localStorage.setItem("portfolio", JSON.stringify(portfolio));
    }

    // Load portfolio from local storage
    function loadPortfolio() {
        const portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
        portfolio.forEach(function (crypto) {
            addCryptoToPortfolio(crypto.name, crypto.symbol, crypto.quantity, crypto.cost);
        });
    }

    // Initialize
    fetchAllCryptos();
    loadPortfolio();
});
