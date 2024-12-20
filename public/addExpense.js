document.getElementById('expense-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission

    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const userId = localStorage.getItem('userId'); // Get userId from localStorage

    console.log('Sending data:', { userId, amount, description, category });
    
    // Send expense data to the server
    axios.post('/add-expense', { userId, amount, description, category })
        .then(res => {
            alert(res.data.message);
            fetchExpenses(); // Refresh the expense list
        })
        .catch(err => {
            console.error('Error adding expense:', err);
        });
});

// Function to fetch and display expenses
function fetchExpenses() {
    const userId = localStorage.getItem('userId'); // Get userId from localStorage

    axios.get(`/fetch-expenses?userId=${userId}`)
        .then(res => {
            const expenses = res.data.expenses;
            const expenseList = document.getElementById('expense-list');
            expenseList.innerHTML = ''; // Clear previous expenses

            expenses.forEach(expense => {
                const expenseItem = document.createElement('div');
                expenseItem.innerText = `${expense.amount} - ${expense.description} (${expense.category})`;
                expenseList.appendChild(expenseItem);
            });
        })
        .catch(err => {
            console.error(' Error fetching expenses:', err);
        });
}

// Fetch expenses on page load
window.onload = fetchExpenses;