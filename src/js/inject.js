const pageLoadRefreshTimeout = 200;
const elemToCheckCreation = 'elemToCheckCreation';
let token = null;
let url = null;
let darkMode = false;

chrome.storage.sync.get(['token', 'url', 'dark_mode'], function (result) {
    token = result.token;
    url = new URL(result.url);
    if (result.dark_mode !== undefined)
        darkMode = result.dark_mode;
    urlHandler();
});

chrome.storage.onChanged.addListener((changes) => {
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
                if (url)
                    urlHandler();
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
        setDarkMode('self', 'mat-chip');
    }
    else if (path[1] === 'challenge_users') {
        requestChallenge(path[2]);
        setDarkMode('challenge_users', 'mat-card');
    }
    else if (path[1] === 'users') {
        requestUsers(path[2]);
        setDarkMode('users');
    }
    else if (path[1] === 'settings') {
        requestSettings();
        setDarkMode('settings');
    }
    else if (path[1] === 'statistics') {
        requestStatistics();
        setDarkMode('statistics');
    }
    else if (path[1] === 'available-media') {
        setDarkMode('available_media', 'mat-card');
    }
    else if (path[1] === 'slots') {
        setDarkMode('slots', 'mat-card');
    }
    else if (path[1] === 'cluster') {
        setDarkMode('cluster');
    }
    else if (path[1] === 'pdf') {
        setDarkMode('pdf');
    }
    else if (path[1] === 'login') {
        setDarkMode('login');
    }
    else if (path[1] === 'activity') {
        setDarkMode('activity');
    }
}

function requestSend(method, url, responseType='json', payload=null) {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.setRequestHeader('authorization', token);
    if (payload)
        request.setRequestHeader('content-type', 'application/json');
    request.setRequestHeader('ext', 'true');
    request.responseType = responseType;
    request.send(payload);
    return request;
}

