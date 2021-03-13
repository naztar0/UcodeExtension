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
    else if (path[1] === 'statistics') {
        console.log('Statistics page');
        requestStatistics();
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

function makeStatus(statusStr) {
    let emojis = {
        ':attentionsign:':'https://emoji.slack-edge.com/T01A4EB6ES0/attentionsign/d090299a330ae690.gif',
        ':flykisses:':'https://emoji.slack-edge.com/T01A4EB6ES0/flykisses/5850fb1752432449.gif',
        ':homer:':'https://emoji.slack-edge.com/T01A4EB6ES0/homer/58ba2251c6375891.gif',
        ':khpi:':'https://emoji.slack-edge.com/T01A4EB6ES0/khpi/68658d9aa4072b3c.png',
        ':otp:':'https://emoji.slack-edge.com/T01A4EB6ES0/otp/946307d5eb00550b.png',
        ':piitu:':'https://emoji.slack-edge.com/T01A4EB6ES0/piitu/114b1c0c94392793.jpg',
        ':pikadance:':'https://emoji.slack-edge.com/T01A4EB6ES0/pikadance/018cf25073f7f55e.gif',
        ':pride:':'https://emoji.slack-edge.com/T01A4EB6ES0/pride/56b1bd3388.png',
        ':rainbowcat:':'https://emoji.slack-edge.com/T01A4EB6ES0/rainbowcat/fdaba9b7dd08accb.gif',
        ':shipit:':'https://emoji.slack-edge.com/T01A4EB6ES0/squirrel/465f40c0e0.png',
        ':slack:':'https://emoji.slack-edge.com/T01A4EB6ES0/slack/7d462d2443.png',
        ':squidward:':'https://emoji.slack-edge.com/T01A4EB6ES0/squidward/4fbd679d28d880d8.gif',
        ':thumbsup_all:':'https://emoji.slack-edge.com/T01A4EB6ES0/thumbsup_all/50096a1020.gif',
        ':ucode_connect:':'https://emoji.slack-edge.com/T01A4EB6ES0/ucode_connect/20ae00dd4fab4b5a.png',
        ':ucode_connect_full:':'https://emoji.slack-edge.com/T01A4EB6ES0/ucode_connect_full/949a9ac9d540828a.png',
        ':ukraine_emblem:':'https://emoji.slack-edge.com/T01A4EB6ES0/ukraine_emblem/9a54300069fbf7fd.png',
        ':unicorn:':'https://emoji.slack-edge.com/T01A4EB6ES0/unicorn/ded843537aef0b2a.gif',
        ':wow:':'https://emoji.slack-edge.com/T01A4EB6ES0/wow/50afad8ae00e499f.gif',
        ':youtube:':'https://emoji.slack-edge.com/T01A4EB6ES0/youtube/f4d8568e5d66ceab.jpg'};
    function wrap(imgUrl) {
        return `<img src="${imgUrl}" style="height:20px;margin-left:2px;margin-bottom:-5px;" alt="">`;
    }

    if (statusStr) {
        Object.keys(emojis).forEach(key => {
            statusStr = statusStr.replaceAll(key, wrap(emojis[key]));
        });
    }
    else {
        statusStr = '';
    }
    return statusStr;
}

function secondsToDays(seconds) {
    seconds = Number(seconds);
    let d = Math.floor(seconds / (3600 * 24));
    let h = Math.floor(seconds % (3600 * 24) / 3600);
    let m = Math.floor(seconds % 3600 / 60);
    let s = Math.floor(seconds % 60);
    if (h < 10) h = `0${h}`;
    if (m < 10) m = `0${m}`;
    if (s < 10) s = `0${s}`;
    return `${d} days ${h}:${m}:${s}`;
}

function requestSelf() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        let res = request.response;

        // Status element
        let mdc_chip = document.createElement('mdc-chip');
        mdc_chip.className = "lives-token mdc-chip ng-star-inserted mdc-ripple-upgraded";
        mdc_chip.style.margin = "7px auto";
        mdc_chip.style.maxWidth = "260px";
        mdc_chip.style.height = "auto";
        mdc_chip.style.minHeight = "32px";
        let mdc_icon = document.createElement("mdc-icon");
        mdc_icon.className = "mdc-chip__icon ngx-mdc-icon material-icons mdc-chip__icon--leading";
        mdc_icon.innerText = "info";
        let textStatus = document.createElement('mdc-chip-text');
        textStatus.className = "mdc-chip__text";
        textStatus.innerHTML = makeStatus(res['socials']['status']);
        mdc_chip.appendChild(mdc_icon);
        mdc_chip.appendChild(textStatus);

        // Feedback comments element
        let feedback_block = document.createElement('div');
        feedback_block.className = "content-block";
        let fb_mdc_card = document.createElement('mdc-card');
        fb_mdc_card.className = "rounded-card mdc-card mdc-card--outlined ng-star-inserted";
        fb_mdc_card.style.padding = "12px 0 12px 24px";
        fb_mdc_card.style.cursor = "pointer";
        fb_mdc_card.innerHTML = "Show all feedback comments";
        let fb_mdc_list = document.createElement('mdc-list');
        fb_mdc_list.className = "mdc-list mdc-list--avatar-list ng-star-inserted";
        fb_mdc_list.style.marginLeft = "-24px";
        fb_mdc_list.style.whiteSpace = "pre";
        feedback_block.appendChild(fb_mdc_card);

        // More information
        function moreInfoElement(icon, primaryText, secondaryText, smallText) {
            let spent_time_block = document.createElement('mdc-list-item');
            spent_time_block.className = "mdc-list-item mdc-ripple-upgraded";
            let st_mdc_icon = document.createElement('mdc-icon');
            st_mdc_icon.className = "ngx-mdc-icon mdc-list-item__graphic material-icons";
            st_mdc_icon.innerText = icon;
            let st_mdc_list_item_text = document.createElement('mdc-list-item-text');
            st_mdc_list_item_text.className = "mdc-list-item__text";
            let st_primary_text = document.createElement('span');
            st_primary_text.className = "mdc-list-item__primary-text";
            st_primary_text.innerText = primaryText;
            if (smallText)
                st_primary_text.style.fontSize = "14px";
            let st_secondary_text = document.createElement('span');
            st_secondary_text.className = "mdc-list-item__secondary-text ng-star-inserted";
            st_secondary_text.innerText = secondaryText;
            spent_time_block.appendChild(st_mdc_icon);
            spent_time_block.appendChild(st_mdc_list_item_text);
            st_mdc_list_item_text.appendChild(st_primary_text);
            st_mdc_list_item_text.appendChild(st_secondary_text);
            return spent_time_block;
        }

        console.log(textStatus.textContent);
        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mdc-chip-set")[0];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            // Left-side menu
            let leftMenu = document.getElementsByClassName("rounded-card profile-information mdc-card mdc-card--outlined")[0];
            leftMenu.style.minWidth = "280px";

            // Status
            elem.appendChild(mdc_chip);

            // Feedback
            let fb_elem = document.getElementsByClassName("content")[0];
            fb_elem.appendChild(feedback_block);
            let open = false;
            feedback_block.onclick = () => {
                if (open)
                    return;
                open = true;

                fb_mdc_card.appendChild(fb_mdc_list);
                let arr = [];
                let i = 0, max = 0;
                function reqCycle() {
                    if (i >= 20) {
                        fillOnPage();
                        return;
                    }
                    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/assessor-comments/");
                    request.onload = function () {
                        let fb_res = request.response;
                        i++;
                        if (i > max)
                            max = i;
                        fb_mdc_list.innerHTML = "<code>    Loading: " + max * 10 / 2 + "%</code>";
                        fb_res.forEach(value => {
                            let existsIn = false;
                            arr.forEach(arrValue => {
                                if (arrValue === value)
                                    existsIn = true;
                            });
                            if (!existsIn) {
                                arr.push(value);
                                i = 0;
                            }
                        });
                        reqCycle();
                    }
                }
                reqCycle();
                function fillOnPage() {
                    arr.forEach(value => {
                        let fb_mdc_list_item = document.createElement('mdc-list-item');
                        fb_mdc_list_item.className = "height-a mdc-list-item ng-star-inserted mdc-ripple-upgraded";
                        let fb_mdc_list_divider = document.createElement('mdc-list-divider');
                        fb_mdc_list_divider.className = "mdc-list-divider";
                        let fb_mdc_icon = document.createElement('mdc-icon');
                        fb_mdc_icon.className = "ngx-mdc-icon mdc-list-item__graphic material-icons";
                        fb_mdc_icon.innerHTML = "person_outline";
                        let fb_text = document.createElement('span');
                        fb_text.innerText = value;
                        fb_mdc_list.appendChild(fb_mdc_list_divider);
                        fb_mdc_list.appendChild(fb_mdc_list_item);
                        fb_mdc_list_item.appendChild(fb_mdc_icon);
                        fb_mdc_list_item.appendChild(fb_text);
                    });
                }
            }

            // More info
            let moreInfoElem = document.getElementsByClassName("mdc-list mdc-list--avatar-list mdc-list--two-line")[0];
            let mi_mdc_list_divider = document.createElement('mdc-list-divider');
            mi_mdc_list_divider.className = "mdc-list-divider";
            moreInfoElem.appendChild(mi_mdc_list_divider);
            moreInfoElem.appendChild(moreInfoElement("catching_pokemon", res['adventure_users'][res['adventure_users'].length - 1]['adventure_name'], 'Adventure', true));
            mi_mdc_list_divider = document.createElement('mdc-list-divider');
            mi_mdc_list_divider.className = "mdc-list-divider";
            moreInfoElem.appendChild(mi_mdc_list_divider);
            moreInfoElem.appendChild(moreInfoElement("timer", secondsToDays(res['spent_time']), 'Spent time'));
            mi_mdc_list_divider = document.createElement('mdc-list-divider');
            mi_mdc_list_divider.className = "mdc-list-divider";
            moreInfoElem.appendChild(mi_mdc_list_divider);
            moreInfoElem.appendChild(moreInfoElement("label", res['id'], 'User ID'));
        }
        waitUntilPageLoads();
    }
}

