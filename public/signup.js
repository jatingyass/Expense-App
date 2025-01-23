// // Add event listener to the form
// document.getElementById('signup-form').addEventListener('submit', function(event) {
//      event.preventDefault(); // Prevent form submission initially

//     const email = document.getElementById('email').value;

//     // Perform Axios request to check if the email already exists
//     axios.post('/check-email', { email: email })
//         .then(response => {
//             if (response.data.exists) {
//                 // Email exists
//                 document.getElementById('email-error').innerText = 'Email already exists.';
//             } else {
//                 // Email does not exist; submit the form
//                 document.getElementById('signup-form').submit();
//                 // window.location.href = './login.html';

//             }
//         })
//         .catch(error => {
//             console.error('Error checking email:', error);
//         });
// });

document.getElementById('signup-form').addEventListener('submit', async function(event) {
    // event.preventDefault(); // Prevent default form submission

    const email = document.getElementById('email').value;
    const emailError = document.getElementById('email-error');
    
    emailError.innerText = ''; // Clear previous error messages

    try {
        console.log("Sending request to check email...");

        // Perform Axios request to check if the email already exists
        const response = await axios.post('/check-email', { email: email });

        console.log("Server Response:", response.data); // Debugging response

        if (response.data.exists) {
            emailError.innerText = 'Email already exists.';
        } else {
            console.log("Email is new, submitting form...");
            
            // ✅ Submit the form programmatically
            setTimeout(() => {
                event.target.submit();  
            }, 100); // Adding a slight delay ensures UI updates

            console.log("Form submitted successfully!");
        }
    } catch (error) {
        console.error('Error checking email:', error);
        emailError.innerText = 'Something went wrong. Please try again.';
    }
});
