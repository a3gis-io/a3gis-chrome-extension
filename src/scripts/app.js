/**
 * The extension popup displays the current URL and it's risk level as reported by the community.
 */
function updatePopup() {
    chrome.storage.local.get(['url', 'verified', 'safe', 'unsafe', 'risk'], function (data) {
        let verified = ''
        data.verified == 1 ? verified = '  <span title="Verified domains are reviewed by our team."><img class="verifyIcon" src="/images/verified.png" /></span>' : ''

        document.getElementById("url").title = data.url.replaceAll('"', '')
        document.getElementById("url").innerHTML = data.url.replaceAll('"', '')
        document.getElementById("verified").innerHTML = verified
        // document.getElementById("unsafe").innerText = data.unsafe
        // document.getElementById("safe").innerText = data.safe

        var head = document.getElementById("head")
        var risk = document.getElementById("risk")

        let percentSafe = ''
        let percentUnsafe = ''  

        data?.safe ? percentSafe = (100 * Number(data.safe)) / (Number(data.safe) + Number(data.unsafe)) : ''
        data?.unsafe ? percentUnsafe = (100 * Number(data.unsafe)) / (Number(data.safe) + Number(data.unsafe)) : ''
        if (data.risk === "High") {
            head.className = "high";
            head.innerHTML = "<div id='shield'><img class='logo' src='/images/logored.png' alt='A3GIS logo' /></div>";
            risk.innerHTML = "<div class='risk'>Risk: <span class='unsafe'>High</span></div>";
            info.innerHTML = `<div class="info"><b>${Math.trunc(percentUnsafe)}% of people </b> voted this "unsafe" </div>`;
        }
        else if (data.risk === "Low") {
            head.className = "low";
            head.innerHTML = "<div id='shield'><img class='logo' src='/images/logogreen.png' alt='A3GIS logo' /></div>";
            risk.innerHTML = "<div class='risk'>Risk: <span class='safe'>Low</span></div>";
            info.innerHTML = `<div class="info"><b>${Math.trunc(percentSafe)}% of people </b> voted this "safe" </div>`;
        }
        else if (data.risk === "Unknown") {
            head.className = "default";
            head.innerHTML = "<div id='shield'><img class='logo' src='/images/logogray.png' alt='A3GIS logo' /></div>";
            risk.innerHTML = "<div class='risk'>Risk: <span class='unknown'>Unknown</span></div>";
            info.innerHTML = "<div class='info'><b>Not enough votes</b> to provide a risk level.</div>";
        }
    })
}

document.addEventListener('DOMContentLoaded', updatePopup);