function makeStatus(statusStr) {
    let emojis = {
        ':anaconda:':'https://emoji.slack-edge.com/T01A4EB6ES0/anaconda/740f67790b10a5c8.png',
        ':androidstudio:':'https://emoji.slack-edge.com/T01A4EB6ES0/androidstudio/b25cfe7a66e422ee.png',
        ':attentionsign:':'https://emoji.slack-edge.com/T01A4EB6ES0/attentionsign/d090299a330ae690.gif',
        ':coins:':'https://emoji.slack-edge.com/T01A4EB6ES0/coins/5e57e18df65477f9.png',
        ':flykisses:':'https://emoji.slack-edge.com/T01A4EB6ES0/flykisses/5850fb1752432449.gif',
        ':homer:':'https://emoji.slack-edge.com/T01A4EB6ES0/homer/58ba2251c6375891.gif',
        ':intel:':'https://emoji.slack-edge.com/T01A4EB6ES0/intel/4133b8a77cc98935.png',
        ':intellij-idea:':'https://emoji.slack-edge.com/T01A4EB6ES0/intellij-idea/e7c30ea5f83473ce.png',
        ':khpi:':'https://emoji.slack-edge.com/T01A4EB6ES0/khpi/68658d9aa4072b3c.png',
        ':otp:':'https://emoji.slack-edge.com/T01A4EB6ES0/otp/946307d5eb00550b.png',
        ':piitu:':'https://emoji.slack-edge.com/T01A4EB6ES0/piitu/114b1c0c94392793.jpg',
        ':phpstorm:':'https://emoji.slack-edge.com/T01A4EB6ES0/phpstorm/cbe23ca963ce722c.png',
        ':pikadance:':'https://emoji.slack-edge.com/T01A4EB6ES0/pikadance/018cf25073f7f55e.gif',
        ':pride:':'https://emoji.slack-edge.com/T01A4EB6ES0/pride/56b1bd3388.png',
        ':python3:':'https://emoji.slack-edge.com/T01A4EB6ES0/python3/425acfc82ffaf8a8.png',
        ':rainbowcat:':'https://emoji.slack-edge.com/T01A4EB6ES0/rainbowcat/fdaba9b7dd08accb.gif',
        ':shipit:':'https://emoji.slack-edge.com/T01A4EB6ES0/squirrel/465f40c0e0.png',
        ':slack:':'https://emoji.slack-edge.com/T01A4EB6ES0/slack/7d462d2443.png',
        ':squidward:':'https://emoji.slack-edge.com/T01A4EB6ES0/squidward/4fbd679d28d880d8.gif',
        ':thumbsup_all:':'https://emoji.slack-edge.com/T01A4EB6ES0/thumbsup_all/50096a1020.gif',
        ':ucode_connect:':'https://emoji.slack-edge.com/T01A4EB6ES0/ucode_connect/20ae00dd4fab4b5a.png',
        ':ucode_connect_full:':'https://emoji.slack-edge.com/T01A4EB6ES0/ucode_connect_full/949a9ac9d540828a.png',
        ':ukraine_emblem:':'https://emoji.slack-edge.com/T01A4EB6ES0/ukraine_emblem/9a54300069fbf7fd.png',
        ':unicorn:':'https://emoji.slack-edge.com/T01A4EB6ES0/unicorn/ded843537aef0b2a.gif',
        ':webstorm:':'https://emoji.slack-edge.com/T01A4EB6ES0/webstorm/2db07d87faccf03f.png',
        ':wow:':'https://emoji.slack-edge.com/T01A4EB6ES0/wow/50afad8ae00e499f.gif',
        ':youtube:':'https://emoji.slack-edge.com/T01A4EB6ES0/youtube/f4d8568e5d66ceab.jpg'};
    function wrap(imgUrl) {
        return `<img src="${imgUrl}" style="height:20px;margin-left:2px;margin-bottom:-5px;" alt="">`;
    }

    if (statusStr) {
        let params = statusStr.split(';');
        if (params[0] === 'githubstats' && params.length > 1) {
            let username = params[1], theme = '';
            if (params.length > 2)
                theme = params[2];
            return `<img src="https://github-readme-stats.vercel.app/api?username=${username}&theme=${theme}&count_private=true"
                    style="width: 250px; border-radius: 13px; margin-left: -33px; margin-top: 5px;" alt="">`;
        }
        else if (params[0] === 'img' && params.length > 1) {
            let img = params[1], link = '#';
            if (params.length > 2)
                link = params[2];
            return `<a href="${link}"><img src="${img}" 
                    style="width: 245px; border-radius: 10px; margin-left: -30px; margin-top: 7px; margin-bottom: 4px;" alt=""></a>`;
        }
        else {
            Object.keys(emojis).forEach(key => {
                statusStr = statusStr.replaceAll(key, wrap(emojis[key]));
            });
        }
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

function getStyleCode(className, index=0) {
    let elem = document.getElementsByClassName(className)[index];
    if (!elem)
        return null;
    let len = elem.attributes.length;
    for (let i = 0; i < len; i++){
        let att = elem.attributes[i].nodeName;
        if (att.match(/_ngcontent-\w{3}-\w\d{3}/))
            return att;
    }
    return '_';
}

function setDarkMode(page, styleCodeClassName=null, index=0) {
    if (!darkMode)
        return;
    let styleCode = null;
    if (styleCodeClassName) {
        styleCode = getStyleCode(styleCodeClassName, index);
        if (!styleCode) {
            setTimeout(setDarkMode, pageLoadRefreshTimeout, page, styleCodeClassName, index);
            return;
        }
    }
    let stylesSelf = `
        body {
            background-color: #202225;
            background-image: none;
        }
        .mat-card, .mat-expansion-panel, .mat-card[${styleCode}] h3[${styleCode}] {
            color: #B9BBBE !important;
            background-color: #2F3136;
        }
        .challenges-header-title[${styleCode}], .mat-expansion-panel-header-title, .mat-list-base .mat-list-item, 
        .mat-list-base .mat-list-option {
            color: #B9BBBE !important;
        }
        .month-name text, .weekday text {
            fill: #70747B !important;
        }
        button.level {
            background-color: #5d78bb !important;
        }
        .profile[${styleCode}] .profile-information[${styleCode}] .mat-chip-list[${styleCode}] .mat-chip[${styleCode}] .mat-icon[${styleCode}] {
            color: #9e9e9e;
        }
        .mat-chip.mat-standard-chip {
            background-color: #393C43 !important;
            color: #B9BBBE !important;
        }
        text.legend {
            fill: #b9bbbe;
        }
        .day {
            fill: #292B2F;
        }
        .mat-expansion-indicator:after {
            color: inherit;
        }
        /*.progress svg {
            stroke: #292b2f; // circle 1
            stroke: #bb5d5d; // circle 2
        }*/
    `;
    let stylesChallenge = `
        .mat-form-field-appearance-outline .mat-form-field-outline {
            color: rgba(255,255,255,.12);
        }
        h4[${styleCode}], .mat-form-field-label, .mat-hint, .mat-select-value, .mat-select-arrow {
            color: #B9BBBE !important;
        }
        .repository-link-wrapper[${styleCode}] .repository-link-wrapper__item[${styleCode}] .mat-form-field-infix .mat-icon {
            background: none;
        }
        .msg[${styleCode}], .attempt-summary .users .user {
            background:#393C43 !important;
        }
        .msg[${styleCode}] *, .media .mat-list .mat-list-item p {
            color: #5d78bb !important;
        }
    `;
    let stylesAvailableMedia = `
        .mat-paginator {
            color: rgba(255,255,255,.54);
            background: #2f3136;
        }
        mat-paginator {
            border: none !important;
        }
        .header-title[${styleCode}], .list[${styleCode}] .list-items-block-title[${styleCode}] {
            color: #B9BBBE;
        }
    `;
    let stylesSlots = `
        .slots-card[${styleCode}] full-calendar .fc-day {
            background-color: #2f3136;
        }
        .fc-theme-standard th, .fc-theme-standard td, .fc-theme-standard .fc-scrollgrid {
            border: 1px solid #7d7d7d !important;
        }
        a {
            color: #5d78bb !important;
        }
        full-calendar .fc-timegrid-event.fc-event, .legend-block[${styleCode}] .color.future[${styleCode}] {
            background-color: #7d7d7d !important;
        }
    `;
    let stylesCluster = `
        .mat-select-value, .mat-select-arrow, .mat-form-field-label, .mat-input-element::placeholder {
            color: #B9BBBE !important;
        }
        .mat-form-field-appearance-outline .mat-form-field-outline {
            color: rgb(255 255 255 / 12%);
        }
        .cluster-wrapper span {
            background: #2f3136 !important;
        }
    `;
    let stylesStatistics = `
        .mat-header-cell, .mat-cell, .mat-footer-cell {
            color: #B9BBBE !important;
        }
        .mat-table {
            background: none !important;
        }
        .mat-paginator {
            color: rgba(255,255,255,.54);
            background: #2f3136;
        }
        mat-paginator {
            border: none !important;
        }
        .mat-select-value, .mat-select-arrow, .mat-form-field-label, .mat-input-element::placeholder {
            color: #B9BBBE !important;
        }
        .mat-form-field-appearance-outline .mat-form-field-outline {
            color: rgb(255 255 255 / 12%);
        }
    `;
    let stylesSettings = `
        .mat-tab-label, .mat-tab-link {
            color: #B9BBBE !important;
            opacity: 1 !important;
        }
        .mat-select-value, .mat-select-arrow, .mat-form-field-label, .mat-input-element::placeholder {
            color: #B9BBBE !important;
        }
        .mat-form-field-appearance-outline .mat-form-field-outline {
            color: rgb(255 255 255 / 12%);
        }
    `;
    let stylesPdf = `
        body {
            background-color: #202225;
            background-image: none;
        }
    `;
    let stylesLogin = `
        .mat-input-element {
            background-color: transparent !important;
            background: #2F3136 !important;
        }
        body {
            background-color: #202225;
            background-image: none;
        }
        .mat-card {
            color: #B9BBBE !important;
            background-color: #2F3136;
        }
        .mat-form-field-appearance-legacy .mat-form-field-label {
            color: #B9BBBE !important;
        }
        .mat-chip.mat-standard-chip {
            background-color: #393C43 !important;
            color: #B9BBBE !important;
        }
    `;
    let stylesUsers = `
        .social-icons {
            filter: invert(1);
        }
    `;
    let stylesActivity = `
        .mat-list-base .mat-subheader {
            color: #B9BBBE !important;
        }
        .demo-list--custom mat-list-item mat-icon {
            background: #5d78bb !important;
        }
        .demo-list--custom mat-list-item mat-icon:after {
            border: 1px solid #5d78bb !important;
        }
        .mat-select-value, .mat-select-arrow, .mat-form-field-label, .mat-input-element::placeholder {
            color: #B9BBBE !important;
        }
        .mat-form-field-appearance-outline .mat-form-field-outline {
            color: rgb(255 255 255 / 12%);
        }
    `;


    let styleSheet = document.createElement("style");
    if (page === 'self')
        styleSheet.innerText = stylesSelf;
    else if (page === 'challenge_users')
        styleSheet.innerText = stylesChallenge;
    else if (page === 'available_media')
        styleSheet.innerText = stylesAvailableMedia;
    else if (page === 'slots')
        styleSheet.innerText = stylesSlots;
    else if (page === 'cluster')
        styleSheet.innerText = stylesCluster;
    else if (page === 'statistics')
        styleSheet.innerText = stylesStatistics;
    else if (page === 'settings')
        styleSheet.innerText = stylesSettings;
    else if (page === 'pdf')
        styleSheet.innerText = stylesPdf;
    else if (page === 'login')
        styleSheet.innerText = stylesLogin;
    else if (page === 'users')
        styleSheet.innerText = stylesUsers;
    else if (page === 'activity')
        styleSheet.innerText = stylesActivity;
    document.head.appendChild(styleSheet);

    // Self progress
    if (page === 'self2') {
        let progress = document.getElementsByClassName("progress")[0].getElementsByTagName("svg")[0];
        progress.childNodes[0].style.stroke = "#292b2f";
        progress.childNodes[1].style.stroke = "#5d78bb";
    }
}

function requestSelf() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    request.onload = function () {
        if (request.status === 401)
            return;
        let res = request.response;

        // Status element
        let mat_chip = document.createElement('mat-chip');
        mat_chip.id = elemToCheckCreation;
        mat_chip.className = "mat-chip mat-focus-indicator cursor-pointer mat-primary mat-standard-chip ng-star-inserted";
        mat_chip.style.margin = "7px auto";
        mat_chip.style.maxWidth = "260px";
        mat_chip.style.height = "auto";
        mat_chip.style.minHeight = "32px";
        let mat_icon = document.createElement("mat-icon");
        mat_icon.className = "mat-icon notranslate material-icons mat-icon-no-color";
        mat_icon.innerText = "info";
        let textStatus = document.createElement('span');
        if (res['socials'])
            textStatus.innerHTML = makeStatus(res['socials']['status']);
        mat_chip.appendChild(mat_icon);
        mat_chip.appendChild(textStatus);

        // Feedback comments element
        let feedback_block = document.createElement('div');
        feedback_block.id = elemToCheckCreation+'1';
        feedback_block.className = "content-block";
        let fb_mat_card = document.createElement('mat-card');
        fb_mat_card.className = "mat-card rounded-card";
        fb_mat_card.style.padding = "12px 0 12px 24px";
        fb_mat_card.style.cursor = "pointer";
        fb_mat_card.innerHTML = "Show all feedback comments";
        let fb_mat_list = document.createElement('mat-list');
        fb_mat_list.className = "mat-list mat-list-base ng-star-inserted";
        fb_mat_list.style.marginLeft = "-24px";
        fb_mat_list.style.whiteSpace = "pre";
        feedback_block.appendChild(fb_mat_card);

        // More information
        function moreInfoElement(icon, primaryText, secondaryText, styleCode, smallText=false) {
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

        function waitUntilPageLoads(section) {
            // Status
            if (section === 0) {
                let elem = document.getElementsByClassName("mat-chip-list-wrapper")[0];
                if (!elem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                setDarkMode('self2', 'mat-chip');  // Only for progress circles
                if (document.getElementById(elemToCheckCreation))
                    return;
                elem.appendChild(mat_chip);
            }
            // Left-side menu
            else if (section === 1) {
                let leftMenu = document.getElementsByClassName("mat-card mat-focus-indicator rounded-card profile-information")[0];
                if (!leftMenu) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                leftMenu.style.minWidth = "280px";
            }
            // Feedback
            else if (section === 2) {
                let fb_elem = document.getElementsByClassName("content")[0];
                if (!fb_elem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                if (document.getElementById(elemToCheckCreation+'1'))
                    return;
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
                        let styleCode = getStyleCode('mat-chip');
                        if (!styleCode) {
                            setTimeout(fillOnPage, pageLoadRefreshTimeout);
                            return;
                        }
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
            }
            // More info
            else if (section === 3) {
                let moreInfoElem = document.getElementsByClassName("mat-list mat-list-base")[0];
                if (!moreInfoElem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                let styleCode = getStyleCode('mat-chip');
                if (!styleCode) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                if (document.getElementById(elemToCheckCreation+'2'))
                    return;
                let mi_mat_divider = document.createElement('mat-divider');
                mi_mat_divider.id = elemToCheckCreation+'2';
                mi_mat_divider.className = "mat-divider mat-divider-horizontal";
                moreInfoElem.appendChild(mi_mat_divider);
                if (res['adventure_users'])
                    moreInfoElem.appendChild(moreInfoElement("catching_pokemon",
                        res['adventure_users'][res['adventure_users'].length - 1]['adventure_name'], 'Adventure', styleCode, true));
                mi_mat_divider = document.createElement('mat-divider');
                mi_mat_divider.className = "mat-divider mat-divider-horizontal";
                moreInfoElem.appendChild(mi_mat_divider);
                moreInfoElem.appendChild(moreInfoElement("timer", secondsToDays(res['spent_time']), 'Spent time', styleCode));
                mi_mat_divider = document.createElement('mat-divider');
                mi_mat_divider.className = "mat-divider mat-divider-horizontal";
                moreInfoElem.appendChild(mi_mat_divider);
                moreInfoElem.appendChild(moreInfoElement("label", res['id'], 'User ID', styleCode));
            }
            else if (section === 4) {
                let styleCode = getStyleCode('mat-chip');
                if (!styleCode) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                mat_chip.setAttribute(styleCode, '');
                mat_icon.setAttribute(styleCode, '');
                textStatus.setAttribute(styleCode, '');
                feedback_block.setAttribute(styleCode, '');
                fb_mat_list.setAttribute(styleCode, '');
            }
        }
        for (let section = 0; section <= 4; section++)
            waitUntilPageLoads(section);
    }
}

function requestSettings() {
    let request = requestSend('GET', "https://lms.ucode.world/api/v0/frontend/user/self/");
    // noinspection DuplicatedCode
    request.onload = function () {
        let res = request.response;

        let selfId = res['id'];
        let selfStatus = res['socials']['status'] ? res['socials']['status'] : '';

        // Status
        let mat_form_field = document.createElement("mat-form-field");
        mat_form_field.id = elemToCheckCreation;
        mat_form_field.className = "mat-form-field ng-tns-c72-8 mat-form-field-appearance-outline mat-form-field-can-float mat-form-field-should-float mat-form-field-has-label";
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
        mat_icon.innerHTML = "info";

        let mat_form_field_infix = document.createElement('div');
        mat_form_field_infix.className = "mat-form-field-infix ng-tns-c72-8";
        let input = document.createElement("input");
        input.className = "mat-input-element mat-form-field-autofill-control ng-tns-c72-8 cdk-text-field-autofill-monitored";
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

        // Dark Mode
        let dm_hr = document.createElement('hr');
        let dm_title = document.createElement('p');
        dm_title.style.textAlign = "center";
        dm_title.innerHTML = "Theme Settings";
        let dm_div = document.createElement('div');
        dm_div.style.textAlign = "center";
        let checkboxClassNames = ["mat-checkbox mat-accent", "mat-checkbox mat-accent mat-checkbox-checked"];
        let dm_mat_checkbox = document.createElement('mat-checkbox');
        dm_mat_checkbox.className = darkMode ? checkboxClassNames[1] : checkboxClassNames[0];
        let dm_label = document.createElement('label');
        dm_label.className = "mat-checkbox-layout";
        let dm_mat_checkbox_inner_container = document.createElement('span');
        dm_mat_checkbox_inner_container.className = "mat-checkbox-inner-container";
        let dm_mat_checkbox_input = document.createElement('input');
        dm_mat_checkbox_input.className = "mat-checkbox-input cdk-visually-hidden";
        dm_mat_checkbox_input.id = "darkModeCheckbox";
        dm_mat_checkbox_input.type = "checkbox";
        dm_label.setAttribute("for", dm_mat_checkbox_input.id);
        let dm_mat_ripple = document.createElement('span');
        dm_mat_ripple.className = "mat-ripple mat-checkbox-ripple";
        let dm_mat_ripple_element = document.createElement('span');
        dm_mat_ripple_element.className = "mat-ripple-element mat-checkbox-persistent-ripple";
        let dm_mat_checkbox_frame = document.createElement('span');
        dm_mat_checkbox_frame.className = "mat-checkbox-frame";
        let dm_mat_checkbox_bg = document.createElement('span');
        dm_mat_checkbox_bg.className = "mat-checkbox-background";
        dm_mat_checkbox_bg.innerHTML = "<svg focusable=\"false\" viewBox=\"0 0 24 24\" xml:space=\"preserve\" " +
            "class=\"mat-checkbox-checkmark\"><path fill=\"none\" stroke=\"white\" d=\"M4.1,12.7 9,17.6 20.3,6.3\" " +
            "class=\"mat-checkbox-checkmark-path\"></path></svg>";
        let dm_text = document.createElement('span');
        dm_text.innerHTML = "Dark Mode 🌙";
        let dm_hint = document.createElement('p');
        dm_hint.style.textAlign = "center";
        dm_hint.style.display = "none";
        dm_hint.innerHTML = "<u>Reload the page for the changes to take effect</u>";

        dm_div.appendChild(dm_mat_checkbox);
        dm_mat_checkbox.appendChild(dm_label);
        dm_label.appendChild(dm_mat_checkbox_inner_container);
        dm_mat_checkbox_inner_container.appendChild(dm_mat_checkbox_input);
        dm_mat_checkbox_inner_container.appendChild(dm_mat_ripple);
        dm_mat_ripple.appendChild(dm_mat_ripple_element);
        dm_mat_checkbox_inner_container.appendChild(dm_mat_checkbox_frame);
        dm_mat_checkbox_inner_container.appendChild(dm_mat_checkbox_bg);
        dm_div.appendChild(dm_text);

        function waitUntilPageLoads(section) {
            if (section === 0) {
                let elem = document.getElementsByClassName("ng-untouched ng-pristine ng-valid")[8];
                if (!elem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                if (document.getElementById(elemToCheckCreation))
                    return;
                elem.appendChild(mat_form_field);
            }
            else if (section === 1) {
                let button = document.getElementsByClassName("primary mat-flat-button mat-button-base")[0];
                if (!button) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                button.className = button.className.replace("mat-button-disabled", '');
                button.removeAttribute("disabled");
                button.onclick = () => {
                    let selfStatus = document.getElementById(input.id).value.replaceAll('"', '\\"');
                    let payload = `{"socials":{"status":"${selfStatus}"}}`;
                    setTimeout(requestSend, 1000, 'PATCH', `https://lms.ucode.world/api/v0/frontend/users/${selfId}/`, 'json', payload);
                }
            }
            else if (section === 2) {
                let elem = document.getElementsByClassName("switch-field")[0];
                if (!elem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                if (document.getElementById(dm_mat_checkbox_input.id))
                    return;
                elem.appendChild(dm_hr);
                elem.appendChild(dm_title);
                elem.appendChild(dm_div);
                elem.appendChild(dm_hint);
                dm_mat_checkbox.onmousedown = () => {
                    darkMode = !darkMode;
                    chrome.storage.sync.set({dark_mode: darkMode}, () => {});
                    dm_mat_checkbox.className = darkMode ? checkboxClassNames[1] : checkboxClassNames[0];
                    dm_hint.style.display = "block";
                }
            }
            else if (section === 3) {
                let styleCode = getStyleCode("mat-form-field");
                if (!styleCode) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                mat_form_field.setAttribute(styleCode, '');
                mat_icon.setAttribute(styleCode, '');
                input.setAttribute(styleCode, '');
                mat_label.setAttribute(styleCode, '');
                dm_hr.setAttribute(styleCode, '');
                dm_title.setAttribute(styleCode, '');
                dm_mat_checkbox.setAttribute(styleCode, '');
            }
        }
        for (let section = 0; section <= 3; section++)
            waitUntilPageLoads(section);
    }
}

function requestChallenge(id) {
    let request = requestSend('GET', `https://lms.ucode.world/api/v0/frontend/challenge_users/${id}/`);
    request.onload = function () {
        let res = request.response;

        let textExp = document.createElement('h3');
        textExp.id = elemToCheckCreation;
        textExp.textContent = "Experience: " + res['challenge']['experience'];
        textExp.style.marginLeft = "15px";
        function waitUntilPageLoads() {
            let header = document.getElementsByClassName("header")[0];
            if (!header) {
                setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                return;
            }
            if (document.getElementById(elemToCheckCreation))
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

        // Status element
        let mat_chip = document.createElement('mat-chip');
        mat_chip.id = elemToCheckCreation;
        mat_chip.className = "mat-chip mat-focus-indicator cursor-pointer mat-primary mat-standard-chip ng-star-inserted";
        mat_chip.style.margin = "7px auto";
        mat_chip.style.maxWidth = "260px";
        mat_chip.style.height = "auto";
        mat_chip.style.minHeight = "32px";
        let mat_icon = document.createElement("mat-icon");
        mat_icon.className = "mat-icon notranslate material-icons mat-icon-no-color";
        mat_icon.innerText = "info";
        let textStatus = document.createElement('span');
        if (res['socials'])
            textStatus.innerHTML = makeStatus(res['socials']['status']);
        mat_chip.appendChild(mat_icon);
        mat_chip.appendChild(textStatus);

        function waitUntilPageLoads(section) {
            if (section === 0) {
                let elem = document.getElementsByClassName("mat-chip-list-wrapper")[0];
                if (!elem) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                setDarkMode('self2', 'mat-chip');  // Only for progress circles
                let prevElem = document.getElementById(elemToCheckCreation);
                if (prevElem)
                    prevElem.parentNode.removeChild(prevElem);
                elem.appendChild(mat_chip);
            }
            // Left-side menu
            else if (section === 1) {
                let leftMenu = document.getElementsByClassName("mat-card mat-focus-indicator rounded-card profile-information")[0];
                if (!leftMenu) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                leftMenu.style.minWidth = "280px";
            }
            else if (section === 2) {
                let styleCode = getStyleCode('mat-chip', 1);
                if (!styleCode) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout, section);
                    return;
                }
                mat_chip.setAttribute(styleCode, '');
                mat_icon.setAttribute(styleCode, '');
                textStatus.setAttribute(styleCode, '');
            }
        }
        for (let section = 0; section <= 2; section++)
            waitUntilPageLoads(section);
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
            let elemToCheck = document.createElement('div');
            elemToCheck.id = elemToCheckCreation;
            elemToCheck.style.display = "none";

            if (!document.getElementById(elemToCheckCreation)) {
                if (!rows[0]) {
                    setTimeout(waitUntilPageLoads, pageLoadRefreshTimeout);
                    return;
                }
                rows[0].appendChild(elemToCheck);
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
