const pageLoadRefreshTimeout = 200;
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
    if (path[1] === '') {
        console.log('Home page');
        requestSelf();
    }
    else if (path[1] === 'challenge_users') {
        console.log('Challenge page');
        requestChallenge(path[2]);
    }
    else if (path[1] === 'users') {
        console.log('Users page');
        requestUsers(path[2]);
    }
    else if (path[1] === 'settings') {
        console.log('Settings page');
        requestSettings();
    }
}

function requestSend(method, url, responseType = 'json', payload=null) {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.setRequestHeader('authorization', token);
    if (payload)
        request.setRequestHeader('content-type', 'application/json');
    request.responseType = responseType;
    request.send(payload);
    return request;
}

function requestSelf() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        let res = request.response;

        let mdc_chip = document.createElement('mdc-chip');
        mdc_chip.className = "lives-token mdc-chip ng-star-inserted mdc-ripple-upgraded";
        mdc_chip.style.margin = "7px auto";
        mdc_chip.style.maxWidth = "180px";
        let mdc_icon = document.createElement("mdc-icon");
        mdc_icon.className = "mdc-chip__icon ngx-mdc-icon material-icons mdc-chip__icon--leading";
        mdc_icon.innerText = "info";
        let textStatus = document.createElement('mdc-chip-text');
        textStatus.className = "mdc-chip__text";
        textStatus.innerHTML = res['socials']['status'];
        mdc_chip.appendChild(mdc_icon);
        mdc_chip.appendChild(textStatus);
        console.log(textStatus.textContent);
        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mdc-chip-set")[0];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            elem.appendChild(mdc_chip);
        }
        waitUntilPageLoads();
    }
}

function requestSettings() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        let res = request.response;

        let selfId = res['id'];
        let selfStatus = res['socials']['status'];

        let mdc_form_field = document.createElement("mdc-form-field");
        mdc_form_field.className = "ngx-form-field-text-field";
        mdc_form_field.style.display = "block";
        mdc_form_field.style.marginBottom = "10px";
        let mdc_text_field = document.createElement("mdc-text-field");
        mdc_text_field.className = "mdc-text-field ng-untouched ng-pristine ng-valid mdc-text-field--outlined mdc-text-field--with-leading-icon";
        mdc_text_field.style.width = "100%";
        let input = document.createElement("input");
        input.className = "mdc-text-field__input";
        input.id = "statusInput";
        input.type = "text";
        input.value = selfStatus;
        let mdc_icon = document.createElement("mdc-icon");
        mdc_icon.className = "mdc-text-field__icon ngx-mdc-icon material-icons";
        mdc_icon.innerHTML = "info";
        let mdc_notched_outline = document.createElement("mdc-notched-outline");
        mdc_notched_outline.className = "mdc-notched-outline mdc-notched-outline--upgraded ng-star-inserted mdc-notched-outline--notched";
        let mdc_notched_outline__leading = document.createElement("div");
        mdc_notched_outline__leading.className = "mdc-notched-outline__leading";
        let mdc_notched_outline__notch = document.createElement("div");
        mdc_notched_outline__notch.className = "mdc-notched-outline__notch";
        mdc_notched_outline__notch.style.width = "43px";
        let label = document.createElement("label");
        label.className = "mdc-floating-label mdc-floating-label--float-above";
        label.htmlFor = "statusInput";
        label.innerHTML = "Status";
        let mdc_notched_outline__trailing = document.createElement("div");
        mdc_notched_outline__trailing.className = "mdc-notched-outline__trailing";

        mdc_form_field.appendChild(mdc_text_field);
        mdc_text_field.appendChild(input);
        mdc_text_field.appendChild(mdc_icon);
        mdc_text_field.appendChild(mdc_notched_outline);
        mdc_notched_outline.appendChild(mdc_notched_outline__leading);
        mdc_notched_outline.appendChild(mdc_notched_outline__notch);
        mdc_notched_outline__notch.appendChild(label);
        mdc_notched_outline.appendChild(mdc_notched_outline__trailing);

        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("ng-pristine ng-valid")[7];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            elem.appendChild(mdc_form_field);
            let button = document.getElementsByClassName("mdc-button ngx-mdc-button--primary mdc-ripple-upgraded")[0];
            button.removeAttribute("disabled");
            button.onfocus = () => {
                let selfStatus = document.getElementById("statusInput").value;
                let payload = `{"socials":{"status":"${selfStatus}"}}`;
                console.log(payload);
                setTimeout(requestSend, 1000, 'PATCH', `https://lms.ucode.world/api/v0/frontend/users/${selfId}/`, 'json', payload);
            }
        }

        waitUntilPageLoads();
    }
}

function requestChallenge(id) {
    let request = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/challenge_users/${id}/`);
    request.onload = function () {
        let res = request.response;
        console.log("Experience: " + res['challenge']['experience']);

        let textExp = document.createElement('h3');
        textExp.textContent = "Experience: " + res['challenge']['experience'];
        textExp.style.marginLeft = "15px";
        let textId = document.createElement('h3');
        textId.textContent = "Challenge id: " + res['challenge']['id'];
        textId.style.marginLeft = "15px";
        function waitUntilPageLoads() {
            let header = document.getElementsByClassName("header")[0];
            if (!header) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            header.appendChild(textExp);
            header.appendChild(textId);
        }
        waitUntilPageLoads();
    }
}

function requestUsers(id) {
    let request = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/users/${id}/`);
    request.onload = function () {
        let res = request.response;

        let mdc_chip = document.createElement('mdc-chip');
        mdc_chip.className = "lives-token mdc-chip ng-star-inserted mdc-ripple-upgraded";
        mdc_chip.style.margin = "7px auto";
        mdc_chip.style.maxWidth = "180px";
        let mdc_icon = document.createElement("mdc-icon");
        mdc_icon.className = "mdc-chip__icon ngx-mdc-icon material-icons mdc-chip__icon--leading";
        mdc_icon.innerText = "info";
        let textStatus = document.createElement('mdc-chip-text');
        textStatus.className = "mdc-chip__text";
        textStatus.innerHTML = res['socials']['status'];
        mdc_chip.appendChild(mdc_icon);
        mdc_chip.appendChild(textStatus);
        console.log(textStatus.textContent);
        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mdc-chip-set")[0];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            elem.appendChild(mdc_chip);
        }
        waitUntilPageLoads();
    }
}
