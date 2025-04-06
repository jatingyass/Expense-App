
//-----------------------add expense functionality-----------------------------

document.getElementById('expense-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const token = localStorage.getItem('token');

    console.log('Sending data:', { token, amount, description, category });

    if (!token) {
        alert('User is not authenticated');
        return;
    }

    axios.post('/add-expense', 
        { amount, description, category }, 
        { headers: { 'Authorization': `Bearer ${token}` } }
    )
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



//----------------fetch functionality-------------------------------------
document.addEventListener("DOMContentLoaded", function () {
    const savedLimit = localStorage.getItem("expensesPerPage");
    itemsPerPage = savedLimit ? parseInt(savedLimit, 10) : 10;
    
    
    // Check if user is premium from localStorage
    const isPremium = localStorage.getItem("isPremium") === 'true';
    
    if (isPremium) {
        document.getElementById("rzp-btn").style.visibility = "hidden";
        document.getElementById("status-msg").innerText = "You are a premium user";
        document.getElementById("leaderboard-btn").style.display = "block";
        document.getElementById("download-btn").style.display = "block";
    } else {
        document.getElementById("rzp-btn").style.visibility = "visible";
        document.getElementById("status-msg").innerText = "You are not a premium user";
        document.getElementById("leaderboard-btn").style.display = "none";
        document.getElementById("download-btn").style.display = "none";
    }

    document.getElementById("expense-limit").value = itemsPerPage;
    fetchExpenses(currentPage, itemsPerPage);
});

let currentPage = 1;
let totalPages = 1;
let itemsPerPage = 10;

// ** Fetch & Display Expenses in Table **
function fetchExpenses(page = 1, limit = itemsPerPage) {
    const token = localStorage.getItem("token");

    if (!token) {
        alert("User is not authenticated");
        return;
    }

    axios.get(`/api/fetch-expenses?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        console.log("Fetched expenses:", res.data.expenses);
        const expenses = res.data.expenses;
        const isPremium = res.data.isPremium; 
        
        
        // Save isPremium status in localStorage
        localStorage.setItem('isPremium', isPremium);

        console.log("Premium Status:", isPremium);

        const expenseList = document.getElementById("expense-list");
        expenseList.innerHTML = '';

        if (isPremium) {
            document.getElementById("rzp-btn").style.visibility = "hidden";
            document.getElementById("status-msg").innerText = "You are a premium user";
            document.getElementById("leaderboard-btn").style.display = "block";
            document.getElementById("download-btn").style.display = "block";
        } else {
            document.getElementById("status-msg").innerText = "You are not a premium user";
            document.getElementById("leaderboard-btn").style.display = "none";
            document.getElementById("download-btn").style.display = "none";
        }

        totalPages = res.data.totalPages;
        document.getElementById("page-info").innerText = `Page ${currentPage} of ${totalPages}`;

        document.getElementById("prev-btn").disabled = currentPage === 1;
        document.getElementById("next-btn").disabled = currentPage === totalPages;

        let totalExpense = 0;
        let totalIncome = 0;
        let Saving = 0;

        expenses.forEach(expense => {
            const tr = document.createElement("tr");
            const date = new Date(expense.createdAt).toLocaleDateString();
            const amount = parseFloat(expense.expenseAmount || 0);
            const income = parseFloat(expense.income || 0);
            const category = expense.type || 'Unknown';

            tr.innerHTML = `
                <td>${date}</td>
                <td>${expense.description}</td>
                <td>${category}</td>
                <td>Rs ${income}</td>
                <td>Rs ${amount}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="deleteExpense(${expense.id})">Delete</button>
                </td>
            `;

            expenseList.appendChild(tr);
            totalIncome += income;
            totalExpense += amount;
            Saving = totalIncome - totalExpense;
        });

        const totalRow = document.createElement("tr");
        totalRow.innerHTML = `
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>Rs ${totalIncome.toFixed(2)}</strong></td>
            <td><strong>Rs ${totalExpense.toFixed(2)}</strong></td>
            <td></td>
        `;
        const savings = document.createElement("tr");
        savings.innerHTML = `<td colspan="6"><strong>Savings = Rs ${Saving.toFixed(2)}</strong></td>`;

        expenseList.appendChild(totalRow);
        expenseList.appendChild(savings);
    })
    .catch(err => {
        console.error("Error fetching expenses:", err);
        alert("Error fetching expenses");
    });
}
//-----------------------fetching function end-------------------------

 

//------------------delete function ---------------------------
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




// ------------- Pagination Buttons Event Listeners----------------------
document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        fetchExpenses(currentPage, itemsPerPage);
    }
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentPage < totalPages) {
        currentPage++;
        fetchExpenses(currentPage, itemsPerPage);
    }
});

// ** Update Expense Limit Based on User Selection **
document.getElementById("expense-limit").addEventListener("change", (event) => {
    itemsPerPage = parseInt(event.target.value, 10);
    localStorage.setItem("expensesPerPage", itemsPerPage);
    currentPage = 1;
    fetchExpenses(currentPage, itemsPerPage);
});

//--------------download functionality------------------------
// document.getElementById("download-btn").addEventListener("click", function () {
//     let pagesToDownload = parseInt(prompt(`Enter the number of pages to download (Max: ${totalPages}):`), 10);

//     if (!pagesToDownload || pagesToDownload < 1 || pagesToDownload > totalPages) {
//         alert(`Invalid input! Please enter a number between 1 and ${totalPages}`);
//         return;
//     }

//     downloadTableAsPDF(pagesToDownload);
// });

// function downloadTableAsPDF(pagesToDownload) {
//     const { jsPDF } = window.jspdf;
//     const doc = new jsPDF();
//     let allExpenses = [];

//     function fetchPage(page) {
//         return axios.get(`/api/fetch-expenses?page=${page}&limit=${itemsPerPage}`, {
//             headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
//         }).then(res => res.data.expenses);
//     }

//     // Fetch multiple pages
//     const fetchPromises = [];
//     for (let i = 1; i <= pagesToDownload; i++) {
//         fetchPromises.push(fetchPage(i));
//     }

//     Promise.all(fetchPromises).then(pages => {
//         pages.forEach(expenses => {
//             allExpenses = allExpenses.concat(expenses);
//         });

//         if (allExpenses.length === 0) {
//             alert("No expenses found to download.");
//             return;
//         }

//         doc.setFont("helvetica", "normal");
//         doc.text("Expense Report", 14, 10); // Title

//         const headers = ["Date", "Description", "Type", "Income (Rs.)", "Expense (Rs.)"];
//         let data = [];
//         let totalIncome = 0;
//         let totalExpense = 0;

//         // Format and push data into table
//         allExpenses.forEach(expense => {
//             const date = new Date(expense.createdAt).toLocaleDateString();
//             const income = parseFloat(expense.income || 0);
//             const amount = parseFloat(expense.expenseAmount || 0);
//             const category = expense.type || "Unknown";

//             data.push([date, expense.description, category, `Rs. ${income.toFixed(2)}`, `Rs. ${amount.toFixed(2)}`]);

//             totalIncome += income;
//             totalExpense += amount;
//         });

//         let totalSavings = totalIncome - totalExpense;

//         // Add Total and Savings Rows
//         data.push(["", "", "Total", `Rs. ${totalIncome.toFixed(2)}`, `Rs. ${totalExpense.toFixed(2)}`]);
//         data.push(["", "", "", "", `Savings = Rs. ${totalSavings.toFixed(2)}`]);

//         // Generate PDF Table
//         doc.autoTable({
//             head: [headers],
//             body: data,
//             startY: 20,
//             theme: "grid",
//             styles: { fontSize: 10 },
//         });

//         const pdfFileName = `Expenses_Report_${new Date().toISOString()}.pdf`;
//         doc.save(pdfFileName);

//         // ✅ Send download record to backend
//         axios.post('/download-history', { link: pdfFileName })
//             .then(() => console.log("Download history saved successfully"))
//             .catch(err => console.error("Error saving download history:", err));
//     }).catch(err => {
//         console.error("Error downloading expenses:", err);
//         alert("Error downloading expenses");
//     });
// }


//=======================new code for download=============================
document.getElementById("download-btn").addEventListener("click", function () {
    const token = localStorage.getItem("token");

    axios.get("/api/download-report", {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
        if (res.data.success) {
            const fileUrl = res.data.fileUrl;
            // Show the file URL on screen or trigger download
            const a = document.createElement("a");
            a.href = fileUrl;
            a.download = "Expense_Report.csv";
            a.click();
        } else {
            alert("Failed to generate report.");
        }
    })
    .catch(err => {
        console.error("Download error:", err);
        alert("Error downloading report.");
    });
});
//================================end download============================
//============================for fetch download history=================
window.addEventListener('DOMContentLoaded', () => {
    fetchDownloadHistory();
  });
  
  async function fetchDownloadHistory() {
    const token = localStorage.getItem("token");
  
    try {
      const response = await fetch('/api/download-history', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
      });
  
      const data = await response.json();
      const tableBody = document.getElementById('history-body');
      tableBody.innerHTML = '';
  
      if (!Array.isArray(data.history) || data.history.length === 0){
        tableBody.innerHTML = '<tr><td colspan="3">No downloads yet or unauthorized.</td></tr>';
        return;
      }
  
      data.history.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.fileUrl.split('/').pop()}</td> <!-- Extract filename from URL -->
          <td>${new Date(item.createdAt).toLocaleString()}</td> <!-- Use createdAt -->
          <td><a href="${item.fileUrl}" download>Download Again</a></td> <!-- Use fileUrl -->
        `;
        tableBody.appendChild(row);
      });
      
    } catch (error) {
      console.error('Failed to fetch download history:', error);
    }
  }
  
  
