const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const categoryInput = document.getElementById('category');

// Chart instance
let expenseChart = null;

// Get transactions from local storage
const localStorageTransactions = JSON.parse(
    localStorage.getItem('transactions')
);

let transactions =
    localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a text and amount');
    } else {
        const transaction = {
            id: generateID(),
            text: text.value,
            amount: +amount.value,
            category: categoryInput.value
        };

        transactions.push(transaction);

        addTransactionDOM(transaction);

        updateValues();

        updateLocalStorage();

        text.value = '';
        amount.value = '';
        
        text.focus();
    }
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Format money
function formatMoney(number) {
    return '₹' + number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('li');

    // Add class based on value
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
    
    // Provide a default category if it's an old transaction without one
    const catDisplay = transaction.category ? ` <span style="font-size: 0.7rem; color: var(--text-secondary); margin-left: 5px;">(${transaction.category})</span>` : '';

    item.innerHTML = `
        <span class="desc">${transaction.text}${catDisplay}</span> 
        <span class="amt">${sign}${formatMoney(Math.abs(transaction.amount))}</span>
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})"><i class="fas fa-trash"></i></button>
    `;

    list.appendChild(item);
    
    // Scroll to bottom
    list.scrollTop = list.scrollHeight;
}

// Animation state variables
let prevTotal = 0;
let prevIncome = 0;
let prevExpense = 0;

// Animate number counting
function animateValue(element, start, end, duration, formatter) {
    if (element.animationId) {
        window.cancelAnimationFrame(element.animationId);
    }
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function: easeOutQuart for premium feel
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentVal = start + (end - start) * easeProgress;
        
        element.innerText = formatter(currentVal);
        
        if (progress < 1) {
            element.animationId = window.requestAnimationFrame(step);
        } else {
            element.innerText = formatter(end);
            element.animationId = null;
        }
    };
    element.animationId = window.requestAnimationFrame(step);
}

// Update the balance, income and expense
function updateValues(isInitialLoad = false) {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
        -1
    );

    // If initial load, start from 0 for the premium feel
    if (isInitialLoad) {
        prevTotal = 0;
        prevIncome = 0;
        prevExpense = 0;
    }

    animateValue(balance, prevTotal, total, 1000, (val) => formatMoney(val));
    animateValue(money_plus, prevIncome, income, 1000, (val) => `+${formatMoney(val)}`);
    animateValue(money_minus, prevExpense, expense, 1000, (val) => `-${formatMoney(val)}`);

    prevTotal = total;
    prevIncome = income;
    prevExpense = expense;
    
    updateChart();
}

// Chart Logic
function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Filter only expenses for the pie chart
    const expenses = transactions.filter(t => t.amount < 0);
    
    if (expenses.length === 0) {
        if (expenseChart) expenseChart.destroy();
        return;
    }
    
    // Group by category
    const categoryTotals = {};
    expenses.forEach(t => {
        const cat = t.category || "General";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    const chartConfig = {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#ef4444', // Red
                    '#f59e0b', // Orange
                    '#10b981', // Emerald
                    '#3b82f6', // Blue
                    '#8b5cf6', // Purple
                    '#ec4899', // Pink
                    '#6366f1'  // Indigo
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#94a3b8',
                        font: {
                            family: 'Outfit'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ' ₹' + context.raw.toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            },
            cutout: '70%'
        }
    };
    
    if (expenseChart) {
        expenseChart.data = chartConfig.data;
        expenseChart.update();
    } else {
        expenseChart = new Chart(ctx, chartConfig);
    }
}

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);

    updateLocalStorage();

    init();
}

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init app
function init(isInitialLoad = false) {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues(isInitialLoad);
}

init(true);

form.addEventListener('submit', addTransaction);

// --- Modal & History Spreadsheet Logic ---

const viewAllBtn = document.getElementById('view-all-btn');
const historyModal = document.getElementById('history-modal');
const closeModal = document.getElementById('close-modal');
const historyTbody = document.getElementById('history-tbody');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Show modal and populate table
viewAllBtn.addEventListener('click', () => {
    historyModal.classList.add('show');
    populateHistoryTable();
});

// Hide modal
closeModal.addEventListener('click', () => {
    historyModal.classList.remove('show');
});

// Hide modal on outside click
window.addEventListener('click', (e) => {
    if (e.target === historyModal) {
        historyModal.classList.remove('show');
    }
});

function populateHistoryTable() {
    historyTbody.innerHTML = '';
    
    if (transactions.length === 0) {
        historyTbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: var(--text-secondary);">No transactions found.</td></tr>';
        return;
    }

    transactions.forEach(transaction => {
        const tr = document.createElement('tr');
        const type = transaction.amount > 0 ? 'Income' : 'Expense';
        const typeClass = transaction.amount > 0 ? 'income' : 'expense';
        const sign = transaction.amount < 0 ? '-' : '+';
        const catDisplay = transaction.category ? transaction.category : 'General';
        
        tr.innerHTML = `
            <td>${transaction.text} <br><small style="color:var(--text-secondary);">${catDisplay}</small></td>
            <td><span class="type-badge ${typeClass}">${type}</span></td>
            <td style="font-weight: 600; color: var(--${typeClass}-color)">${sign}${formatMoney(Math.abs(transaction.amount))}</td>
            <td><button class="delete-btn" style="position: static; transform: none; opacity: 1; padding: 6px 12px; border-radius: 6px;" onclick="removeTransactionFromTable(${transaction.id})"><i class="fas fa-trash"></i></button></td>
        `;
        historyTbody.appendChild(tr);
    });
}

// Custom handler to remove from table and refresh it
window.removeTransactionFromTable = function(id) {
    removeTransaction(id);
    populateHistoryTable(); // refresh table view
};

// Export to CSV
exportCsvBtn.addEventListener('click', () => {
    if (transactions.length === 0) {
        alert("No transactions to export.");
        return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Description,Type,Amount\n"; // Header row
    
    transactions.forEach(t => {
        const type = t.amount > 0 ? 'Income' : 'Expense';
        // Wrap text in quotes just in case there are commas in description
        csvContent += `"${t.text}",${type},${t.amount}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expense_tracker_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});