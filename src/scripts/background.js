/**
 *  Set URL 
 * @param {*} url 
 */
async function setUrl(url) {
    chrome.storage.local.set({ 'url': JSON.stringify(url) })
}

/**
 * Checks URL on updated
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === 'loading' && /^http/.test(tab.url)) {
        checkUrl(tab.url, tabId)
    }
})

/**
 * Re-checks on tab switch, set alert data, reset on chrome tab
 */
chrome.tabs.onActivated.addListener(() => {

    let alertUrl = chrome.runtime.getURL("/src/alert.html")

    getCurrentTab().then((tab) => {

        if (tab.url && /^http/.test(tab.url)) {
            checkUrl(tab.url, tab.id)
        }
        else if (tab.url === alertUrl) {
            setAlertData()
        } else if (/^chrome:/.test(tab.url)) {
            defaultData()
        }
    })
})

/**
 * Creates and Sets the initial alert data
 * Sets default data on new chrome tabs
 */
chrome.tabs.onCreated.addListener((tab) => {
    const alertUrl = chrome.runtime.getURL("/src/alert.html")
    if (tab.status === "loading" && tab.pendingUrl === alertUrl) {
        setAlertData()
    } else if ((/^chrome:/.test(tab.pendingUrl))) {
        defaultData()
    }
})


/**
 * Check URL against scam database 
 * @param {*} suspectUrl 
 * @param {*} tabId 
 */
async function checkUrl(suspectUrl, tabId) {
    // Validate the url 
    let urlObject = new URL(suspectUrl)
    // Structure so our API can return a result  
    let buildURL = urlObject?.host + urlObject?.pathname + urlObject?.hash + urlObject?.search
    let rmTrailing = buildURL.endsWith('/') ? buildURL.slice(0, -1) : buildURL
    let finalURL = rmTrailing.replace(/^(www\.)/, "")
    // Store url so we can display it to the user 
    setUrl(finalURL)
    // Retrieve community reported values from our API
    try {
        const response = await fetch("https://api-endpoint.dev", {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "a3gis_url": finalURL })
        })
        if (response.status === 200) {
            let data = await response.json()
            parseResults(data, tabId, finalURL)
            // console.log('data', data)
        } else {
            throw 'Error fetching results'
        }
    } catch (error) {
        console.log(error)
    }
}

/**
 * Parses and store the json returned from our API
 * @param {*} data 
 * @param {*} tabId 
 * @param {*} finalURL 
 */
function parseResults(data, tabId, finalURL) {
    let dataString = JSON.stringify(data)
    let parse = JSON.parse(dataString)
    chrome.storage.local.set({ 'unsafe': parse?.unsafe ? Number(parse.unsafe) : 0 })
    chrome.storage.local.set({ 'verified': parse?.verified ? Number(parse.verified) : 0 })
    chrome.storage.local.set({ 'safe': parse?.safe ? Number(parse.safe) : 0 })
    riskLevel(parse, tabId, finalURL)
}

/**
 * Sets the risk level information the user sees on the extension
 * For unsafe sites, blocks the site and loads an alert
 * @param {*} urlData 
 * @param {*} tabId 
 * @param {*} finalURL 
 */
