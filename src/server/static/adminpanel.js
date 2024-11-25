window.onload = function () {
    const username = getCookie('username');
    const role = getCookie('role');

    const usernameDisplay = document.getElementById('user-display');

    if (username) {
        if (role == 'admin') {
            usernameDisplay.textContent = username;
            usernameDisplay.style.display = 'inline-block';
            fetchAndDisplayLinks();
            fetchAndDisplayUsers();
        } else {
            window.location.href = '/';
        }

    } else {
        window.location.href = '/login';
    }

    usernameDisplay.addEventListener('click', toggleMenu);
};

async function fetchAndDisplayLinks() {
    const response = await fetch('/config');

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    const port = data.port;
    const domain = data.domain;
    db = firebase.firestore();
    const username = getCookie('username');

    if (!username) {
        console.error('Username not found');
        return;
    }

    try {
        const linksSection = document.getElementById('links');
        linksSection.innerHTML = '';

        const snapshot = await db.collection('urls').get();
        snapshot.forEach(doc => {
            const data = doc.data();

            const linkElement = document.createElement('div');
            linkElement.classList.add('link-item');

            linkElement.innerHTML = `
                <div>
                    <strong>${doc.id}</strong><br>
                    User: ${data.user || 'N/A'}<br>
                    Original URL:
                    <a href="${data.original_url}" target="_blank">${data.original_url}</a>
                </div>
                <div class="button-container">
                    <button class="copy-button" onclick="copyLink('${domain}:${port}/${doc.id}',this)">
                        <i class="fa fa-copy"></i>
                    </button>
                    <button class="delete-button" onclick="deleteLink('${doc.id}', this)">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            `;

            linksSection.appendChild(linkElement);
        });
    } catch (error) {
        console.error('Error', error);
    }
}

async function fetchAndDisplayUsers() {
    db = firebase.firestore();

    try {
        const usersSection = document.getElementById('users');
        usersSection.innerHTML = ''; 

        const snapshot = await db.collection('users').get();
        snapshot.forEach(doc => {
            const data = doc.data();

            const userElement = document.createElement('div');
            userElement.classList.add('link-item'); 


            userElement.innerHTML = `
                <div>
                    <strong>${doc.id}</strong><br>
                    Username: ${data.username || 'N/A'}<br>
                    Role: ${data.role || 'N/A'}
                </div>
                <div class="button-container">
                    <button class="delete-button" onclick="deleteUser('${doc.id}', this)">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            `;

            usersSection.appendChild(userElement);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}


function deleteLink(docId, button) {
    db.collection('urls').doc(docId).delete().then(() => {
        button.innerHTML = '<i class="fa fa-check"></i>';
        button.classList.add('success');
        setTimeout(() => {
            fetchAndDisplayLinks();
        }, 1000);
    }).catch(error => {
        console.error('Error', error);
    });
}

async function deleteUser(email, button) {
    try {
        const response = await fetch('/delete-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email }), 
        });

        
        const result = await response.json();

        if (response.ok) {
            db.collection('users').doc(email).delete().then(() => {
                button.innerHTML = '<i class="fa fa-check"></i>';
                button.classList.add('success');
                setTimeout(() => {
                    fetchAndDisplayUsers();
                }, 1000);
            }).catch(error => {
                showNotification(`Error: ${error}`,'error');
            });
        } else {
            showNotification(`Error:${result.error}`,error);
        }
    } catch (error) {
        showNotification(`Error: ${error}`,'error');

    }
}




function copyLink(url, button) {
    navigator.clipboard.writeText(url).then(() => {
        button.innerHTML = '<i class="fa fa-check"></i>';
        button.classList.add('success');


    }).catch(err => {
        console.error(`Error: ${err}`)
    });
}



function toggleMenu() {
    const menu = document.getElementById('user-menu');
    menu.classList.toggle('show');
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

document.addEventListener('DOMContentLoaded', function () {
    const sidebarItems = document.querySelectorAll('.sidebar ul li');
    const sections = document.querySelectorAll('.section');


    sections.forEach((section, index) => {
        if (index === 0) {
            section.style.display = 'block';
            sidebarItems[index].classList.add('selected');
        } else {
            section.style.display = 'none';
        }
    });

    sidebarItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            sections.forEach(section => section.style.display = 'none');


            sections[index].style.display = 'block';


            sidebarItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
});



function showNotification(message, type = "error", copyText) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeBtn = document.getElementById('close-notification');
    const sendEmailBtn = document.getElementById('send-email');

    notificationMessage.textContent = message;

    if (type === "error") {
        notification.style.backgroundColor = '#dc3545';
        sendEmailBtn.classList.add('hidden');
    } else if (type === "need-verify") {
        notification.style.backgroundColor = '#15BFD2';
        sendEmailBtn.classList.remove('hidden');
    } else if (type === "success") {
        notification.style.backgroundColor = '#10EA34';
        sendEmailBtn.classList.add('hidden');
    }
    notification.classList.remove('hidden');
    notification.classList.add('visible');

    closeBtn.addEventListener('click', () => {
        notification.classList.remove('visible');
        notification.classList.add('hidden');
    });

    sendEmailBtn.addEventListener('click', () => {
        if (document.title == "Recover Account | Brevurl") {
            window.location.href = '/login';
        } else {
            var user = auth.currentUser;
            if (user) {
                user.sendEmailVerification()
                    .then(() => {
                        showNotificationauth('Verification email sent!', 'success-auth');
                    })
                    .catch((error) => {
                        showNotificationauth(`Error sending email: ${error}`, 'error-auth');
                    });
            }
        }
    });
}
