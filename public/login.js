document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from refreshing the page

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Send login request using Axios
    axios.post('/login', { email, password })
        .then(res => {
            if (res.data.success) {
                alert('Login successful!');
            } else {
                document.getElementById('error-msg').innerText = res.data.message;
            }
        })
        .catch(err => {
            // Handle HTTP errors
            if (err.response && err.response.data && err.response.data.message) {
                // Display the specific error message from the server
                document.getElementById('error-msg').innerText = err.response.data.message;
            } else {
                // Fallback message for unexpected errors
                document.getElementById('error-msg').innerText = 'Something went wrong!';
            }
            console.error('Error during login:', err);
        });
});
