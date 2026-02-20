// ==UserScript==
// @name         Search image source
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Improve search image source on twitter, pixiv and danbooru via google
// @author       Apkawa
// @match        *://*/*
// @grant        GM_registerMenuCommand
// ==/UserScript==

// site:danbooru.donmai.us/posts/
// site:twitter.com/*/status/
// site:pixiv.net/en/artworks/

function search(event: MouseEvent | KeyboardEvent) {
  console.log(event);
}

GM_registerMenuCommand('Image search on pixiv', search);
