document.getElementById('login-form').addEventListener('submit', function(event){
    event.preventDefault(); //prevent form from refreshing the page

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    axios.post('/login', {email, password})
    .then(res => {
        if(res.data.success){
            alert('Login successful!');
        }else{
            document.getElementById('error-msg').innerText = res.data.message;
        }
    })

  .catch(err => {
    console.log('error during login:', err);
    document.getElementById('error-msg').innerText = 'Something went wrong!';
   });
});