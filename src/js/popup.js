let token = null;
let url = null;

let downloadPdfMenu = document.getElementById('download-pdf').parentNode;
let slotsMenu = document.getElementById('menuSlots').parentNode;
let assessorMenu = document.getElementById('menuAssessor').parentNode;
let slotsLoadingGif = document.getElementById('slots-loading-gif');
let assessorLoadingGif = document.getElementById('assessor-loading-gif');
let statusText = document.getElementById('statusDetail');
let header = document.getElementById('header');
resetPopup();

chrome.storage.sync.get(['token', 'url'], function (result) {
    token = result.token;
    try {
        url = new URL(result.url);
    } catch (TypeError) {
        return;
    }
    urlHandler();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    downloadPdfMenu.style.display = "none";
    slotsMenu.style.display = "none";
    statusText.innerHTML = "Nothing to do";
    header.className = '';
    chrome.storage.sync.get(changes, function (result) {
        for (let key in changes) {
            if (key === 'url') {
                if (!result.url) {
                    resetPopup();
                    continue;
                }
                url = new URL(result.url);
                urlHandler();
            }
            else if (key === 'token') {
                token = result.token;
            }
            else if (key === 'statistics_url') {
                requestStatistics(result.statistics_url);
            }
        }
    });
});

function resetPopup() {
    downloadPdfMenu.style.display = "none";
    slotsMenu.style.display = "none";
    assessorMenu.style.display = "none";
    slotsLoadingGif.style.display = "none";
    assessorLoadingGif.style.display = "none";
    statusText.innerHTML = "Nothing to do";
    statusText.className = '';
}

function urlHandler() {
    let path = url.pathname.split('/');
    if (path[1] === 'pdf') {
        downloadPdfMenu.style.display = "block";
        statusText.innerHTML = "You can download pdf";
        header.className = "available";
        let dlButton = document.getElementById("download-pdf");
        dlButton.onclick = () => requestPdf(path[2], path[3]);
    }
    else if (path[2] === 'slots') {
        slotsMenu.style.display = "block";
        statusText.innerHTML = "You can subscribe to assessment";
        header.className = "available";
        slotsLoadingGif.style.display = "inline-block";
        requestSlotsChallenge(path[1]);
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
        let url = URL.createObjectURL(blob);
        chrome.downloads.download({
            url: url,
            filename: `${val2}.pdf`
        });
    }
}

function requestSlotsChallenge(challenge, mBegin=null) {
    let request = requestSend('GET', 'https://lms.ucode.world/api/v0/frontend/slots/available-slots/?challenge=' + challenge);
    request.onload = function () {
        if (!mBegin)
            slotsLoadingGif.style.display = "none";
        let res = request.response;
        if (res.length === 0) {
            statusText.innerHTML = "No slots available 😥";
            slotsMenu.style.display = "none";
            header.className = "error";
            return;
        }
        let slotsElem = document.getElementById('slots');
        for (let i = 0; i < res.length; i++) {
            let slotsList = res[i]['grouped_slots'];
            for (let j = 0; j < slotsList.length; j++) {
                let begin = slotsList[j]['begin_at'].slice(11, 16);
                let id = slotsList[j]['id'];
                if (mBegin) {
                    if (mBegin === begin) {
                        subscribeToAssessment(id, challenge, begin);
                        return;
                    }
                    continue;
                }

                let slotText = document.createElement('span');
                slotText.className = "slotText";
                slotText.innerHTML = begin;
                slotText.onclick = () => subscribeToAssessment(id, challenge, begin);
                slotsElem.appendChild(slotText);
            }
        }
        if (mBegin) {
            statusText.innerHTML = "Such slot is no longer available 😥";
            slotsMenu.style.display = "none";
            assessorMenu.style.display = "none";
            slotsLoadingGif.style.display = "none";
            header.className = "error";
        }
    }
}

function subscribeToAssessment(md5, challenge, begin) {
    assessorLoadingGif.style.display = "inline-block";
    let request = requestSend('PUT', `https://lms.ucode.world/api/v0/frontend/slots/${md5}/subscribe-to-assessment/`, 'json', `{"challenge":"${challenge}"}`);
    request.onload = function () {
        if (request.status === 400) {
            document.getElementById("assessor-header").innerHTML = `Team already has assessment at ${begin}.<br>Trying again...`;
            requestSlotsChallenge(challenge, begin);
            return;
        }
        document.getElementById("assessor-header").innerHTML = "You will assessed by:";
        let res = request.response;
        let user = res['user'];
        let id = res['id'];
        let requestUser = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/users/${user}/`);
        requestUser.onload = function () {
            assessorLoadingGif.style.display = "none";
            let resUser = requestUser.response;
            slotsMenu.style.display = "none";
            statusText.innerHTML = "You can view your assessor";
            header.className = "available";
            assessorMenu.style.display = "block";
            let elemName = document.getElementById("assessor-name");
            let elemImg = document.getElementById("assessor-img");
            elemName.innerText = resUser['username'];
            elemImg.src = "https://lms.ucode.world/api/" + resUser['photo_url'];
            let cancelBtn = document.getElementById("cancel-assessment-button");
            let cancelTooltip = document.getElementById("cancel-assessment-tooltip");
            let tryAgainBtn = document.getElementById("try-again-button");
            let tryAgainTooltip = document.getElementById("try-again-tooltip");
            cancelBtn.onmouseover = () => cancelTooltip.style.display = "block";
            cancelBtn.onmouseout = () => cancelTooltip.style.display = "none";
            tryAgainBtn.onmouseover = () => tryAgainTooltip.style.display = "block";
            tryAgainBtn.onmouseout = () => tryAgainTooltip.style.display = "none";
            cancelBtn.onclick = () => cancelAssessment(id);
            tryAgainBtn.onclick = () => cancelAssessment(id, begin, challenge);
        }
    }
}

function cancelAssessment(id, begin=null, challenge=null) {
    assessorLoadingGif.style.display = "inline-block";
    let request = requestSend('PUT', `https://lms.ucode.world/api/v0/frontend/slots/${id}/cancel-assessment/`);
    request.onload = function () {
        if (!begin && !challenge) {
            assessorLoadingGif.style.display = "none";
            document.getElementsByClassName("assessor-block")[0].style.display = "none";
            document.getElementById("assessor-header").innerHTML = "Assessment canceled! 😎";
        }
        else {
            let seconds = 3;
            let int = setInterval(() => {
                document.getElementById("assessor-header").innerHTML = "Please wait: " + seconds-- + " s.";
                if (seconds <= 0) {
                    clearInterval(int);
                    document.getElementById("assessor-header").innerHTML = "You will assessed by:";
                    requestSlotsChallenge(challenge, begin);
                }
            }, 1000);
        }
    }
}