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

import {waitElement} from "../utils";

(function () {
  'use strict';

  function addDownloadButtonsForVideo(el: HTMLElement) {
    if (el.getAttribute('linked')) {
      return
    }
    let source = (el.dataset.source || '').replace(/\.\w{3,4}$/, '')
    el.setAttribute('linked', '1')
    if (!source.match('pikabu.ru')) {
      return
    }
    let name = source.split('/').pop()
    let container = document.createElement('div')
    container.setAttribute(
      'style',
      `display: flex; width: 100%; height: 25px; 
      align-items: center; justify-content: flex-start`
    )
    let html = ''
    for (let ext of ['gif', 'mp4', 'webm']) {
      html += `<a 
        href="${source}.${ext}" 
        style="padding: 5px; margin-right: 5px; border: gray 1px solid; border-radius: 3px; height: 20px"
        download="${name}.${ext}"
        target="_blank"
        >${ext}</a>`
    }
    container.innerHTML = html
    el.parentNode && el.parentNode.insertBefore(container, el.nextSibling)
  }

  waitElement(el => {
      let _el = el as HTMLElement
      return Boolean(_el.querySelectorAll && _el.querySelectorAll('.player'))
    },
    () => {
      document.querySelectorAll && document.querySelectorAll('.player')
        .forEach(el => addDownloadButtonsForVideo(el as HTMLElement))
    })
})();
