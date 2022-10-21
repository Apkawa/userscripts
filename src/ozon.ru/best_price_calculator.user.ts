// ==UserScript==
// @name         Ozon best price helper
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Считаем стоимость за штуку/за кг/за л
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=ozon.ru
// @match        https://ozon.ru/*
// @match        https://www.ozon.ru/*
// ==/UserScript==

import {getElementByXpath, matchLocation, waitCompletePage} from '../utils';
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
  if (wrapEl.childNodes.length) {
    wrapEl.style.border = '1px solid red';
    wrapEl.style.padding = '5px';
    wrapEl.style.margin = '5px';

    wrapEl.style.width = 'fit-content';
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
  waitCompletePage(() => {
    init();
  });
}

function initCatalog() {
  const init = () => {
    const cardList = document.querySelectorAll(
      '.widget-search-result-container > div > div' +
        ",[data-widget='skuLine'] > div:nth-child(2) > div" +
        ",[data-widget='skuLineLR'] > div:nth-child(2) > div",
    );
    for (const cardEl of cardList) {
      const wrapEl = getElementByXpath('a/following-sibling::div[1]', cardEl);
      if (wrapEl && !wrapEl?.querySelector('.GM-best-price')) {
        const price = getPriceFromElement(wrapEl.querySelector('div'));
        const titleEl = wrapEl.querySelector('a span.tsBodyL');
        const title = titleEl?.textContent;
        if (!title) return;

        console.log(title, price);

        const parsedTitle = parseTitle(title);

        titleEl?.parentElement?.insertBefore(renderBestPrice(price, parsedTitle), titleEl);
      }
    }
  };
  waitCompletePage(() => {
    init();
  });
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

  if (matchLocation('^https://(www.|)ozon.ru/(category|highlight|search)/.*')) {
    initCatalog();
  }
})();
