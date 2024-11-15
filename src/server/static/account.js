window.onload = function () {
    const username = getCookie('username');

    const usernameDisplay = document.getElementById('user-display');

    if (username) {
        usernameDisplay.textContent = username;
        usernameDisplay.style.display = 'inline-block';
        fetchAndDisplayLinks();

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
                            <button class="copy-button" onclick="copyLink('${domain}:${port}/${doc.id}',this)">
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
