window.onload = async function () {
    const headertitle = document.getElementById('header-title');
    fetch('/getloginstatus')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network err');
        }
        return response.json();  
    })
    .then(data => {
        const login_status = data.status;
        const username = data.username;
        const usernameDisplay = document.getElementById('user-display');
        if (login_status === "True") {

            usernameDisplay.textContent = username;
            usernameDisplay.style.display = 'inline-block';
        }else{
            usernameDisplay.textContent = "Not Logged In";
            usernameDisplay.style.display = 'inline-block';
        }

        usernameDisplay.addEventListener('click', toggleMenu);
    })
    .catch(error => {
        console.error('Error:', error);
    });



    const response = await fetch('/config');

    if (!response.ok) {
        const site_name = "Brevurl";


    }
    const data = await response.json();
    const site_name = data.name;

    const title = document.title;
    document.title = title + site_name;
    headertitle.textContent = site_name;
};


function toggleMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('show');
}
