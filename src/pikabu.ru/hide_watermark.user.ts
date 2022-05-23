// ==UserScript==
// @name         Pikabu remove watermark
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Helpers for remove watermark (pikabu.ru)
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=pikabu.ru
// @match        https://pikabu.ru/*
// ==/UserScript==

import {matchLocation, waitElement} from '../utils';

(function () {
  'use strict';

  if (!matchLocation('^https://pikabu.ru/.*')) {
    return;
  }

  function isImage(event: MouseEvent) {
    if (!event.target) return false;

    const target = event.target as HTMLElement;
    return target.querySelector('.image-loaded') || target.classList.contains('image-loaded');
  }

  window.addEventListener(
    'contextmenu',
    function (event) {
      if (isImage(event)) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    'mouseenter',
    function (event) {
      if (isImage(event)) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  // Alternative - ublock
  // pikabu.ru##img[data-watermarked='1']
  waitElement(
    (el) => {
      const _el = el;
      return Boolean(_el.querySelectorAll && _el.querySelectorAll("img[data-watermarked='1']"));
    },
    () => {
      const elList = document.querySelectorAll("img[data-watermarked='1']");

      for (const el of elList) {
        el.remove();
      }
    },
  );
})();
