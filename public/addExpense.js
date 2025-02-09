
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

    const income = category === "Salary" ? amount : 0;
    const expense = category !== "Salary" ? amount : 0;

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
 

document.addEventListener("DOMContentLoaded", function () {
    fetchExpenses(currentPage); // Ensure it starts with the correct page
});

let currentPage = 1;
let totalPages = 1;
const itemsPerPage = 10; // Adjust as needed

// ** Fetch & Display Expenses in Table **
function fetchExpenses(page = 1) { // Accept page as a parameter
    const token = localStorage.getItem("token");

    if (!token) {
        alert("User is not authenticated");
        return;
    }

    axios.get(`/fetch-expenses?page=${page}&limit=${itemsPerPage}`, { // Pass page & limit to backend
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        console.log("Fetched expenses:", res.data.expenses);
        const expenses = res.data.expenses;
        const expenseList = document.getElementById("expense-list");
        expenseList.innerHTML = ''; // Clear previous data

        if (expenses.length > 0) {
            const isPremium = expenses[0].is_premium;
            console.log("Premium Status:", isPremium);

            if (isPremium) {
                document.getElementById("rzp-btn").style.visibility = "hidden";
                document.getElementById("status-msg").innerText = "You are a premium user";
                document.getElementById("leaderboard-btn").style.display = "block";
                document.getElementById("download-btn").style.display = "block";  // Show download button for premium users
            }
        }

        // Select table body where data will be inserted
        const tbody = document.getElementById("expense-list");
        tbody.innerHTML = "";

        totalPages = res.data.totalPages;
        document.getElementById("page-info").innerText = `Page ${currentPage} of ${totalPages}`;

        // Enable/Disable buttons
        document.getElementById("prev-btn").disabled = currentPage === 1;
        document.getElementById("next-btn").disabled = currentPage === totalPages;

        let totalExpense = 0;
        let totalIncome = 0;
        let Saving = 0;

        expenses.forEach(expense => {
            const tr = document.createElement("tr");

            // Format date properly
            const date = new Date(expense.created_at).toLocaleDateString();

            tr.innerHTML = `
                <td>${date}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td>₹${expense.income}</td>
                <td>₹${expense.amount}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">Delete</button>
                </td>
            `;

            tbody.appendChild(tr);
            totalIncome += parseFloat(expense.income);
            totalExpense += parseFloat(expense.amount);
            Saving = totalIncome - totalExpense;
        });

        // Add Total Row
        const totalRow = document.createElement("tr");
        totalRow.innerHTML = `
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>₹${totalIncome.toFixed(2)}</strong></td>
            <td><strong>₹${totalExpense.toFixed(2)}</strong></td>
            <td></td>
        `;
        const savings = document.createElement("tr");
        savings.innerHTML = `<td colspan="6"><strong>Savings = ₹${Saving.toFixed(2)}</strong></td>`;

        tbody.appendChild(totalRow);
        tbody.appendChild(savings);
    })
    .catch(err => {
        console.error("Error fetching expenses:", err);
        alert("Error fetching expenses");
    });
}

// ** Pagination Buttons Event Listeners **
document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchExpenses(currentPage);
    }
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchExpenses(currentPage);
    }
});


document.getElementById("download-btn").addEventListener("click", function () {
    let pagesToDownload = parseInt(prompt(`Enter the number of pages to download (Max: ${totalPages}):`), 10);

    if (!pagesToDownload || pagesToDownload < 1 || pagesToDownload > totalPages) {
        alert(`Invalid input! Please enter a number between 1 and ${totalPages}`);
        return;
    }

    downloadTableAsPDF(pagesToDownload);
});

function downloadTableAsPDF(pagesToDownload) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let allExpenses = [];

    function fetchPage(page) {
        return axios.get(`/fetch-expenses?page=${page}&limit=${itemsPerPage}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }).then(res => res.data.expenses);
    }

    // Fetch data from multiple pages
    let fetchPromises = [];
    for (let i = 1; i <= pagesToDownload; i++) {
        fetchPromises.push(fetchPage(i));
    }

    Promise.all(fetchPromises).then(pages => {
        pages.forEach(expenses => {
            allExpenses = allExpenses.concat(expenses);
        });

        if (allExpenses.length === 0) {
            alert("No expenses found to download.");
            return;
        }

        doc.setFont("helvetica", "normal");
        doc.text("Expense Report", 14, 10); // Title

        const headers = ["Date", "Description", "Category", "Income (Rs.)", "Expense (Rs.)"];
        let data = [];
        let totalIncome = 0;
        let totalExpense = 0;

        allExpenses.forEach(expense => {
            const date = new Date(expense.created_at).toLocaleDateString();
            data.push([date, expense.description, expense.category, `Rs. ${expense.income}`, `Rs. ${expense.amount}`]);

            totalIncome += parseFloat(expense.income);
            totalExpense += parseFloat(expense.amount);
        });

        let totalSavings = totalIncome - totalExpense;

        // Add Total & Savings Rows
        data.push(["", "", "Total", `Rs. ${totalIncome.toFixed(2)}`, `Rs. ${totalExpense.toFixed(2)}`]);
        data.push(["", "", "", "", `Savings = Rs. ${totalSavings.toFixed(2)}`]);

        // Generate PDF Table
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 20,
            theme: "grid",
            styles: { fontSize: 10 },
        });

        doc.save("Expenses_Report.pdf");
    }).catch(err => {
        console.error("Error downloading expenses:", err);
        alert("Error downloading expenses");
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
                name: 'User Name', // Replace with actual user name
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
         users.sort((a, b) => b.total_expense - a.total_expense); // Sort users by expense (descending)

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