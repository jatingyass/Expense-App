document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('login-form').addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent form from refreshing the page

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await axios.post('/login', { email, password });
            console.log("reponse data:");
            if (response.data.success) {
                // Save token and user info in localStorage
                localStorage.setItem('token', response.data.token);
                console.log("hjkjh",response.data.token);
                 localStorage.setItem('userId', response.data.userId);
                 localStorage.setItem('is_premium', response.data.is_premium);

                 alert('Login successful!');
                 window.location.href = './addExpense.html';


               
            } else {
                document.getElementById('error-msg').innerText = response.data.message;
            }
        } catch (err) {
            // console.error('Login error:', err);

            // Check if the error message element exists before updating it
            const errorMsg = document.getElementById('error-msg');
            if (errorMsg) {
                errorMsg.innerText = err.response?.data?.message || 'Something went wrong!';
            } else {
                console.error("Element with id 'error-msg' not found in the DOM.");
            }
        }
    });
});
