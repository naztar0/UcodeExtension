let token = null;
let url = null;

chrome.storage.sync.get(['token', 'url'], function (result) {
    token = result.token;
    url = new URL(result.url);
    console.log('Value currently is ' + token);
    console.log('Url currently is ' + url);
    urlHandler();
})

chrome.storage.onChanged.addListener((changes, namespace) => {
    chrome.storage.sync.get(['url', 'token'], function (result) {
        url = new URL(result.url);
        token = result.token;
        console.log('Url currently is ' + url);
        urlHandler();
    })
})

function urlHandler() {
    let path = url.pathname.split('/');
    if (path[1] === 'pdf') {
        let dlButton = document.getElementById("download-pdf");
        dlButton.onclick = () => requestPdf(path[2], path[3]);
    }
}

function requestSend(method, url, responseType='json', payload=null) {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.setRequestHeader('authorization', token);
    if (payload)
        request.setRequestHeader('content-type', 'application/json');
    request.responseType = responseType;
    request.send(payload);
    return request;
}

const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, {type: contentType});
}

function requestPdf(val1, val2) {
    let request = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/media/${val1}/view/?name=${val2}`);
    request.onload = function () {
        let res = request.response;
        let blob = b64toBlob(res['data'], 'application/pdf');
        console.log(blob);
        let url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: `${val2}.pdf`
        });
    }
}