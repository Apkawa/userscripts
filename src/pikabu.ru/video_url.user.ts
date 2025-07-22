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

import {matchLocation, waitElement} from '../utils';
import {humanFileSize} from '../utils/humanize_format';

(function () {
  'use strict';

  if (!matchLocation('^https://pikabu.ru/.*')) {
    return;
  }

  function addDownloadButtonsForVideo(el: HTMLElement) {
    if (el.getAttribute('linked')) {
      return;
    }
    const source = el.dataset.source?.replace(/\.\w{3,4}$/, '');
    el.setAttribute('linked', '1');
    if (!source?.match('pikabu.ru')) {
      return;
    }
    const name = source.split('/').pop();
    const container = document.createElement('div');
    container.setAttribute(
      'style',
      `display: flex; width: 100%; height: 30px; 
      align-items: center; justify-content: flex-start`,
    );
    let html = '';
    const extensions = ['mp4', 'av1', 'webm'];
    if (el.dataset.source?.endsWith('.gif')) {
      extensions.unshift('gif');
    }
    for (const ext of extensions) {
      let s = el.dataset?.[ext] || `${source}.${ext}`;
      if (ext == 'av1' && !s.endsWith('.mp4')) {
        s += '.mp4';
      }
      const size = Number.parseInt(el.dataset?.[`${ext}Size`] || '');
      let sizeDisplay = '';
      if (! Number.isFinite(size) || size <= 0) {
        // Обычно файла в этом случае нет
        continue
      }
      if (Number.isFinite(size) && size > 0) {
        sizeDisplay = humanFileSize(size, true);
      }
      html += `<a 
        href="${s}" 
        style="padding: 5px; 
        margin: 5px;
        border: gray 1px solid; border-radius: 3px; 
        height: 25px; line-height: 15px; vertical-align: middle"
        download="${name || 'download'}.${ext}"
        target="_blank"
        title="${sizeDisplay}"
        >${ext} ${sizeDisplay}</a>`;
    }
    container.innerHTML = html;
    el.parentNode && el.parentNode.insertBefore(container, el.nextSibling);
  }

  waitElement(
    (el) => {
      const _el = el;
      return Boolean(_el.querySelectorAll && _el.querySelectorAll('.player'));
    },
    () => {
      document.querySelectorAll &&
        document
          .querySelectorAll('.player')
          .forEach((el) => addDownloadButtonsForVideo(el as HTMLElement));
    },
  );
})();
