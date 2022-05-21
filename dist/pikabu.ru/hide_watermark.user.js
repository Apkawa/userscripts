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
    })();
})();