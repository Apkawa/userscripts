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

import {matchLocation} from '../utils';

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
})();
