
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check if email exists
    axios.post('/check-email', { email })
        .then(response => {
            if (response.data.exists) {
                document.getElementById('email-error').innerText = 'Email already exists.';
            } else {
                // Perform signup without phone number
                axios.post('/signup', { name, email, password })
                    .then(response => {
                        if (response.data.success) {
                            alert('Signup successful! Redirecting to login page...');
                            window.location.href = 'login.html';
                        } else {
                            alert(response.data.message || 'Signup failed. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Signup error:', error);
                        alert('Error during signup. Please try again.');
                    });
            }
        })
        .catch(error => {
            console.error('Error checking email:', error);
            alert('Error checking email. Please try again.');
        });
});
