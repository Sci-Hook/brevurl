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
            const role = data.role;
            const usernameDisplay = document.getElementById('user-display');
            if (login_status === "True") {
                if (role == "admin") {
                    usernameDisplay.textContent = username;
                    usernameDisplay.style.display = 'inline-block';
                    const adminOnlySwitch = document.getElementById("admin-only-short");
                    const loggedOnOnlySwitch = document.getElementById("loggedon-only-short");
                    const checkUrlSwitch = document.getElementById("check-url");
                    fetchAndDisplayLinks();
                    fetchAndDisplayUsers();
                    fetchBannedWords();

                    fetchField("general", "preferences", "only_admin_short", adminOnlySwitch);
                    fetchField("general", "preferences", "only_loggedon_short", loggedOnOnlySwitch);
                    fetchField("general", "preferences", "check_url", checkUrlSwitch);

                } else {
                    window.location.href = "/"
                }


            } else {
                window.location.href = "/login";
            }

            usernameDisplay.addEventListener('click', toggleMenu);
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = "/login";
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
    




}

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
                    <button class="copy-button" onclick="copyLink('${domain}/${doc.id}',this)">
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


async function performAdminAction(actionDetails) {
    const response = await fetch('/admin-action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionDetails)
    });

    const data = await response.json();
    return data
}

async function deleteLink(docId, button) {
    const modal = document.getElementById('delete-confirmation-modal');
    const modalContent = modal.querySelector('.modal-content');
    const confirmButton = document.getElementById('confirm-delete-btn');
    const cancelButton = document.getElementById('cancel-delete-btn');

    modal.classList.remove('hidden');
    modal.classList.add('visible');

    const confirmDelete = await new Promise((resolve) => {
        confirmButton.onclick = () => {
            closeModal(true);
            resolve(true);
        };

        cancelButton.onclick = () => {
            closeModal(false);
            resolve(false);
        };

        function closeModal(isConfirmed) {
            modalContent.classList.add('exit');
            setTimeout(() => {
                modalContent.classList.remove('exit');
                modal.classList.remove('visible');
                modal.classList.add('hidden');
            }, 500);
        }
    });

    if (!confirmDelete) return;

    const actionDetails = {
        action: "delete_link",
        link: docId,
    };

    const data = await performAdminAction(actionDetails);
    const status = data.status;

    if (status == "True") {
        button.innerHTML = '<i class="fa fa-check"></i>';
        button.classList.add('success');
        setTimeout(() => {
            fetchAndDisplayLinks();
        }, 1000);
    } else {
        const error = status.error;
        console.log(error);
    }
}


