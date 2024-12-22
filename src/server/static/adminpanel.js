window.onload = async function () {
    const headertitle = document.getElementById('header-title');
    const adminOnlySwitch = document.getElementById("admin-only-short");
    const loggedOnOnlySwitch = document.getElementById("loggedon-only-short");



    const username = getCookie('username');
    const role = getCookie('role');

    const usernameDisplay = document.getElementById('user-display');

    if (username) {
        if (role == 'admin') {
            usernameDisplay.textContent = username;
            usernameDisplay.style.display = 'inline-block';
            fetchAndDisplayLinks();
            fetchAndDisplayUsers();
            fetchBannedWords();
            fetchField("general","preferences","only-admin-short",adminOnlySwitch);
            fetchField("general","preferences","only-loggedon-short",loggedOnOnlySwitch);

        } else {
            window.location.href = '/';
        }

    } else {
        window.location.href = '/login';
    }

    usernameDisplay.addEventListener('click', toggleMenu);
    const response = await fetch('/config');

    if (!response.ok) {
        const site_name = "Brevurl";


    }
    const data = await response.json();
    const site_name = data.name;

    const title = document.title;
    document.title = title+site_name;
    headertitle.textContent = site_name;
};
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content');

   
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        content.style.marginLeft = '250px'; 
    } else {
        sidebar.classList.add('hidden');
        content.style.marginLeft = '0'; 
    }
}

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

async function updateField(collection,document,field,data) {
    const docRef = db.collection(collection).doc(document); 
    docRef.update({
        [field]: data 
    })
    .then(() => {    })
    .catch((error) => {
        console.error("Error:", error);
    });
    
}

async function fetchField(collection,document,field,switchButton) {
    const docRef = db.collection(collection).doc(document); 

    try {
        const doc = await docRef.get();

        
        if (doc.exists && doc.data()[field] === true) {
          
            switchButton.classList.add("active");
        } else {
        }
    } catch (error) {
        console.error("Error:", error);
    }
    
}
function fetchBannedWords() {
    const bannedWordsList = document.getElementById('banned-words-list');
    db.collection('general').doc('banned-words').get().then(doc => {
        if (doc.exists) {
            const words = doc.data().words || [];
            bannedWordsList.innerHTML = ''; 
            words.forEach((word, index) => {
                const li = document.createElement('li');
                li.textContent = word;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '✖';
                deleteBtn.className = 'delete-btn';
                deleteBtn.setAttribute('data-index', index); 

                li.appendChild(deleteBtn);
                bannedWordsList.appendChild(li);
            });
        }
    });
}

function addBannedWord() {
    const inputField = document.getElementById('banned-word-input');
    const word = inputField.value.trim();
    if (word) {
        const docRef = db.collection('general').doc('banned-words');
        docRef.get().then(doc => {
            if (doc.exists) {
                const words = doc.data().words || [];
                words.push(word); 
                docRef.update({ words }).then(() => {
                    inputField.value = ''; 
                    fetchBannedWords(); 
                });
            } else {
                docRef.set({ words: [word] }).then(() => {
                    inputField.value = ''; 
                    fetchBannedWords(); 
                });
            }
        });
    }
}

function deleteBannedWord(index) {
    const docRef = db.collection('general').doc('banned-words');
    docRef.get().then(doc => {
        if (doc.exists) {
            const words = doc.data().words || [];
            words.splice(index, 1); 
            docRef.update({ words }).then(() => {
                fetchBannedWords(); 
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const sidebarItems = document.querySelectorAll('.sidebar ul li');
    const sections = document.querySelectorAll('.section');
    const adminOnlySwitch = document.getElementById("admin-only-short");
    const loggedOnOnlySwitch = document.getElementById("loggedon-only-short");
    const addButton = document.getElementById('add-banned-word-btn');
    const bannedWordsList = document.getElementById('banned-words-list');

    addButton.addEventListener('click', addBannedWord);

    bannedWordsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const wordId = event.target.getAttribute('data-id');
            deleteBannedWord(wordId);
        }
    });



    adminOnlySwitch.addEventListener("click", () => {
        if (adminOnlySwitch.classList.contains("active")) {
            updateField("general","preferences","only-admin-short",false);
            fetchField("general","preferences","only-admin-short",adminOnlySwitch);

            
            
        }else{
            updateField("general","preferences","only-admin-short",true);
            fetchField("general","preferences","only-admin-short",adminOnlySwitch);
        }
        adminOnlySwitch.classList.toggle("active");
    });

    loggedOnOnlySwitch.addEventListener("click", () => {
        if (loggedOnOnlySwitch.classList.contains("active")) {
            updateField("general","preferences","only-loggedon-short",false);
            fetchField("general","preferences","only-loggedon-short",loggedOnOnlySwitch);

            
            
        }else{
            updateField("general","preferences","only-loggedon-short",true);
            fetchField("general","preferences","only-loggedon-short",loggedOnOnlySwitch);
        }
        loggedOnOnlySwitch.classList.toggle("active");
    });


  


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


