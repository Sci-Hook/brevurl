window.onload = async function () {
    const h2Element = document.querySelector('h2');



    const response = await fetch('/config');

    if (!response.ok) {
        const site_name = "Brevurl";


    }
    const data = await response.json();
    const site_name = data.name;
    const h2 = h2Element.textContent;
    const title = document.title;
    document.title = title + site_name;
    h2Element.textContent =h2 +" "+  site_name + " Account";

}