async function deleteUser(email, button) {
    const modal = document.getElementById('delete-confirmation-modal');
    const modalContent = modal.querySelector('.modal-content');
    const confirmButton = document.getElementById('confirm-delete-btn');
    const cancelButton = document.getElementById('cancel-delete-btn');

    modal.classList.remove('hidden');
    modal.classList.add('visible');

    const confirmDelete = await new Promise((resolve) => {
        confirmButton.onclick = () => {
            closeModal(true);
            resolve(true);
        };

        cancelButton.onclick = () => {
            closeModal(false);
            resolve(false);
        };

        function closeModal(isConfirmed) {
            modalContent.classList.add('exit');
            setTimeout(() => {
                modalContent.classList.remove('exit');
                modal.classList.remove('visible');
                modal.classList.add('hidden');
            }, 500);
        }
    });

    if (!confirmDelete) return;
    const actionDetails = {
        action: "delete_user",
        email: email
    };

    const data = await performAdminAction(actionDetails);
    const status = data.status;
    if (status == "True") {
        button.innerHTML = '<i class="fa fa-check"></i>';
        button.classList.add('success');
        setTimeout(() => {
            fetchAndDisplayUsers();
        }, 1000);

    } else {
        const error = data.error;
        console.log(error);
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

async function updateField(collection, document, field, data) {
    const actionDetails = {
        action: "update_field",
        collection: collection,
        doc: document,
        fieldd: field,
        dataa: data

    };

    const status = performAdminAction(actionDetails);
}

async function fetchField(collection, document, field, switchButton) {
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

async function addBannedWord() {
    const inputField = document.getElementById('banned-word-input');
    const word = inputField.value.trim();
    const actionDetails = {
        action: "add_word",
        word: word
    };

    const data = await performAdminAction(actionDetails);
    const status = data.status;
    if (status == "True") {
        inputField.value = '';
        fetchBannedWords();

    } else {
        const error = status.error;
        console.log(error);
    }

}

async function deleteBannedWord(index) {
    console.log(index);
    const actionDetails = {
        action: "delete_word",
        word: index
    };

    const data = await performAdminAction(actionDetails);
    const status = data.status;
    if (status == "True") {
        fetchBannedWords();

    } else {
        const error = status.error;
        console.log(error);
    }

}

document.addEventListener('DOMContentLoaded', function () {
    const sidebarItems = document.querySelectorAll('.sidebar ul li');
    const sections = document.querySelectorAll('.section');
    const adminOnlySwitch = document.getElementById("admin-only-short");
    const loggedOnOnlySwitch = document.getElementById("loggedon-only-short");
    const checkUrlSwitch = document.getElementById("check-url");
    const addButton = document.getElementById('add-banned-word-btn');
    const bannedWordsList = document.getElementById('banned-words-list');

    addButton.addEventListener('click', addBannedWord);

    bannedWordsList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const wordId = event.target.getAttribute('data-index');
            console.log(wordId);
            deleteBannedWord(wordId);
        }
    });



    adminOnlySwitch.addEventListener("click", () => {
        if (adminOnlySwitch.classList.contains("active")) {
            updateField("general", "preferences", "only_admin_short", false);
            setTimeout(() => {
                fetchField("general", "preferences", "only_admin_short", checkUrlSwitch);
            }, 2000);


        } else {
            updateField("general", "preferences", "only_admin_short", true);
            setTimeout(() => {
                fetchField("general", "preferences", "only_admin_short", checkUrlSwitch);
            }, 2000);        }
        adminOnlySwitch.classList.toggle("active");
    });
    
    
    
    
    
    checkUrlSwitch.addEventListener("click", () => {
        if (checkUrlSwitch.classList.contains("active")) {
            updateField("general", "preferences", "check_url", false);
            setTimeout(() => {
                fetchField("general", "preferences", "check_url", checkUrlSwitch);
            }, 2000);



        } else {
            updateField("general", "preferences", "check_url", true);
            setTimeout(() => {
                fetchField("general", "preferences", "check_url", checkUrlSwitch);
            }, 2000);
        }
        checkUrlSwitch.classList.toggle("active");
    });

    loggedOnOnlySwitch.addEventListener("click", () => {
        if (loggedOnOnlySwitch.classList.contains("active")) {
            updateField("general","preferences","only_loggedon_short",false);
            setTimeout(() => {
                fetchField("general", "preferences", "only_loggedon_short", loggedOnOnlySwitch);
            }, 2000);


            
        }else{
            updateField("general","preferences","only_loggedon_short",true);
            setTimeout(() => {
                fetchField("general", "preferences", "only_loggedon_short", loggedOnOnlySwitch);
            }, 2000);
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
            if (index === 0) {
                fetchAndDisplayLinks();

            } else if (index === 1) {
                fetchAndDisplayUsers();
            } else if (index === 2) {
                const adminOnlySwitch = document.getElementById("admin-only-short");
                const loggedOnOnlySwitch = document.getElementById("loggedon-only-short");
                const checkUrlSwitch = document.getElementById("check-url");

                fetchBannedWords();
                fetchField("general", "preferences", "only_admin_short", adminOnlySwitch);
                fetchField("general", "preferences", "only_loggedon_short", loggedOnOnlySwitch);
                fetchField("general", "preferences", "check_url", checkUrlSwitch);


            }
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


