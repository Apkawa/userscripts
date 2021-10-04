// ==UserScript==
// @name         Pikabu download video helper
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Helpers for display direct url for video
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// ==/UserScript==
(function() {
    "use strict";
    var __webpack_exports__ = {};
    function isFunction(x) {
        return typeof x === "function";
    }
    function getElementByXpath(xpath, root = document) {
        const e = document.evaluate(xpath, root, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        return e && e;
    }
    function getElementsByXpath(xpath, root = document) {
        const iterator = document.evaluate(xpath, root, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        const result = [];
        let el = iterator.iterateNext();
        while (el) {
            result.push(el);
            el = iterator.iterateNext();
        }
        return result;
    }
    function markElementHandled(wrapFn, attrName = "_handled") {
        return function(el) {
            if (el.getAttribute(attrName)) {
                return;
            }
            el.setAttribute(attrName, "1");
            wrapFn(el);
        };
    }
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
            if (isStarted) {
                return;
            }
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
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
    function E(tag, attributes = {}, ...children) {
        const element = document.createElement(tag);
        for (const [k, v] of Object.entries(attributes)) {
            element.setAttribute(k, v);
        }
        const fragment = document.createDocumentFragment();
        children.forEach((child => {
            if (typeof child === "string") {
                child = document.createTextNode(child);
            }
            fragment.appendChild(child);
        }));
        element.appendChild(fragment);
        return element;
    }
    function matchLocation(...patterns) {
        const s = document.location.href;
        for (const p of patterns) {
            if (isFunction(p) && p(s)) {
                return true;
            }
            if (RegExp(p).test(s)) {
                return true;
            }
        }
        return false;
    }
    function mapLocation(map) {
        const s = document.location.hostname + document.location.pathname;
        for (const [k, v] of Object.entries(map)) {
            if (RegExp(k).test(s)) {
                v();
            }
        }
    }
    function parseSearch() {
        return Object.fromEntries(new URLSearchParams(window.location.search).entries());
    }
    (function() {
        "use strict";
        if (!matchLocation("^https://pikabu.ru/.*")) {
            return;
        }
        function addDownloadButtonsForVideo(el) {
            var _a, _b, _c;
            if (el.getAttribute("linked")) {
                return;
            }
            const source = (_a = el.dataset.source) === null || _a === void 0 ? void 0 : _a.replace(/\.\w{3,4}$/, "");
            el.setAttribute("linked", "1");
            if (!(source === null || source === void 0 ? void 0 : source.match("pikabu.ru"))) {
                return;
            }
            const name = source.split("/").pop();
            const container = document.createElement("div");
            container.setAttribute("style", `display: flex; width: 100%; height: 25px; \n      align-items: center; justify-content: flex-start`);
            let html = "";
            const extensions = [ "mp4", "webm" ];
            if ((_b = el.dataset.source) === null || _b === void 0 ? void 0 : _b.endsWith(".gif")) {
                extensions.unshift("gif");
            }
            for (const ext of extensions) {
                const s = ((_c = el.dataset) === null || _c === void 0 ? void 0 : _c[ext]) || `${source}.${ext}`;
                html += `<a \n        href="${s}" \n        style="padding: 5px; margin-right: 5px; \n        border: gray 1px solid; border-radius: 3px; height: 20px"\n        download="${name || "download"}.${ext}"\n        target="_blank"\n        >${ext}</a>`;
            }
            container.innerHTML = html;
            el.parentNode && el.parentNode.insertBefore(container, el.nextSibling);
        }
        waitElement((el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll(".player"));
        }), (() => {
            document.querySelectorAll && document.querySelectorAll(".player").forEach((el => addDownloadButtonsForVideo(el)));
        }));
    })();
})();