//===========================end fetch  download===========================
//-----------------------Razorpay Payment---------------------------------------

document.getElementById('rzp-btn').onclick = async function (e) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    // Check if token and userId are available
    if (!token || !userId) {
        alert('User is not authenticated');
        return;
    }

    try {
        // Fetch order details from backend
        const response = await axios.get('http://localhost:3000/purchase/premiummembership', {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const { key_id, order } = response.data;

        if (!key_id || !order?.id) {
            throw new Error('Invalid Razorpay order details');
        }

        // Razorpay options
        const options = {
            key: key_id,
            order_id: order.id,
            currency: "INR",
            amount: order.amount || 50000, // Ensure the amount is provided
            name: 'Expense Tracker Premium',
            description: 'Upgrade to Premium Membership',
            handler: async function (response) {
                try {
                    // Update transaction status on success
                    await axios.post('http://localhost:3000/purchase/updatetransactionstatus', {
                        order_id: order.id,
                        payment_id: response.razorpay_payment_id,
                        status: 'SUCCESSFUL'
                    }, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                   
                     // Mark the user as premium (Direct update)
                    localStorage.setItem('isPremium', 'true');

                    alert('Transaction successful! You are now a premium user.');
                    document.getElementById('rzp-btn').style.visibility = "hidden";
                    document.getElementById('status-msg').innerText = "You are a premium user!";
                    document.getElementById("leaderboard-btn").style.display = "block";
                    document.getElementById("download-btn").style.display = "block";
                    
                    // Reapply event listener to ensure it works
                // document.getElementById('leaderboard-btn').addEventListener('click', fetchLeaderboard);
                } catch (error) {
                    console.error('Error updating transaction status:', error);
                    alert('Transaction successful, but failed to update status. Please contact support.');
                }
            },
            prefill: {
                name: 'User Name',  // Ideally get this from user data
                email: 'user@example.com',  // Similarly, fetch actual email
            },
            theme: {
                color: '#F37254'
            }
        };

        // Open Razorpay payment modal
        const rzp = new Razorpay(options);

        // Handle Payment Failure
        rzp.on('payment.failed', async function (response) {
            try {
                await axios.post('http://localhost:3000/purchase/updatetransactionstatus', {
                    order_id: order.id,
                    payment_id: response?.error?.metadata?.payment_id || 'N/A',
                    status: 'FAILED'
                }, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                alert('Transaction failed. Please try again.');
            } catch (error) {
                console.error('Error updating failed transaction status:', error);
                alert('Transaction failed, and status update failed. Please contact support.');
            }
        });

        // Open the payment window
        rzp.open();
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        alert('Error initiating payment. Please try again later.');
    }
};

//--------------------------------leaderboard-------------------------------

document.getElementById('leaderboard-btn').addEventListener('click', function() {
    console.log("Fetching leaderboard...");
    const token = localStorage.getItem('token');
    
    axios.get('/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
        const leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = "<h2>Leaderboard</h2>";

        const users = res.data.leaderboard;
        console.log('Users:', users);

        if (users.length === 0) {
            leaderboardDiv.innerHTML += "<p>No users found in leaderboard.</p>";
            return;
        }

        // Sorting by total_expense (convert to number)
        users.sort((a, b) => Number(b.total_expense) - Number(a.total_expense)); 

        users.forEach(user => {
            console.log(user.name, user.total_expense);
            const userEntry = document.createElement('div');
            userEntry.innerText = `Name: ${user.name} - Total Expenses: ₹${user.total_expense}`;
            leaderboardDiv.appendChild(userEntry);
        });
    })
    .catch(err => {
        console.error('Error fetching leaderboard:', err);
        alert('Error fetching leaderboard');
    });
});


// Call fetchExpenses on page load
fetchExpenses();