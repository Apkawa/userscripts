// ==UserScript==
// @name         Pikabu download video helper
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Helpers for display direct url for video
// @author       Apkawa
// @match        https://pikabu.ru/*
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues/
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js
// ==/UserScript==
(()=>{"use strict";var e;e=e=>{let t=e;return Boolean(t.querySelectorAll&&t.querySelectorAll(".player"))},new MutationObserver((t=>{let r=!1;t.forEach((t=>{if(t.addedNodes)for(let l=0;l<t.addedNodes.length;l++){let n=t.addedNodes[l];r=e(n)}})),r&&document.querySelectorAll&&document.querySelectorAll(".player").forEach((e=>function(e){if(e.getAttribute("linked"))return;let t=(e.dataset.source||"").replace(/\.\w{3,4}$/,"");if(e.setAttribute("linked","1"),!t.match("pikabu.ru"))return;let r=t.split("/").pop(),l=document.createElement("div");l.setAttribute("style","display: flex; width: 100%; height: 25px; \n      align-items: center; justify-content: flex-start");let n="";for(let e of["gif","mp4","webm"])n+=`<a \n        href="${t}.${e}" \n        style="padding: 5px; margin-right: 5px; border: gray 1px solid; border-radius: 3px; height: 20px"\n        download="${r}.${e}"\n        target="_blank"\n        >${e}</a>`;l.innerHTML=n,e.parentNode&&e.parentNode.insertBefore(l,e.nextSibling)}(e)))})).observe(document.body,{childList:!0,subtree:!0,attributes:!1,characterData:!1})})();