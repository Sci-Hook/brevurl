window.onload = async function () {

    const loginBtn = document.getElementById('login');
    const teamBtn = document.getElementById('ourteam');
    const registerBtn = document.getElementById('register');
    const adminPanel = document.getElementById('menu-item-admin');
    const loginRegisterDiv = document.querySelector('.login-register');
    const h1Element = document.querySelector('h1');
    const headertitle = document.getElementById('header-title');


    const response = await fetch('/config');

    if (!response.ok) {
        const site_name = "Brevurl";


    }
    const data = await response.json();
    const site_name = data.name;


    document.title = site_name;
    h1Element.textContent = site_name;
    headertitle.textContent = site_name;
    

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
            const role = data.role;
            const userDisplay = document.getElementById('user-display');

            if (login_status === "True") {

                loginBtn.style.display = 'none';
                teamBtn.style.display = 'none';

                registerBtn.style.display = 'none';

                userDisplay.textContent = username;
                userDisplay.style.display = 'inline-block';

                if (role === 'admin') {
                    adminPanel.style.display = 'inline-block';
                }
            }

            userDisplay.addEventListener('click', toggleMenu);
        })
        .catch(error => {
            console.error('Hata:', error);  
        });

};


async function fetchField(collection, document, field) {
    db = firebase.firestore();

    const docRef = db.collection(collection).doc(document);

    try {
        const doc = await docRef.get();


        if (doc.exists && doc.data()[field] === true) {

            return true;
        } else {
            return false;
        }
    } catch (error) {

        console.error("Error:", error);
        return true;
    }

}



function getCookie(name) {
    let cookieArr = document.cookie.split(";");

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split("=");

        if (name === cookiePair[0].trim()) {
            return decodeURIComponent(cookiePair[1]);
        }
    }

    return null;
}

function toggleMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('show');
}

async function fetchBannedWordsList() {
    const db = firebase.firestore();
    const doc = await db.collection('general').doc('banned-words').get();
    if (doc.exists) {
        const words = doc.data().words || [];
        return words;
    } else {
        return [];
    }
}

async function create_url_entry(event) {
    event.preventDefault();

    const usr_response = await fetch('/getloginstatus');
    if(!usr_response.ok){
        throw new Error('Network response was not ok');
    }
    
    const usrdata = await usr_response.json();
    const loggingRestriction = await fetchField("general", "preferences", "only_loggedon_short");
    const adminRestriction = await fetchField("general", "preferences", "only_admin_short");
    const urlInput = document.getElementById('url');
    const shortInput = document.getElementById('short');
    const username = usrdata.username;
    const role = usrdata.role;

    let access = true;

    if (loggingRestriction == true) {
        if (username) {
            access = true;
        } else {
            access = false;
            showNotification("You must log in to continue the process", "error");
        }
    }

    if (adminRestriction == true) {
        if (username) {
            if (role == 'admin') {
                access = true;
            } else {
                access = false;
                showNotification("This process is only available for admins", "error");
            }
        } else {
            access = false;
            showNotification("You must log in to continue the process", "error");
        }
    }

    const banned_words = await fetchBannedWordsList();

    if (access === true) {
        const shortInputValue = shortInput.value.toLowerCase();
    
        if (banned_words.some(word => shortInputValue.includes(word))) {
            if (role !== 'admin') {
                access = false;
                showNotification("Short name prohibited", "error");
            }
        }
    }
    if (access == true) {
        try {
            const response = await fetch('/config');

            if (!response.ok) {
                showNotification("Connection error", true);
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            const port = data.port;
            const domain = data.domain;


            let url = urlInput.value;
            let short = shortInput.value || null;

            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `http://${url}`;
            }

            let requestUrl = `${domain}:${port}/shorten?url=${encodeURIComponent(url)}`;
            if (short) {
                requestUrl += `&short=${encodeURIComponent(short)}`;
            }
            if (username) {
                requestUrl += `&user=${encodeURIComponent(username)}`;
            } else {
                const username_anym = "Anonymous User";
                requestUrl += `&user=${encodeURIComponent(username_anym)}`;
            }

            const getResponse = await fetch(requestUrl, {
                method: 'GET'
            });

            const responseData = await getResponse.json();

            if (getResponse.ok) {
                urlInput.value = "";
                shortInput.value = "";
                showNotification(`Short URL: ${responseData.short_url}`, "success", responseData.short_url);
            } else {
                showNotification(`Error: ${responseData.err}`, "error");
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error: ${error}`, "error");
        }

    }

}


function showNotification(message, type = "error", copyText) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeBtn = document.getElementById('close-notification');
    const copyUrl = document.querySelector('.copy-url');

    notificationMessage.textContent = message;


    if (type == "error") {
        notification.style.backgroundColor = '#dc3545';
        copyUrl.querySelector('.fa-copy').style.display = 'none';
    } else if (type == "success") {
        notification.style.backgroundColor = '#2215D2FF';
        copyUrl.querySelector('.fa-copy').style.display = 'inline-block';
    } else if (type == "info") {
        notification.style.backgroundColor = '#007bff';
        copyUrl.querySelector('.fa-copy').style.display = 'none';

    }


    notification.classList.remove('hidden');
    notification.classList.add('visible');


    closeBtn.addEventListener('click', () => {
        notification.classList.remove('visible');
        notification.classList.add('hidden');
    });

    copyUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(copyText).then(() => {
            showNotification("Copied to clipboard!", "info", "")
        }).catch(err => {
            showNotification("Hata", "error", err)
        });
    });
}

function redirectExtension() {
    showNotification("Coming soon!", "info", "")
}


