
//add event listener to form 
document.getElementById('signup-form').addEventListener('submit', function(event) {
    event.preventDefault(); //prevent form submission initially

    const email = document.getElementById('email').value;

    //perform AJAX request to check if the email already exists
    fetch('/check-email', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: email})
    })
    .then(res => res.json())
    .then(data => {
        if(data.exists){
            document.getElementById('email-error').innerText = 'Email already exists.';
        }else{
            document.getElementById('signup-form').submit();
        }
    })
    .catch(err => console.log('Error checking email:', err));
});
