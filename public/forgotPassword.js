// document.addEventListener('DOMContentLoaded', function(){
//     document.getElementById('forgot-password-form').addEventListener('submit', async function(event){
//        event.preventDefault();

//        const email = document.getElementById('email').value; 

//        try{
//         const response = await axios.post('/password/forgotpassword', {email});
//         document.getElementById ('message').innerText = response.data.message;
//        }catch(err){
//          document.getElementById('message').innerHTML = err.response?.data?.message ||'something went wrong!';
//        }
//     });
// });



document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const resetForm = document.getElementById('reset-form');
    const submitNewPassword = document.getElementById('submit-new-password');
    const message = document.getElementById('message');
    let resetToken = ""; // Store the token from backend

    forgotPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;

        try {
            const response = await axios.post('/password/forgotpassword', { email });

            if (response.data.success) {
                resetToken = response.data.token; // Save the token
                resetForm.style.display = 'block';
                message.innerText = "Token received! Enter a new password.";
            }
        } catch (err) {
            message.innerText = err.response?.data?.message || 'Something went wrong!';
        }
    });

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
            const response = await axios.post('/password/resetpassword', { 
                token: resetToken,
                newPassword, 
                confirmPassword 
            });

            message.innerText = response.data.message;
        } catch (err) {
            message.innerText = err.response?.data?.message || 'Error while resetting password';
        }
    });
});