function requestSettings() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        let res = request.response;

        let selfId = res['id'];
        let selfStatus = res['socials']['status'] ? res['socials']['status'] : '';

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
                let selfStatus = document.getElementById("statusInput").value.replaceAll('"', '\\"');
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
        mdc_chip.id = "ext-status";
        mdc_chip.className = "lives-token mdc-chip ng-star-inserted mdc-ripple-upgraded";
        mdc_chip.style.margin = "7px auto";
        mdc_chip.style.maxWidth = "180px";
        let mdc_icon = document.createElement("mdc-icon");
        mdc_icon.className = "mdc-chip__icon ngx-mdc-icon material-icons mdc-chip__icon--leading";
        mdc_icon.innerText = "info";
        let textStatus = document.createElement('mdc-chip-text');
        textStatus.className = "mdc-chip__text";
        textStatus.innerHTML = makeStatus(res['socials']['status']);
        mdc_chip.appendChild(mdc_icon);
        mdc_chip.appendChild(textStatus);
        console.log(textStatus.textContent);
        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mdc-chip-set")[0];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            let prevElem = document.getElementById("ext-status");
            if (prevElem)
                prevElem.parentNode.removeChild(prevElem);
            elem.appendChild(mdc_chip);
        }
        waitUntilPageLoads();
    }
}

