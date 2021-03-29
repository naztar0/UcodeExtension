const pageLoadRefreshTimeout = 200;
let token = null;
let url = null;

chrome.storage.sync.get(['token', 'url'], function (result) {
    token = result.token;
    url = new URL(result.url);
    urlHandler();
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    chrome.storage.sync.get(changes, function (result) {
        for (let key in changes) {
            if (key === 'url') {
                if (!result.url)
                    continue;
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

function urlHandler() {
    let path = url.pathname.split('/');
    if (path[1] === '') {
        requestSelf();
    }
    else if (path[1] === 'challenge_users') {
        requestChallenge(path[2]);
    }
    else if (path[1] === 'users') {
        requestUsers(path[2]);
    }
    else if (path[1] === 'settings') {
        requestSettings();
    }
    else if (path[1] === 'statistics') {
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
        ':pepedance:':'https://i.pinimg.com/originals/5d/ee/91/5dee91700de2b898f61260bea7322a5c.gif',
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

function getStyleCode() {
    let styles = document.getElementsByTagName('style');
    for (let i = 0; i < styles.length; i++) {
        let sRegex = styles[i].innerHTML.match(/_ngcontent-\w{3}-c242/);
        if (sRegex)
            return sRegex[0];
    }
    return '';
}

function requestSelf() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        let res = request.response;

        let styleCode = getStyleCode();

        // Status element
        let mat_chip = document.createElement('mat-chip');
        mat_chip.id = "elemToCheckCreation";
        mat_chip.className = "mat-chip mat-focus-indicator cursor-pointer mat-primary mat-standard-chip ng-star-inserted";
        mat_chip.setAttribute(styleCode, '');
        mat_chip.style.margin = "7px auto";
        mat_chip.style.maxWidth = "260px";
        mat_chip.style.height = "auto";
        mat_chip.style.minHeight = "32px";
        let mat_icon = document.createElement("mat-icon");
        mat_icon.setAttribute(styleCode, '');
        mat_icon.className = "mat-icon notranslate material-icons mat-icon-no-color";
        mat_icon.innerText = "info";
        let textStatus = document.createElement('span');
        textStatus.setAttribute(styleCode, '');
        if (res['socials'])
            textStatus.innerHTML = makeStatus(res['socials']['status']);
        mat_chip.appendChild(mat_icon);
        mat_chip.appendChild(textStatus);

        // Feedback comments element
        let feedback_block = document.createElement('div');
        feedback_block.className = "content-block";
        feedback_block.setAttribute(styleCode, '');
        let fb_mat_card = document.createElement('mat-card');
        fb_mat_card.className = "mat-card rounded-card";
        fb_mat_card.style.padding = "12px 0 12px 24px";
        fb_mat_card.style.cursor = "pointer";
        fb_mat_card.innerHTML = "Show all feedback comments";
        let fb_mat_list = document.createElement('mat-list');
        fb_mat_list.setAttribute(styleCode, '');
        fb_mat_list.className = "mat-list mat-list-base ng-star-inserted";
        fb_mat_list.style.marginLeft = "-24px";
        fb_mat_list.style.whiteSpace = "pre";
        feedback_block.appendChild(fb_mat_card);

        // More information
        function moreInfoElement(icon, primaryText, secondaryText, smallText) {
            let spent_time_block = document.createElement('mat-list-item');
            spent_time_block.setAttribute(styleCode, '');
            spent_time_block.className = "mat-list-item mat-focus-indicator";
            let st_div = document.createElement('div');
            st_div.className = "mat-list-item-content";
            let st_mat_icon = document.createElement('mat-icon');
            st_mat_icon.setAttribute(styleCode, '');
            st_mat_icon.className = "mat-icon material-icons mat-icon-no-color";
            st_mat_icon.innerText = icon;
            let st_p = document.createElement('p');
            st_p.setAttribute(styleCode, '');
            st_p.innerText = primaryText;
            if (smallText)
                st_p.style.fontSize = "14px";
            let st_br = document.createElement('br');
            let st_secondary_text = document.createElement('span');
            st_secondary_text.setAttribute(styleCode, '');
            st_secondary_text.innerText = secondaryText;
            spent_time_block.appendChild(st_div);
            st_div.appendChild(st_mat_icon);
            st_div.appendChild(st_p);
            st_p.appendChild(st_br);
            st_p.appendChild(st_secondary_text);
            return spent_time_block;
        }

        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mat-chip-list-wrapper")[0];
            let leftMenu = document.getElementsByClassName("mat-card mat-focus-indicator rounded-card profile-information")[0];
            let fb_elem = document.getElementsByClassName("content")[0];
            let moreInfoElem = document.getElementsByClassName("mat-list mat-list-base")[0];
            if (!elem || !leftMenu || !fb_elem || !moreInfoElem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            if (document.getElementById(mat_chip.id))
                return;
            // Left-side menu
            leftMenu.style.minWidth = "280px";

            // Status
            elem.appendChild(mat_chip);

            // Feedback
            fb_elem.appendChild(feedback_block);
            let open = false;
            feedback_block.onclick = () => {
                if (open)
                    return;
                open = true;

                fb_mat_card.appendChild(fb_mat_list);
                let arr = [];
                let i = 0, max = 0;
                function reqCycle() {
                    if (i >= 10) {
                        fillOnPage();
                        return;
                    }
                    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/assessor-comments/");
                    request.onload = function () {
                        let fb_res = request.response;
                        if (request.status === 429) {
                            let timeLeft = fb_res['detail'].match(/\d+/);
                            fb_mat_list.innerHTML = "<code>    Please wait: " + timeLeft + " s.</code>";
                            setTimeout(reqCycle, 1000);
                            return;
                        }
                        i++;
                        if (i > max)
                            max = i;
                        fb_mat_list.innerHTML = "<code>    Loading: " + max * 10 + "%</code>";
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
                        let fb_mat_list_item = document.createElement('mat-list-item');
                        fb_mat_list_item.className = "mat-list-item mat-focus-indicator height-a ng-star-inserted";
                        fb_mat_list_item.setAttribute(styleCode, '');
                        let fb_mat_div = document.createElement('div');
                        fb_mat_div.className = "mat-list-item-content";
                        let fb_mat_divider = document.createElement('mat-divider');
                        fb_mat_divider.className = "mat-divider mat-divider-horizontal";
                        fb_mat_divider.setAttribute(styleCode, '');
                        let fb_mat_icon = document.createElement('mat-icon');
                        fb_mat_icon.className = "mat-icon notranslate material-icons mat-icon-no-color";
                        fb_mat_icon.setAttribute(styleCode, '');
                        fb_mat_icon.innerHTML = "person_outline";
                        let fb_span = document.createElement('span');
                        fb_span.innerText = value;
                        fb_mat_list.appendChild(fb_mat_divider);
                        fb_mat_list.appendChild(fb_mat_list_item);
                        fb_mat_list_item.appendChild(fb_mat_div);
                        fb_mat_div.appendChild(fb_mat_icon);
                        fb_mat_div.appendChild(fb_span);
                    });
                }
            }

            // More info
            let mi_mat_divider = document.createElement('mat-divider');
            mi_mat_divider.className = "mat-divider mat-divider-horizontal";
            moreInfoElem.appendChild(mi_mat_divider);
            if (res['adventure_users'])
                moreInfoElem.appendChild(moreInfoElement("catching_pokemon", res['adventure_users'][res['adventure_users'].length - 1]['adventure_name'], 'Adventure', true));
            mi_mat_divider = document.createElement('mat-divider');
            mi_mat_divider.className = "mat-divider mat-divider-horizontal";
            moreInfoElem.appendChild(mi_mat_divider);
            moreInfoElem.appendChild(moreInfoElement("timer", secondsToDays(res['spent_time']), 'Spent time'));
            mi_mat_divider = document.createElement('mat-divider');
            mi_mat_divider.className = "mat-divider mat-divider-horizontal";
            moreInfoElem.appendChild(mi_mat_divider);
            moreInfoElem.appendChild(moreInfoElement("label", res['id'], 'User ID'));
        }
        waitUntilPageLoads();
    }
}

function requestSettings() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    // noinspection DuplicatedCode
    request.onload = function () {
        let res = request.response;

        let selfId = res['id'];
        let selfStatus = res['socials']['status'] ? res['socials']['status'] : '';
        let styleCode = getStyleCode();
        let styleCode2 = styleCode.slice(0, -1) + '3';

        let mat_form_field = document.createElement("mat-form-field");
        mat_form_field.id = "elemToCheckCreation";
        mat_form_field.className = "mat-form-field ng-tns-c72-8 mat-form-field-appearance-outline mat-form-field-can-float mat-form-field-should-float mat-form-field-has-label";
        mat_form_field.setAttribute(styleCode, '');
        mat_form_field.setAttribute(styleCode2, '');
        mat_form_field.style.width = "100%";
        let mat_form_field_wrapper = document.createElement('div');
        mat_form_field_wrapper.className = "mat-form-field-wrapper ng-tns-c72-8";
        let mat_form_field_flex = document.createElement('div');
        mat_form_field_flex.className = "mat-form-field-flex ng-tns-c72-8";
        let mat_form_field_outline = document.createElement('div');
        mat_form_field_outline.className = "mat-form-field-outline ng-tns-c72-8";
        let mat_form_field_outline_start = document.createElement('div');
        mat_form_field_outline_start.className = "mat-form-field-outline-start ng-tns-c72-8";
        mat_form_field_outline_start.style.width = "41px";
        let mat_form_field_outline_gap = document.createElement('div');
        mat_form_field_outline_gap.className = "mat-form-field-outline-gap ng-tns-c72-8";
        mat_form_field_outline_gap.style.width = "43px";
        let mat_form_field_outline_end = document.createElement('div');
        mat_form_field_outline_end.className = "mat-form-field-outline-end ng-tns-c72-8";
        let mat_form_field_outline_thick = document.createElement('div');
        mat_form_field_outline_thick.className = "mat-form-field-outline mat-form-field-outline-thick ng-tns-c72-8";
        let mat_form_field_outline_start2 = document.createElement('div');
        mat_form_field_outline_start2.className = "mat-form-field-outline-start ng-tns-c72-8";
        mat_form_field_outline_start2.style.width = "41px";
        let mat_form_field_outline_gap2 = document.createElement('div');
        mat_form_field_outline_gap2.className = "mat-form-field-outline-gap ng-tns-c72-8";
        mat_form_field_outline_gap2.style.width = "43px";
        let mat_form_field_outline_end2 = document.createElement('div');
        mat_form_field_outline_end2.className = "mat-form-field-outline-end ng-tns-c72-8";

        let mat_form_field_prefix = document.createElement('div');
        mat_form_field_prefix.className = "mat-form-field-prefix ng-tns-c72-8";
        let mat_icon = document.createElement("mat-icon");
        mat_icon.className = "mat-icon material-icons mat-icon-no-color ng-tns-c72-8";
        mat_icon.setAttribute(styleCode, '');
        mat_icon.setAttribute(styleCode2, '');
        mat_icon.innerHTML = "info";

        let mat_form_field_infix = document.createElement('div');
        mat_form_field_infix.className = "mat-form-field-infix ng-tns-c72-8";
        let input = document.createElement("input");
        input.className = "mat-input-element mat-form-field-autofill-control ng-tns-c72-8 cdk-text-field-autofill-monitored";
        input.setAttribute(styleCode, '');
        input.setAttribute(styleCode2, '');
        input.id = "statusInput";
        input.type = "text";
        input.maxLength = "100";
        input.value = selfStatus;
        let mat_form_field_label_wrapper = document.createElement('span');
        mat_form_field_label_wrapper.className = "mat-form-field-label-wrapper ng-tns-c72-8";
        let mat_form_field_label = document.createElement('label');
        mat_form_field_label.className = "mat-form-field-label ng-tns-c72-8";
        let mat_label = document.createElement('mat-label');
        mat_label.className = "ng-tns-c72-8";
        mat_label.setAttribute(styleCode, '');
        mat_label.setAttribute(styleCode2, '');
        mat_label.innerHTML = "Status";

        mat_form_field.appendChild(mat_form_field_wrapper);
        mat_form_field_wrapper.appendChild(mat_form_field_flex);
        mat_form_field_flex.appendChild(mat_form_field_outline);
        mat_form_field_outline.appendChild(mat_form_field_outline_start);
        mat_form_field_outline.appendChild(mat_form_field_outline_gap);
        mat_form_field_outline.appendChild(mat_form_field_outline_end);
        mat_form_field_flex.appendChild(mat_form_field_outline_thick);
        mat_form_field_outline_thick.appendChild(mat_form_field_outline_start2);
        mat_form_field_outline_thick.appendChild(mat_form_field_outline_gap2);
        mat_form_field_outline_thick.appendChild(mat_form_field_outline_end2);
        mat_form_field_flex.appendChild(mat_form_field_prefix);
        mat_form_field_prefix.appendChild(mat_icon);
        mat_form_field_flex.appendChild(mat_form_field_infix);
        mat_form_field_infix.appendChild(input);
        mat_form_field_infix.appendChild(mat_form_field_label_wrapper);
        mat_form_field_label_wrapper.appendChild(mat_form_field_label);
        mat_form_field_label.appendChild(mat_label);

        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("ng-untouched ng-pristine ng-valid")[8];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            if (document.getElementById("elemToCheckCreation"))
                return;
            elem.appendChild(mat_form_field);
            let button = document.getElementsByClassName("primary mat-flat-button mat-button-base")[0];
            button.className = button.className.replace("mat-button-disabled", '');
            button.removeAttribute("disabled");
            button.onclick = () => {
                let selfStatus = document.getElementById(input.id).value.replaceAll('"', '\\"');
                let payload = `{"socials":{"status":"${selfStatus}"}}`;
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

        let textExp = document.createElement('h3');
        textExp.id = "elemToCheckCreation";
        textExp.textContent = "Experience: " + res['challenge']['experience'];
        textExp.style.marginLeft = "15px";
        function waitUntilPageLoads() {
            let header = document.getElementsByClassName("header")[0];
            if (!header) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            if (document.getElementById("elemToCheckCreation"))
                return;
            header.appendChild(textExp);
        }
        waitUntilPageLoads();
    }
}

function requestUsers(id) {
    let request = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/users/${id}/`);
    request.onload = function () {
        let res = request.response;
        let styleCode = getStyleCode();

        // Status element
        let mat_chip = document.createElement('mat-chip');
        mat_chip.id = "elemToCheckCreation";
        mat_chip.className = "mat-chip mat-focus-indicator cursor-pointer mat-primary mat-standard-chip ng-star-inserted";
        mat_chip.setAttribute(styleCode, '');
        mat_chip.style.margin = "7px auto";
        mat_chip.style.maxWidth = "260px";
        mat_chip.style.height = "auto";
        mat_chip.style.minHeight = "32px";
        let mat_icon = document.createElement("mat-icon");
        mat_icon.setAttribute(styleCode, '');
        mat_icon.className = "mat-icon notranslate material-icons mat-icon-no-color";
        mat_icon.innerText = "info";
        let textStatus = document.createElement('span');
        textStatus.setAttribute(styleCode, '');
        if (res['socials'])
            textStatus.innerHTML = makeStatus(res['socials']['status']);
        mat_chip.appendChild(mat_icon);
        mat_chip.appendChild(textStatus);

        function waitUntilPageLoads() {
            let elem = document.getElementsByClassName("mat-chip-list-wrapper")[0];
            if (!elem) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            let prevElem = document.getElementById(mat_chip.id);
            if (prevElem)
                prevElem.parentNode.removeChild(prevElem);
            elem.appendChild(mat_chip);
        }
        waitUntilPageLoads();
    }
}

function requestStatistics(url=null) {
    let request = requestSend('GET', url ? url : 'https://lms.ucode.world/api/v0/frontend/statistics/users/');
    request.onload = function () {
        let res = request.response;
        let usersList = res['results'];

        function waitUntilPageLoads() {
            let rows = document.getElementsByClassName("mat-row");
            if (!rows) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            if (!url) {
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
            }
            let elemToCheckCreation = document.createElement('div');
            elemToCheckCreation.id = 'elemToCheckCreation';
            elemToCheckCreation.style.display = "none";

            if (!document.getElementById(elemToCheckCreation.id)) {
                if (!rows[0]) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                    return;
                }
                rows[0].appendChild(elemToCheckCreation);
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
                        time = datetime[0].slice(0, 8);

                    let timeElem = document.createElement('td');
                    timeElem.className = "mat-cell cdk-column-level mat-column-level ng-star-inserted";
                    timeElem.innerHTML = days + " " + time;
                    timeElem.style.fontSize = "17px";
                    timeElem.style.textAlign = "center";
                    tr.appendChild(timeElem);
                }
            }
        }
        waitUntilPageLoads();
    }
}

let e_e_cnt = 0;
const taps = 10;
document.addEventListener('keypress', (event) => {
    function e_e_play(n) {
        let audio = new Audio(`https://raw.githubusercontent.com/naztar0/PokeChat/main/client/data/pokemon-audio/${n}.wav`);
        audio.play();
    }
    const keyName = event.key;
    if (keyName === 'a') {
        if (++e_e_cnt === taps)
            new Audio("https://raw.githubusercontent.com/naztar0/PokeChat/main/client/data/sounds/high_pop.wav").play();
    }
    else if (keyName === 'p' && e_e_cnt >= taps)
        e_e_play(9);
    else if (keyName === 'b' && e_e_cnt >= taps)
        e_e_play(1);
    else if (keyName === 'c' && e_e_cnt >= taps)
        e_e_play(2);
    else if (keyName === 's' && e_e_cnt >= taps)
        e_e_play(4);
    else if (keyName === 'q' && e_e_cnt >= taps) {
        new Audio("https://www.myinstants.com/media/sounds/ear-rape-moaning-girl-troll-sound-crappy-long-edition-loudtronix-hq.mp3").play();
    }
    else
        e_e_cnt = 0;
});
