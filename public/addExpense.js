
document.getElementById('expense-form').addEventListener('submit', function(event) {
    // event.preventDefault();
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const token = localStorage.getItem('token');

    console.log('Sending data:', { token, amount, description, category });

    if (!token) {
        alert('User is not authenticated');
        return;
    }

    axios.post('/add-expense', { amount, description, category }, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        console.log('Expense added:', res.data);
        alert(res.data.message);
        fetchExpenses();
    })
    .catch(err => {
        console.error('Error adding expense:', err);
        alert('Error adding expense');
    });
});


function fetchExpenses() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('User is not authenticated');
        return;
    }
     
    axios.get('/fetch-expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        console.log("Fetched expenses:", res.data.expenses); // Debugging log
        const expenses = res.data.expenses;
        const expenseList = document.getElementById('expense-list');
        expenseList.innerHTML = '';

        if (expenses.length > 0) {
            const isPremium = expenses[0].is_premium;  // Extract `is_premium`
            console.log("Premium Status:", isPremium); // Debugging

            if (isPremium) {
                document.getElementById('rzp-btn').style.visibility = "hidden";
                document.getElementById('status-msg').innerText = "You are a premium user";
                document.getElementById('leaderboard-btn').style.display = "block";

            }
        }

        expenses.forEach(expense => {
            const expenseItem = document.createElement('div');
    
            expenseItem.innerText = `${expense.amount} - ${expense.description} (${expense.category})`;

            const deleteButton = document.createElement('button');
            deleteButton.innerText = 'Delete';
            deleteButton.onclick = function() {
                console.log('Expense ID to delete:', expense.id); // Debugging: Log the expenseId
                deleteExpense(expense.id);
            };

            expenseItem.appendChild(deleteButton);
            expenseList.appendChild(expenseItem);
        });
    })
    .catch(err => {
        console.error('Error fetching expenses:', err);
        alert('Error fetching expenses');
    });
    
    
}

function deleteExpense(expenseId) {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('User is not authenticated');
        return;
    }
    console.log('Deleting expense with ID:', expenseId); // Debugging: Log the expenseId

    axios.delete(`/delete-expense/${expenseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        alert(res.data.message);
        fetchExpenses();
    })
    .catch(err => {
        console.error('Error deleting expense:', err);
        alert('Error deleting expense');
    });
}


//razorpay 
document.getElementById('rzp-btn').onclick = async function (e) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId'); // Retrieve userId as well

    if (!token || !userId) {
        alert('User is not authenticated');
        return;
    }

    try {
        // Fetch order details from the backend
        const response = await axios.get('http://localhost:3000/purchase/premiummembership', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const { key_id, order } = response.data;

        // Razorpay options
        const options = {
            key: key_id, // Razorpay key ID
            order_id: order.id, // Order ID
            handler: async function (response) {
                try {
                    // Update transaction status on successful payment
                    await axios.post('http://localhost:3000/purchase/updatetransactionstatus', {
                        order_id: order.id,
                        payment_id: response.razorpay_payment_id,
                        status: 'SUCCESSFUL'
                    }, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    alert('Transaction successful! You are now a premium user.');
                    document.getElementById('rzp-btn').style.visibility = "hidden";
                    document.getElementById('status-msg').innerText = "You are premium user";
                    
                } catch (error) {
                    console.error('Error updating transaction status:', error);
                    alert('Transaction successful, but failed to update status. Please contact support.');
                }
            },
            prefill: {
                name: 'User    Name', // Replace with actual user name
                email: 'user@example.com', // Replace with actual user email
            },
            theme: {
                color: '#F37254'
            }
        };

        // Open Razorpay payment modal
        const rzp = new Razorpay(options);
        rzp.open();

        // Handle payment failure
        rzp.on('payment.failed', async function (response) {
            try {
                await axios.post('http://localhost:3000/purchase/updatetransactionstatus', {
                    order_id: order.id,
                    payment_id: response.error.metadata.payment_id,
                    status: 'FAILED'
                }, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                alert('Transaction failed. Please try again.');
            } catch (error) {
                console.error('Error updating transaction status:', error);
                alert('Transaction failed, and status update failed. Please contact support.');
            }
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        alert('Error initiating payment. Please try again.');
    }
};



document.getElementById('leaderboard-btn').addEventListener('click', function() {
    console.log("hii");
    const token = localStorage.getItem('token');
    console.log(token);
    axios.get('/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        const leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = "<h2>Leaderboard</h2>";

        const users = res.data.leaderboard[0];
        console.log(users);
        // users.sort((a, b) => b.total_expense - a.total_expense); // Sort users by expense (descending)

        users.forEach(user => {
            console.log(user.name);
            const userEntry = document.createElement('div');
            userEntry.innerText = `name: ${user.name} - total expenses: ₹${user.total_expense}`;
            leaderboardDiv.appendChild(userEntry);
        });
    })
    .catch(err => {
        console.log('Error fetching leaderboard:', err);
        alert('Error fetching leaderboard');
    });
});



// Call fetchExpenses on page load
fetchExpenses();