// ==UserScript==
// @name         Search image source
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Improve search image source on twitter, pixiv and danbooru via google
// @author       Apkawa
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/./google_image_source.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/./google_image_source.user.js
// @license      MIT
// ==/UserScript==
(function() {
    "use strict";
    function search(event) {
        console.log(event);
    }
    GM_registerMenuCommand("Image search on pixiv", search);
})();