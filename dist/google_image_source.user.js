// ==UserScript==
// @name         Search image source
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Improve search image source on twitter, pixiv and danbooru via google
// @author       Apkawa
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/./google_image_source.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/./google_image_source.user.js
// @license      MIT
// ==/UserScript==
(() => {
    "use strict";
    function search(event) {
        console.log(event);
    }
    GM_registerMenuCommand("Image search on pixiv", search);
})();