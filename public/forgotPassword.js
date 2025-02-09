// // document.addEventListener('DOMContentLoaded', function(){
// //     document.getElementById('forgot-password-form').addEventListener('submit', async function(event){
// //        event.preventDefault();

// //        const email = document.getElementById('email').value; 

// //        try{
// //         const response = await axios.post('/password/forgotpassword', {email});
// //         document.getElementById ('message').innerText = response.data.message;
// //        }catch(err){
// //          document.getElementById('message').innerHTML = err.response?.data?.message ||'something went wrong!';
// //        }
// //     });
// // });



// document.addEventListener('DOMContentLoaded', function() {
//     const forgotPasswordForm = document.getElementById('forgot-password-form');
//     const resetForm = document.getElementById('reset-form');
//     const submitNewPassword = document.getElementById('submit-new-password');
//     const message = document.getElementById('message');
//     let resetToken = ""; // Store the token from backend

//     forgotPasswordForm.addEventListener('submit', async function(event) {
//         event.preventDefault();
//         const email = document.getElementById('email').value;

//         try {
//             const response = await axios.post('/password/forgotpassword', { email });

//             if (response.data.success) {
//                 resetToken = response.data.token; // Save the token
//                 resetForm.style.display = 'block';
//                 message.innerText = "Token received! Enter a new password.";
//             }
//         } catch (err) {
//             message.innerText = err.response?.data?.message || 'Something went wrong!';
//         }
//     });

//     submitNewPassword.addEventListener('click', async function() {
//         const newPassword = document.getElementById('new-password').value;
//         const confirmPassword = document.getElementById('confirm-password').value;

//         if (!newPassword || !confirmPassword) {
//             message.innerText = 'Please enter both password and confirm password';
//             return;
//         }

//         if (newPassword !== confirmPassword) {
//             message.innerText = 'Passwords do not match';
//             return;
//         }

//         try {
//             const response = await axios.post('/password/resetpassword', { 
//                 token: resetToken,
//                 newPassword, 
//                 confirmPassword 
//             });

//             message.innerText = response.data.message;
//         } catch (err) {
//             message.innerText = err.response?.data?.message || 'Error while resetting password';
//         }
//     });
// });




//new1-2-25
document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetForm = document.getElementById('reset-form');
    const submitNewPassword = document.getElementById('submit-new-password');
    const message = document.getElementById('message');

    // Step 1: Handle Forgot Password Request
    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;

        try {
            const response = await axios.post('/password/forgotpassword', { email });

            if (response.data.success) {
                message.innerText = "Reset link sent to your email. Check your inbox!";
            }
        } catch (err) {
            message.innerText = err.response?.data?.message || 'Something went wrong!';
        }
    });

    // Step 2: Check if Reset Password Page is Opened via Link
    const urlParams = new URLSearchParams(window.location.search);
    const resetId = urlParams.get('id'); // Get the reset ID from the URL

    if (resetId) {
        // Hide forgot password form and show reset password form
        forgotPasswordForm.style.display = 'none';
        resetForm.style.display = 'block';
    }

    // Step 3: Handle Reset Password Submission
    submitNewPassword.addEventListener('click', async function() {
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!newPassword || !confirmPassword) {
            message.innerText = 'Please enter both password and confirm password';
            return;
        }

        if (newPassword !== confirmPassword) {
            message.innerText = 'Passwords do not match';
            return;
        }

        try {
            const response = await axios.post('/password/updatepassword', { 
                id: resetId, 
                newPassword 
            });

            message.innerText = response.data.message;
            setTimeout(() => {
                window.location.href = "/login.html"; // Redirect to login page after success
            }, 2000);
        } catch (err) {
            message.innerText = err.response?.data?.message || 'Error while resetting password';
        }
    });
});
