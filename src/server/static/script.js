async function create_url_entry(event) {
    event.preventDefault();
    try {
        const response = await fetch('/config');

        if (!response.ok) {
            showNotification("Connection error", true);
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const port = data.port;
        const domain = data.domain;

        const urlInput = document.getElementById('url');
        const shortInput = document.getElementById('short');
        let url = urlInput.value;
        let short = shortInput.value || null;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = `http://${url}`;
        }

        let requestUrl = `${domain}:${port}/shorten?url=${encodeURIComponent(url)}`;
        if (short) {
            requestUrl += `&short=${encodeURIComponent(short)}`;
        }

        const getResponse = await fetch(requestUrl, {
            method: 'GET'
        });

        const responseData = await getResponse.json();

        if (getResponse.ok) {
            urlInput.value = "";  
            shortInput.value = ""; 
            showNotification(`Short URL: ${responseData.short_url}`,"success",responseData.short_url);
        } else {
            showNotification(`Error: ${responseData.err}`, "error");
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification(`Error: ${error}`,"error");
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
    } else if(type == "success"){
        notification.style.backgroundColor = '#15BFD2'; 
        copyUrl.querySelector('.fa-copy').style.display = 'inline-block'; 
    }else if(type == "info"){
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
            showNotification("Copied to clipboard!","info","")
        }).catch(err => {
            showNotification("Hata", "error",err)
        });
    });
}

function redirectExtension() {
    showNotification("Coming soon!", "info", "")
}
