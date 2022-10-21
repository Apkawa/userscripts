// ==UserScript==
// @name         Ozon price calculator
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Считаем стоимость за штуку/за кг
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=ozon.ru
// @match        https://ozon.ru/*
// @match        https://www.ozon.ru/*
// ==/UserScript==

import {matchLocation, waitElement} from '../utils';
import {parseTitle, ParseTitleResult} from './libs/parseTitle';

function getPriceFromElement(el: HTMLElement | null): number | null {
  const priceText = el?.innerText?.split('₽')[0]?.trim();
  if (priceText) {
    return parseInt(priceText.replace('&thinsp;', '').replace(' ', ''));
  }
  return null;
}

function getPrice(sel: string): number | null {
  const priceEl: HTMLElement | null = document.querySelector(sel);
  return getPriceFromElement(priceEl);
}

function round(n: number, parts = 2) {
  const i = Math.pow(10, parts);
  return Math.round(n * i) / i;
}

function renderBestPrice(price: number | null, titleInfo: ParseTitleResult): HTMLElement {
  const wrapEl = document.createElement('div');
  wrapEl.className = 'GM-best-price';
  if (!price) {
    return wrapEl;
  }
  if (titleInfo.weight) {
    const weightEl = document.createElement('p');
    // price -> weight
    //  x    -> 1000г
    // TODO unit size
    weightEl.innerText = `${round(price / titleInfo.weight)} ₽/${titleInfo.weight_unit || '?'}`;
    wrapEl.appendChild(weightEl);
  }
  if (titleInfo.quantity && titleInfo.quantity !== 1) {
    const qtyEl = document.createElement('p');
    qtyEl.innerText = `${round(price / titleInfo.quantity)} ₽/шт`;
    wrapEl.appendChild(qtyEl);
  }
  return wrapEl;
}

function initProductPage() {
  const init = () => {
    const title = document.querySelector("[data-widget='webProductHeading']")?.textContent;
    if (!title) {
      return;
    }
    const price = getPrice("[data-widget='webPrice']");
    const greenPrice = getPrice("[data-widget='webOzonAccountPrice']");
    const parsedTitle = parseTitle(title);

    if (greenPrice) {
      document
        .querySelector("[data-widget='webOzonAccountPrice']")
        ?.parentElement?.appendChild(renderBestPrice(greenPrice, parsedTitle));
    } else {
      document
        .querySelector("[data-widget='webPrice']")
        ?.appendChild(renderBestPrice(price, parsedTitle));
    }
  };
  let run = true;
  // Ждем когда прогрузится js
  const stop = waitElement(
    (el) => {
      const _el = el;
      return Boolean(
        _el.querySelectorAll && _el.querySelectorAll("[data-widget='webCharacteristics']"),
      );
    },
    () => {
      const allowRun = Boolean(document.querySelector("[data-widget='webOzonAccountPrice']"));
      if (run && allowRun) {
        stop();
        run = false;
        init();
      }
    },
  );
}

function initCatalog() {
  const init = () => {
    for (const cardEl of document.querySelectorAll('.widget-search-result-container > div > div')) {
      const wrapEl = cardEl.querySelector(':scope > div');
      if (wrapEl && !wrapEl.querySelector('.GM-best-price')) {
        const price = getPriceFromElement(wrapEl.querySelector('div'));
        const title = wrapEl.querySelector('a')?.textContent;
        if (!title) return;

        console.log(title, price);

        const parsedTitle = parseTitle(title);

        const a = wrapEl.querySelector('a');
        a?.parentElement?.insertBefore(renderBestPrice(price, parsedTitle), a);
      }
    }
  };
  const stop = waitElement(
    (el) => {
      const _el = el;
      return Boolean(_el.querySelectorAll && _el.querySelectorAll("[data-widget='footer']"));
    },
    () => {
      const allowRun = Boolean(document.querySelector('.tile-hover-target'));
      if (allowRun) {
        stop();
        init();
      }
    },
  );
}

(function () {
  'use strict';

  console.log('OZON>RU');

  if (!matchLocation('^https://(www.|)ozon.ru/.*')) {
    return;
  }
  if (matchLocation('^https://(www.|)ozon.ru/product/.*')) {
    initProductPage();
  }

  if (matchLocation('^https://(www.|)ozon.ru/(category|highlight)/.*')) {
    initCatalog();
  }
})();
