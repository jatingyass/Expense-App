// Add event listener to the form
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission initially

    const email = document.getElementById('email').value;

    // Perform Axios request to check if the email already exists
    axios.post('/check-email', { email: email })
        .then(response => {
            if (response.data.exists) {
                // Email exists
                document.getElementById('email-error').innerText = 'Email already exists.';
            } else {
                // Email does not exist; submit the form
                document.getElementById('signup-form').submit();
            }
        })
        .catch(error => {
            console.error('Error checking email:', error);
        });
});
