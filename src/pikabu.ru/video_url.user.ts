// ==UserScript==
// @name         Pikabu download video helper
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Helpers for display direct url for video
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// ==/UserScript==

import {matchLocation, waitElement} from "../utils";

(function () {
  'use strict';

  if (!matchLocation("^https://pikabu.ru/.*")) {
    return
  }

  function addDownloadButtonsForVideo(el: HTMLElement) {
    if (el.getAttribute('linked')) {
      return
    }
    let source = el.dataset.source?.replace(/\.\w{3,4}$/, '')
    el.setAttribute('linked', '1')
    if (!source?.match('pikabu.ru')) {
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
    let extensions = ['mp4', 'webm']
    if (el.dataset.source?.endsWith('.gif')) {
      extensions.unshift('gif')
    }
    for (let ext of extensions) {
      let s = el.dataset?.[ext] || `${source}.${ext}`
      html += `<a 
        href="${s}" 
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
