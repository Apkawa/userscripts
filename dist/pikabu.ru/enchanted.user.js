// ==UserScript==
// @name         Bring Save Button Back
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Возвращает кнопку сохранения поста на pikabu.ru на её законное место.
// @author       Apkawa
// @match        https://pikabu.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pikabu.ru
// @grant        none
// @license      MIT
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/enchanted.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/enchanted.user.js
// ==/UserScript==
(function() {
    "use strict";
    function isFunction(x) {
        return "function" === typeof x;
    }
    function matchLocation(...patterns) {
        const s = document.location.href;
        for (const p of patterns) {
            if (isFunction(p) && p(s)) return true;
            if (RegExp(p).test(s)) return true;
        }
        return false;
    }
    function GM_addStyle(css) {
        const style = document.getElementById("GM_addStyleBy8626") || function() {
            const style = document.createElement("style");
            style.type = "text/css";
            style.id = "GM_addStyleBy8626";
            document.head.appendChild(style);
            return style;
        }();
        const sheet = style.sheet;
        null === sheet || void 0 === sheet ? void 0 : sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
    }
    Object.keys;
    Object.entries;
    var save_icon = "<svg class='svg-icon' style='fill: currentColor;' viewBox='0 0 1024 1024' version='1.1'\n     xmlns='http://www.w3.org/2000/svg'>\n    <path d='M730.584615 78.769231v267.815384c0 19.692308-15.753846 37.415385-37.415384 37.415385H273.723077c-19.692308 0-37.415385-15.753846-37.415385-37.415385V78.769231H157.538462C114.215385 78.769231 78.769231 114.215385 78.769231 157.538462v708.923076c0 43.323077 35.446154 78.769231 78.769231 78.769231h708.923076c43.323077 0 78.769231-35.446154 78.769231-78.769231V220.553846L803.446154 78.769231h-72.861539z m137.846154 750.276923c0 19.692308-15.753846 37.415385-37.415384 37.415384H194.953846c-19.692308 0-37.415385-15.753846-37.415384-37.415384V500.184615c0-19.692308 15.753846-37.415385 37.415384-37.415384h636.061539c19.692308 0 37.415385 15.753846 37.415384 37.415384v328.861539zM488.369231 267.815385c0 19.692308 15.753846 37.415385 37.415384 37.415384h90.584616c19.692308 0 37.415385-15.753846 37.415384-37.415384V78.769231h-163.446153l-1.969231 189.046154z'/>\n</svg>\n";
    (function() {
        "use strict";
        if (!matchLocation("^https://pikabu.ru/.*")) return;
        function addSaveButtons(footerNodes) {
            for (const storyFooter of footerNodes) {
                const storyCard = storyFooter.closest(".story");
                if (!storyCard) continue;
                const storyId = storyCard.dataset.storyId;
                const saveButton = document.createElement("div");
                saveButton.innerHTML = save_icon;
                saveButton.classList.add("story__save");
                if (storyCard.dataset.saved) saveButton.classList.add("story__save_active");
                saveButton.dataset.storyId = storyId;
                storyFooter.prepend(saveButton);
            }
        }
        const observerCallback = function(mutationsList) {
            for (const mutation of mutationsList) {
                if ("childList" !== mutation.type) continue;
                for (const node of mutation.addedNodes) {
                    if ("#text" === node.nodeName || "#comment" === node.nodeName) continue;
                    const storyFooters = node.getElementsByClassName("story__footer");
                    addSaveButtons(storyFooters);
                }
            }
        };
        GM_addStyle(".story__save > svg {color: var(--color-black-700); height: 20px; width: 20px;}");
        GM_addStyle(".story__save_active {background-color: var(--color-primary-700) !important;}");
        GM_addStyle(".story__save_active > svg {color: var(--color-bright-900);}");
        const storyFooters = document.getElementsByClassName("story__footer");
        addSaveButtons(storyFooters);
        const config = {
            childList: true,
            subtree: true
        };
        const observer = new MutationObserver(observerCallback);
        observer.observe(document.body, config);
    })();
})();