// ==UserScript==
// @name         Ozon best price helper
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Считаем стоимость за штуку/за кг/за л
// @author       Apkawa
// @license      MIT
// @icon         https://www.google.com/s2/favicons?domain=ozon.ru
// @match        https://ozon.ru/*
// @match        https://www.ozon.ru/*
// ==/UserScript==

import {entries, getElementByXpath, matchLocation, waitCompletePage} from '../utils';
import {ParseTitlePriceResult, parseTitleWithPrice} from './best_price_calculator/parseTitle';
import {initReorderCatalog} from './best_price_calculator/bestPriceReorder';

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

function renderBestPrice(titleInfo: ParseTitlePriceResult | null): HTMLElement {
  const wrapEl = document.createElement('div');
  wrapEl.className = 'GM-best-price';
  if (!titleInfo) {
    return wrapEl;
  }
  if (titleInfo.weight_price_display) {
    const weightEl = document.createElement('p');
    // price -> weight
    //  x    -> 1000г
    // TODO unit size
    weightEl.innerText = titleInfo.weight_price_display;
    wrapEl.appendChild(weightEl);
  }
  if (titleInfo.quantity_price_display) {
    const qtyEl = document.createElement('p');
    qtyEl.innerText = titleInfo.quantity_price_display;
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
    // Try green price first
    let price = getPrice("[data-widget='webOzonAccountPrice']");
    if (!price) {
      price = getPrice("[data-widget='webPrice']");
    }
    if (price) {
      const parsedTitle = parseTitleWithPrice(title, price);
      document.querySelector("[data-widget='webPrice']")?.appendChild(renderBestPrice(parsedTitle));
    }
  };
  waitCompletePage(() => {
    init();
  });
}

function processProductCard(cardEl: HTMLElement): void {
  const wrapEl = getElementByXpath('a/following-sibling::div[1]', cardEl);

  if (!wrapEl || wrapEl?.querySelector('.GM-best-price')) {
    return;
  }

  const price = getPriceFromElement(wrapEl.querySelector('div'));
  const titleEl = wrapEl.querySelector('a span.tsBodyL');
  const title = titleEl?.textContent;
  if (!title || !price) {
    return;
  }
  console.log(title, price);
  const parsedTitle = parseTitleWithPrice(title, price);
  titleEl?.parentElement?.insertBefore(renderBestPrice(parsedTitle), titleEl);
  if (parsedTitle) {
    const ds = cardEl.dataset;
    cardEl.classList.add('GM-best-price-wrap');
    for (const [k, v] of entries(parsedTitle)) {
      ds[k] = (v || '').toString();
    }
  }
}

function initCatalog() {
  const init = () => {
    const cardList = document.querySelectorAll(
      '.widget-search-result-container > div > div' +
        ",[data-widget='skuLine'] > div:nth-child(2) > div" +
        ",[data-widget='skuLineLR'] > div:nth-child(2) > div",
    );
    for (const cardEl of cardList) {
      processProductCard(cardEl as HTMLElement);
    }

    const catalogEl = document.querySelector('.widget-search-result-container');
    if (catalogEl) {
      initReorderCatalog(catalogEl as HTMLElement);
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
