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
            fetchAndDisplayLinks();
        }else{
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
};
async function performAdminAction(actionDetails){
    const response = await fetch('/usr-action', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(actionDetails) 
    });

    const data = await response.json();
    return data
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
        const usr_response = await fetch('/getloginstatus');
        
        if(!usr_response.ok){
            throw new Error('Network response was not ok');
        }
        const usrdata = await usr_response.json();
        const username = usrdata.username;

        const linksSection = document.getElementById('links');
        linksSection.innerHTML = '';


        const snapshot = await db.collection('urls').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.user === username) {
                const linkElement = document.createElement('div');
                linkElement.classList.add('link-item');


                linkElement.innerHTML = `
                    <div>
                        <strong>${doc.id}</strong><br>
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
            }
        });
    } catch (error) {
        console.error('Error', error);
    }
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
        link: docId
    };
    
    const data = await performAdminAction(actionDetails);
    const status = data.status;
    if (status == "True") {
        button.innerHTML = '<i class="fa fa-check"></i>';
        button.classList.add('success');
        setTimeout(() => {
            fetchAndDisplayLinks();
        }, 1000);
        
    }else{
        const error = status.error;
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
            if (index === 0) {
                fetchAndDisplayLinks();
                
            }
            sections.forEach(section => section.style.display = 'none');


            sections[index].style.display = 'block';


            sidebarItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
        });
    });
});

