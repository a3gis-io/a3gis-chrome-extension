/**
 * The extension alert page
 */
 function updatePopup() {
    chrome.storage.local.get(['urlAlert', 'safeAlert', 'unsafeAlert', 'riskAlert'], function (data) {

        document.getElementById("url").title = data.urlAlert.replaceAll('"', '')
        document.getElementById("url").innerHTML = data.urlAlert.replaceAll('"', '')

        var head = document.getElementById("head")
        var risk = document.getElementById("risk")

        let percentSafe = ''
        let percentUnsafe = ''

        data?.safeAlert ? percentSafe = (100 * Number(data.safeAlert)) / (Number(data.safeAlert) + Number(data.unsafeAlert)) : ''
        data?.unsafeAlert ? percentUnsafe = (100 * Number(data.unsafeAlert)) / (Number(data.safeAlert) + Number(data.unsafeAlert)) : ''
        if (data.riskAlert === "High") {
            head.className = "high";
            head.innerHTML = "<div id='shieldLogo'><img class='logo' src='/images/logored.png' alt='A3GIS logo' /></div>";
            risk.innerHTML = "<div class='risk'>Risk: <span class='unsafe'>High</span></div>";
            info.innerHTML = `<div class="info"><b>${Math.trunc(percentUnsafe)}% of people </b> voted this site as "unsafe" <p>We <b>strongly</b> recommend leaving immediately.</p> </div>`;
        }
    })
}

/**
 * Close bad site
 */
function closeBadsite() {
    const sendMessageButton = document.getElementById('leave')
    sendMessageButton.onclick = async function (e) {
        chrome.runtime.sendMessage({ message: "closeThis" });
    }
}

document.addEventListener('DOMContentLoaded', updatePopup);
document.addEventListener('DOMContentLoaded', closeBadsite);