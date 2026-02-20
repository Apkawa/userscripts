// ==UserScript==
// @name         Pikabu download video helper
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Helpers for display direct url for video
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// ==/UserScript==
(() => {
    "use strict";
    function waitElement(match, callback, root = document.body) {
        const observer = new MutationObserver(mutations => {
            let matchFlag = false;
            mutations.forEach(mutation => {
                if (!mutation.addedNodes) return;
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    matchFlag = match(node);
                }
            });
            if (matchFlag) {
                _stop();
                callback();
                _start();
            }
        });
        let isStarted = false;
        function _start() {
            if (isStarted) return;
            observer.observe(root || document.body, {
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
    function isFunction(x) {
        return typeof x === "function";
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
    const entries = Object.entries;
    Object.values;
    (function() {
        "use strict";
        if (!matchLocation("^https://pikabu.ru/.*")) return;
        console.log("PIKABU Video url");
        const FLAG_ATTRIBUTE_NAME = "video_url_user";
        function extractSources(el) {
            const m = {};
            if (el.getAttribute("data-type") == "gifx") {
                const bg = el.querySelector('[class^="pkb-player-block__preview"]');
                if (bg) {
                    const url = Array.from(bg.getAttribute("style")?.matchAll(/url\((['"])?(.*?)\1\)/gi) || [])[0][2];
                    if (url) {
                        const source = url.replace(/_p\.\w{3,4}$/, "");
                        m["gif"] = `${source}.gif`;
                    }
                }
            } else {
                const sources = el.querySelectorAll("source");
                for (const s of sources) {
                    const url = s.getAttribute("src");
                    if (url) {
                        const parts = url?.split(/.(\w{3,4})$/);
                        if (parts?.length > 1) m[parts[1]] = url;
                    }
                }
            }
            return m;
        }
        function addDownloadButtonsForVideo(el) {
            if (el.getAttribute(FLAG_ATTRIBUTE_NAME)) return;
            const sources = entries(extractSources(el));
            if (!sources.length) return;
            const container = document.createElement("div");
            container.setAttribute("style", `display: flex; width: 100%; height: 25px; \n      align-items: center; justify-content: flex-start`);
            let html = "";
            for (const [ext, url] of sources) {
                const source = url.replace(/\.\w{3,4}$/, "");
                const name = source.split("/").pop();
                html += `<a \n        href='${url}' \n        style='padding: 5px; margin-right: 5px; \n        border: gray 1px solid; border-radius: 3px; height: 20px'\n        download='${name || "download"}.${ext}'\n        target='_blank'\n        >${ext}</a>`;
            }
            container.innerHTML = html;
            el.parentNode && el.parentNode.insertBefore(container, el.nextSibling);
            el.setAttribute(FLAG_ATTRIBUTE_NAME, "1");
        }
        waitElement(el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll('[data-role="player"] [class^="pkb-player-block__preview"]'));
        }, () => {
            document.querySelectorAll && document.querySelectorAll('[data-role="player"]').forEach(el => addDownloadButtonsForVideo(el));
        });
    })();
})();