chrome.webRequest.onSendHeaders.addListener(
    function(details) {
        if (details.url === "https://lms.ucode.world/api/v0/frontend/user/self/") {
            let headers = details.requestHeaders;
            for (let i = 0; i < headers.length; i++) {
                if (headers[i].name === "authorization") {
                    let token = headers[i].value;
                    let refresh = true;
                    chrome.storage.sync.get(['token'], function(result) {
                        if (result.token === token)
                            refresh = false;
                    });
                    if (!refresh)
                        break;
                    chrome.storage.sync.set({token: token}, () => {});
                    break;
                }
            }
        }
        else if (details.url.slice(0, 57) === "https://lms.ucode.world/api/v0/frontend/statistics/users/") {
            chrome.storage.sync.get(['statistics_url'], function(result) {
                if (result.statistics_url !== details.url)
                    chrome.storage.sync.set({statistics_url: details.url}, () => {});
            });
        }
    },
    {urls: ["https://lms.ucode.world/*"]}, ['requestHeaders']
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        urlHandler(changeInfo.url);
    }
});

chrome.tabs.onActivated.addListener((tabId, windowId) => {
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
        urlHandler(tabs[0].url);
    });
});

function urlHandler(url) {
    try {
        url = new URL(url);
    } catch (TypeError) {
        return;
    }
    if (url.hostname === "lms.ucode.world") {
        chrome.storage.sync.set({url: url.href}, () => {});
        setBadge(url);
    }
    else {
        chrome.storage.sync.set({url: null}, () => {});
        chrome.browserAction.setBadgeText({text:''});
    }
}

function setBadge(url) {
    chrome.browserAction.setBadgeBackgroundColor({color:"#36b4c8"});
    let path = url.pathname.split('/');
    if (path[1] === 'pdf')
        chrome.browserAction.setBadgeText({text:"PDF"});
    else if (path[2] === 'slots')
        chrome.browserAction.setBadgeText({text:"S"});
    else
        chrome.browserAction.setBadgeText({text:''});
}