function riskLevel(urlData, tabId, finalURL) {
    // set values from the API response 
    let safe = urlData?.safe ? urlData.safe : 0
    let unsafe = urlData?.unsafe ? urlData.unsafe : 0
    let verified = urlData?.verified ? Number(urlData.verified) : 0

    // When most think it's unsafe, we set it to "high" risk and display an alert on unverified sites
    if (Number(unsafe) > Number(safe) == true && verified != 1) {
        chrome.storage.local.set({ 'risk': 'High' })
        chrome.action.setIcon({ path: "/images/logo16red.png" })

        // Set the values for alert page
        alertData(unsafe, safe, finalURL)
        // Block site and generate notification tab
        alertUser(tabId)
    }
    // if a verified site is reported unsafe by users. Let's mark it high-risk, red icon, and remove verification badge.
     else if (Number(unsafe) > Number(safe) == true && verified == 1) {
         chrome.storage.local.set({ 'risk': 'High' })
         chrome.action.setIcon({ path: "/images/logo16red.png" })
         // remove verified status 
         chrome.storage.local.set({ 'verified': 0 })
     }
    // When most users think it's safe, display that to the user in the extension Popup and icon.
    else if (Number(safe) > Number(unsafe) == true) {
        chrome.action.setIcon({ path: "/images/logo16.png", tabId: tabId })
        chrome.storage.local.set({ 'risk': 'Low' })

        // set Verified badge text
        if (verified == 1) {
            chrome.action.setBadgeText(
                {
                    text: 'VER',
                    tabId: tabId
                })
            chrome.action.setBadgeBackgroundColor({
                color: '#50B848'
            })
        }
    } else {
        chrome.storage.local.set({ 'risk': 'Unknown' })
        chrome.action.setIcon({ path: "/images/logo16gray.png" })
    }
}

/**
 *  Notify user and block site
 *  chrome.declarativeNetRequest is not used due to storage limits, dynamic rule limitations, and lacks of real-time capabilities.
 * @param {*} tabId 
 */
async function alertUser(tabId) {

    // show alert 
    chrome.tabs.create(
        {
            url: "/src/alert.html",
        },
    )
    chrome.action.setIcon({ path: "/images/logo16red.png" })

        // block this site 
        chrome.tabs.remove(tabId)
}

/**
 * Closes the tab when user clicks the leave button
 */
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "closeThis") {
            // closes the current tab
            getCurrentTab().then((value) => {
                chrome.tabs.remove(value.id)
            })
            // sendResponse({ message: "closed" })
        }
    }
)

/**
 * Store values for alert tab
 * 
 * @param {*} unsafe 
 * @param {*} safe 
 * @param {*} finalURL 
 */
function alertData(unsafe, safe, finalURL) {
    chrome.storage.local.set({ 'riskAlert': 'High' })
    chrome.storage.local.set({ 'unsafeAlert': Number(unsafe) })
    chrome.storage.local.set({ 'safeAlert': Number(safe) })
    chrome.storage.local.set({ 'verifiedAlert': 0 })
    chrome.storage.local.set({ 'urlAlert': JSON.stringify(finalURL) })
}

/**
 * Extension pop-up uses this data 
 */
function setAlertData() {
    chrome.storage.local.get(['urlAlert', 'safeAlert', 'unsafeAlert', 'riskAlert'], function (data) {
        chrome.storage.local.set({ 'risk': 'High' })
        chrome.storage.local.set({ 'url': data.urlAlert })
        chrome.storage.local.set({ 'unsafe': Number(data.unsafeAlert) })
        chrome.storage.local.set({ 'safe': Number(data.safeAlert) })
        chrome.storage.local.set({ 'verified': 0 })
        // set high risk icon 
        chrome.action.setIcon({ path: "/images/logo16red.png" })
    })
}

/**
 * Sets default data 
 */
function defaultData() {
    chrome.storage.local.set({ 'risk': 'Unknown' })
    chrome.storage.local.set({ 'safe': 0 }) 
    chrome.storage.local.set({ 'unsafe': 0 })
    chrome.storage.local.set({ 'verified': 0 })
    chrome.storage.local.set({ 'url': "Not currently on a website" })
    // set default icon 
    chrome.action.setIcon({ path: "/images/logo16gray.png" })
}

/**
 * Load tutorial page on first install
 */
chrome.runtime.onInstalled.addListener(async () => {
    let url = "https://a3gis.io/tutorial"
    await chrome.tabs.create({ url })
})

/**
 * Helper for current tab information
 * @returns 
 */
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true }
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions)
    return tab
}