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
                    console.log(token);
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
        let url = new URL(changeInfo.url);
        if (url.hostname === "lms.ucode.world")
            chrome.storage.sync.set({url: changeInfo.url}, () => {});
    }
})