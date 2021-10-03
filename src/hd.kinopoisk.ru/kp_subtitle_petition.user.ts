// ==UserScript==
// @name         Kinopoisk subtitle petition
// @namespace    http://tampermonkey.net/
// @version      0.4
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

import {E, getElementByXpath, getElementsByXpath, parseSearch, waitElement} from "../utils"

const FORM_URL = "https://forms.yandex.ru/surveys/10022784.8ae29888f3224e212d4a904160b6baf0a05acd37/"

function radioByText(text: string) {
  let xpath = `//p[text() = '${text}']/../..`;
  const matchingElement = getElementByXpath(xpath)
  matchingElement?.click()
}

function selectByLabel(label: string, option: string) {
  let xpath = `//p[text() = '${label}']/ancestor::tbody//select`
  const select = getElementByXpath(xpath) as HTMLSelectElement
  let selected = getElementByXpath(`//option[@selected]`, select) as HTMLOptionElement
  selected.removeAttribute('selected')
  let opt = getElementByXpath(`//option[text() = '${option}']`, select) as HTMLOptionElement
  select.value = opt?.value
  opt.setAttribute('selected', '1')
  return select
}

function fillInputByLabel(label: string, text: string) {
  let xpath = `//p[text() = '${label}']/ancestor::tbody//input`
  const el = getElementByXpath(xpath) as HTMLInputElement
  el.value = text
  return el
}

function getUserName() {
  const el = getElementByXpath(`//span[@class='user__name']`)
  return el?.innerText
}

function normalizeKPLink (s: string): string {
  return s.replace(/www\./, '')
}

function hdAddRequest(sub: HTMLElement) {
  let filmContainer = getElementByXpath('ancestor::section', sub)
  if (!filmContainer) {
    return;
  }
  let subNames = [].slice.call(sub.getElementsByTagName('li')).map(el => (el as HTMLElement).innerText)
  if (sub.getAttribute('request-added')) {
    return
  }
  let audio = getElementByXpath(`//div[text() = 'Аудиодорожки']/../ul`)
  let audioNames = [].slice.call(audio?.getElementsByTagName('li')).map(el => (el as HTMLElement).innerText)

  function getInfo() {
    let link = (getElementByXpath(
      `//a[text() ='Подробнее на КиноПоиске']`, filmContainer as HTMLElement
    ) as HTMLLinkElement).href.toString();
    let type = getElementByXpath(`//button[text() = 'О сериале']`) ? 'series' : 'film'
    return {
      link: normalizeKPLink(link),
      type,
    }
  }

  if (!audioNames.includes("Английский")) {
    let info = {...getInfo(), mode: 'audio'}
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('li', {},
      E('a', {'href': formUrl, 'target': '_blank'},
        'Запросить оригинальную озвучку')
    )
    audio?.appendChild(li)
  }

  if (!subNames.includes("Русские")) {
    let info = getInfo()
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('li', {},
      E('a', {'href': formUrl, 'target': '_blank'},
        'Запросить русские сабы')
    )

    sub.appendChild(li)
  }
  sub.setAttribute('request-added', '1')
}

function kinopoiskAddRequest(sub: HTMLElement) {
  let filmContainer = getElementByXpath('ancestor::body', sub)
  if (!filmContainer) {
    return;
  }
  if (sub.getAttribute('request-added')) {
    return
  }
  const country = getElementByXpath(
    `//div[text() = 'Страна']/following-sibling::div`,
    filmContainer
  )?.innerText
  let audio = getElementByXpath(`//div[text() = 'Аудиодорожки']/following-sibling::div`, filmContainer)
  let audioNames = audio?.innerText.split(', ')
  let subNames = sub.innerText.split(', ')

  let info = {
    link: normalizeKPLink(window.location.href),
    type: window.location.href.match('https://(?:www.|)kinopoisk.ru/(series|film)/')?.[1] || ''
  }

  if (!audioNames?.includes("Английский") && country !== "Россия") {
    let formUrl = FORM_URL + '?' + new URLSearchParams({...info, mode: 'audio'}).toString()

    let li = E('a', {'href': formUrl, 'target': '_blank'},
      'Запросить оригинальную озвучку')

    audio?.appendChild(li)
  }

  if (!subNames.includes("Русские")) {
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('a', {'href': formUrl, 'target': '_blank'},
      'Запросить русские сабы')

    sub.appendChild(li)

  }
  sub.setAttribute('request-added', '1')
}

(function () {

  'use strict';
  if (window.location.hostname === 'forms.yandex.ru') {
    // AUTO fill form
    const params = parseSearch()
    if (params.type === 'film') {
      radioByText("Фильм")
    } else {
      radioByText("Сериал")
    }
    if (params.mode === 'audio') {
      radioByText("Аудиодорожку/озвучку")
      selectByLabel("Какую аудиодорожку добавить?", "Оригинальную")
    } else {
      radioByText("Субтитры")
      fillInputByLabel('Выберите субтитры:', params.lang || 'Русский')
    }

    fillInputByLabel('Ссылка на фильм/сериал на КиноПоиске', params.link || '')
    fillInputByLabel("Ваша почта", `${getUserName()}@yandex.ru`)
  }

  if (window.location.href.startsWith('https://hd.kinopoisk.ru/')) {
    let xpath = `//div[text() = 'Субтитры']/../ul`
    waitElement(el => Boolean(getElementByXpath(xpath, el)),
      () => {
        let subtitles = getElementsByXpath(xpath)
        for (let el of subtitles) {
          hdAddRequest(el)
        }
      })
  }
  if (window.location.href.match('https://(www.|)kinopoisk.ru/(series|film)/')) {
    let xpath = `//div[text() = 'Субтитры']/following-sibling::div`
    waitElement(el => Boolean(getElementByXpath(xpath, el)),
      () => {
        let subtitles = getElementsByXpath(xpath)
        for (let el of subtitles) {
          kinopoiskAddRequest(el)
        }
      })
  }
})();
