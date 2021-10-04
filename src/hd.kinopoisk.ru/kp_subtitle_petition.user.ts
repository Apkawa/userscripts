// ==UserScript==
// @name         Kinopoisk subtitle petition
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Helper for subtitle petition
// @author       Apkawa
// @license      MIT
// @match        https://forms.yandex.ru/surveys/10022784.8ae29888f3224e212d4a904160b6baf0a05acd37/*
// @match        https://hd.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @match        https://www.kinopoisk.ru/*
// @icon         https://www.google.com/s2/favicons?domain=kinopoisk.ru
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant        none
// ==/UserScript==

import {
  E,
  getElementByXpath,
  getElementsByXpath,
  mapLocation,
  markElementHandled,
  parseSearch,
  waitElement,
} from '../utils';

const FORM_URL =
  'https://forms.yandex.ru/surveys/10022784.8ae29888f3224e212d4a904160b6baf0a05acd37/';

function radioByText(text: string) {
  const xpath = `//p[text() = '${text}']/../..`;
  const matchingElement = getElementByXpath(xpath);
  matchingElement?.click();
}

function selectByLabel(label: string, option: string) {
  const xpath = `//p[text() = '${label}']/ancestor::tbody//select`;
  const select = getElementByXpath(xpath) as HTMLSelectElement;
  const selected = getElementByXpath(`//option[@selected]`, select) as HTMLOptionElement;
  selected.removeAttribute('selected');
  const opt = getElementByXpath(`//option[text() = '${option}']`, select) as HTMLOptionElement;
  select.value = opt?.value;
  opt.setAttribute('selected', '1');
  return select;
}

function fillInputByLabel(label: string, text: string) {
  const xpath = `//p[text() = '${label}']/ancestor::tbody//input`;
  const el = getElementByXpath(xpath) as HTMLInputElement;
  el.value = text;
  return el;
}

function getUserName(): string {
  const el = getElementByXpath(`//span[@class='user__name']`);
  return el?.innerText || '';
}

function normalizeKPLink(s: string): string {
  return s.replace(/www\./, '');
}

function renderHdKinopoiskRequestLink(sub: HTMLElement) {
  const filmContainer = getElementByXpath('ancestor::section', sub);
  if (!filmContainer) {
    return;
  }
  const subNames = [].slice
    .call(sub.getElementsByTagName('li'))
    .map((el) => (el as HTMLElement).innerText);
  const audio = getElementByXpath(`//div[text() = 'Аудиодорожки']/../ul`);
  const audioNames = [].slice
    .call(audio?.getElementsByTagName('li'))
    .map((el) => (el as HTMLElement).innerText);

  function getInfo() {
    const link = (
      getElementByXpath(
        `//a[text() ='Подробнее на КиноПоиске']`,
        filmContainer as HTMLElement,
      ) as HTMLLinkElement
    ).href.toString();
    const type = getElementByXpath(`//button[text() = 'О сериале']`) ? 'series' : 'film';
    return {
      link: normalizeKPLink(link),
      type,
    };
  }

  if (!audioNames.includes('Английский')) {
    const info = {...getInfo(), mode: 'audio'};
    const formUrl = FORM_URL + '?' + new URLSearchParams(info).toString();

    const li = E(
      'li',
      {},
      E('a', {href: formUrl, target: '_blank'}, 'Запросить оригинальную озвучку'),
    );
    audio?.appendChild(li);
  }

  if (!subNames.includes('Русские')) {
    const info = getInfo();
    const formUrl = FORM_URL + '?' + new URLSearchParams(info).toString();

    const li = E('li', {}, E('a', {href: formUrl, target: '_blank'}, 'Запросить русские сабы'));

    sub.appendChild(li);
  }
}

function renderKinopoiskRequestLink(sub: HTMLElement) {
  const filmContainer = getElementByXpath('ancestor::body', sub);
  if (!filmContainer) {
    return;
  }
  const country = getElementByXpath(
    `//div[text() = 'Страна']/following-sibling::div`,
    filmContainer,
  )?.innerText;
  const audio = getElementByXpath(
    `//div[text() = 'Аудиодорожки']/following-sibling::div`,
    filmContainer,
  );
  const audioNames = audio?.innerText.split(', ');
  const subNames = sub.innerText.split(', ');

  const info = {
    link: normalizeKPLink(window.location.href),
    type: /https:\/\/(?:www.|)kinopoisk.ru\/(series|film)\//.exec(window.location.href)?.[1] || '',
  };

  if (!audioNames?.includes('Английский') && country !== 'Россия') {
    const formUrl = FORM_URL + '?' + new URLSearchParams({...info, mode: 'audio'}).toString();

    const li = E('a', {href: formUrl, target: '_blank'}, 'Запросить оригинальную озвучку');

    audio?.appendChild(li);
  }

  if (!subNames.includes('Русские')) {
    const formUrl = FORM_URL + '?' + new URLSearchParams(info).toString();

    const li = E('a', {href: formUrl, target: '_blank'}, 'Запросить русские сабы');

    sub.appendChild(li);
  }
}

(function () {
  mapLocation({
    '^forms.yandex.ru/': () => {
      const params = parseSearch();
      if (params.type === 'film') {
        radioByText('Фильм');
      } else {
        radioByText('Сериал');
      }
      if (params.mode === 'audio') {
        radioByText('Аудиодорожку/озвучку');
        selectByLabel('Какую аудиодорожку добавить?', 'Оригинальную');
      } else {
        radioByText('Субтитры');
        const el = fillInputByLabel('Выберите субтитры:', params.lang || 'Русский');
        const hiddenEl = getElementByXpath(`ancestor::table//input[@type='hidden']`, el);
        hiddenEl?.setAttribute('value', '30010730');
      }
      fillInputByLabel('Ссылка на фильм/сериал на КиноПоиске', params.link || '');
      fillInputByLabel('Ваша почта', `${getUserName()}@yandex.ru`);
    },
    '^hd.kinopoisk.ru/': () => {
      const xpath = `//div[text() = 'Субтитры']/../ul`;
      waitElement(
        (el) => Boolean(getElementByXpath(xpath, el)),
        () => {
          const subtitles = getElementsByXpath(xpath);
          for (const el of subtitles) {
            markElementHandled(renderHdKinopoiskRequestLink)(el);
          }
        },
      );
    },
    '(www.|)kinopoisk.ru/(series|film)': () => {
      const xpath = `//div[text() = 'Субтитры']/following-sibling::div`;
      waitElement(
        (el) => Boolean(getElementByXpath(xpath, el)),
        () => {
          const subtitles = getElementsByXpath(xpath);
          for (const el of subtitles) {
            markElementHandled(renderKinopoiskRequestLink)(el);
          }
        },
      );
    },
  });
})();