function requestStatistics() {
    let request = requestSend('GET', 'https://lms.ucode.world/api/v0/frontend/statistics/users/');
    request.onload = function () {
        let res = request.response;
        let usersList = res['results'];
        console.log(usersList.length);

        function waitUntilPageLoads() {
            let rows = document.getElementsByClassName("mat-row");
            if (!rows) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            let header = document.getElementsByClassName("mat-header-row")[0];
            if (!header) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            let th = document.createElement('th');
            th.className = "mat-header-cell cdk-column-photo mat-column-photo ng-star-inserted";
            th.innerHTML = "Spent time";
            th.style.fontSize = "20px";
            th.style.textAlign = "center";
            header.appendChild(th);

            for (let i = 0; i < usersList.length; i++) {
                let tr = rows[i];
                if (!tr) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                    return;
                }
                let datetime  = usersList[i]['spent_time'].split(' ');
                let days = '', time = '';
                if (datetime.length === 2) {
                    days = datetime[0] + ' days';
                    time = datetime[1].slice(0, 8);
                }
                else
                    time = datetime[1].slice(0, 8);

                let timeElem = document.createElement('td');
                timeElem.className = "mat-cell cdk-column-level mat-column-level ng-star-inserted";
                timeElem.innerHTML = days + " " + time;
                timeElem.style.fontSize = "17px";
                timeElem.style.textAlign = "center";
                console.log(usersList[i]['spent_time']);
                tr.appendChild(timeElem);
            }
        }
        waitUntilPageLoads();
    }
}
