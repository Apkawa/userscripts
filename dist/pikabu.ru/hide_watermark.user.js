// ==UserScript==
// @name         Pikabu remove watermark
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Helpers for remove watermark (pikabu.ru)
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/hide_watermark.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/hide_watermark.user.js
// ==/UserScript==
(function() {
    "use strict";
    function waitElement(match, callback) {
        const observer = new MutationObserver((mutations => {
            let matchFlag = false;
            mutations.forEach((mutation => {
                if (!mutation.addedNodes) return;
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    matchFlag = match(node);
                }
            }));
            if (matchFlag) {
                _stop();
                callback();
                _start();
            }
        }));
        let isStarted = false;
        function _start() {
            if (isStarted) return;
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: false
            });
            isStarted = true;
        }
        function _stop() {
            observer.disconnect();
            isStarted = false;
        }
        _start();
        return () => {
            _stop();
        };
    }
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
    Object.keys;
    Object.entries;
    (function() {
        "use strict";
        if (!matchLocation("^https://pikabu.ru/.*")) return;
        function isImage(event) {
            if (!event.target) return false;
            const target = event.target;
            return target.querySelector(".image-loaded") || target.classList.contains("image-loaded");
        }
        window.addEventListener("contextmenu", (function(event) {
            if (isImage(event)) event.stopImmediatePropagation();
        }), true);
        window.addEventListener("mouseenter", (function(event) {
            if (isImage(event)) event.stopImmediatePropagation();
        }), true);
        waitElement((el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll("img[data-watermarked='1']"));
        }), (() => {
            const elList = document.querySelectorAll("img[data-watermarked='1']");
            for (const el of elList) el.remove();
        }));
    })();
})();