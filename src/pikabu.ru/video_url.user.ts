// ==UserScript==
// @name         Pikabu download video helper
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Helpers for display direct url for video
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// ==/UserScript==

import {entries, matchLocation, waitElement} from '../utils';

(function () {
  'use strict';

  if (!matchLocation('^https://pikabu.ru/.*')) {
    return;
  }

  console.log('PIKABU Video url');

  const FLAG_ATTRIBUTE_NAME = 'video_url_user';

  type SourcesMap = {[ext: string]: string};

  function extractSources(el: HTMLElement): SourcesMap {
    const m: SourcesMap = {};
    if (el.getAttribute('data-type') == 'gifx') {
      const bg = el.querySelector<HTMLElement>('[class^="pkb-player-block__preview"]');
      if (bg) {
        const url = Array.from(
          bg.getAttribute('style')?.matchAll(/url\((['"])?(.*?)\1\)/gi) || [],
        )[0][2];
        if (url) {
          const source = url.replace(/_p\.\w{3,4}$/, '');
          m['gif'] = `${source}.gif`;
        }
      }
    } else {
      const sources = el.querySelectorAll('source');
      for (const s of sources) {
        const url = s.getAttribute('src');
        if (url) {
          const parts = url?.split(/.(\w{3,4})$/);
          if (parts?.length > 1) {
            m[parts[1]] = url;
          }
        }
      }
    }
    return m;
  }

  function addDownloadButtonsForVideo(el: HTMLElement) {
    if (el.getAttribute(FLAG_ATTRIBUTE_NAME)) {
      return;
    }
    const sources = entries(extractSources(el));
    if (!sources.length) {
      return;
    }
    const container = document.createElement('div');
    container.setAttribute(
      'style',
      `display: flex; width: 100%; height: 25px; 
      align-items: center; justify-content: flex-start`,
    );
    let html = '';
    for (const [ext, url] of sources) {
      const source = url.replace(/\.\w{3,4}$/, '');
      const name = source.split('/').pop();
      html += `<a 
        href='${url}' 
        style='padding: 5px; margin-right: 5px; 
        border: gray 1px solid; border-radius: 3px; height: 20px'
        download='${name || 'download'}.${ext}'
        target='_blank'
        >${ext}</a>`;
    }
    container.innerHTML = html;
    el.parentNode && el.parentNode.insertBefore(container, el.nextSibling);
    el.setAttribute(FLAG_ATTRIBUTE_NAME, '1');
  }

  waitElement(
    (el) => {
      const _el = el;
      return Boolean(
        _el.querySelectorAll &&
          _el.querySelectorAll('[data-role="player"] [class^="pkb-player-block__preview"]'),
      );
    },
    () => {
      document.querySelectorAll &&
        document
          .querySelectorAll('[data-role="player"]')
          .forEach((el) => addDownloadButtonsForVideo(el as HTMLElement));
    },
  );
})();
