async function create_url_entry(event) {
    event.preventDefault();
    try {
        const response = await fetch('brevurl_config.json dst');

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

        const postResponse = await fetch(`${domain}:${port}/shorten`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url, short: short }),
        });

        const postData = await postResponse.json();

        if (postResponse.ok) {
            urlInput.value = "";  
            shortInput.value = ""; 
            showNotification(`Short URL: ${postData.short_url}`);
        } else {
            showNotification(`Error: ${postData.error}`, true);
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification("An error occurred", true);
    }
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const closeBtn = document.getElementById('close-notification');

    notificationMessage.textContent = message;
    notification.style.backgroundColor = isError ? '#dc3545' : '#007bff';
    notification.classList.remove('hidden');
    notification.classList.add('visible');

    closeBtn.addEventListener('click', () => {
        notification.classList.remove('visible');
        notification.classList.add('hidden');
    });
}

function redirectExtension() {
    showNotification("Coming soon!", false)
}
