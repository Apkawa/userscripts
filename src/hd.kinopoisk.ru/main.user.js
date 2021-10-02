// ==UserScript==
// @name         Kinopoisk subtitle petition
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Helper for add subtitle petition
// @author       Apkawa
// @match        https://forms.yandex.ru/surveys/10022784.8ae29888f3224e212d4a904160b6baf0a05acd37/*
// @match        https://hd.kinopoisk.ru/*
// @match        https://kinopoisk.ru/*
// @match        https://www.kinopoisk.ru/*
// @icon         https://www.google.com/s2/favicons?domain=kinopoisk.ru
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues/
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/hd.kinopoisk.ru/main.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/hd.kinopoisk.ru/main.user.js
// @grant        none
// ==/UserScript==

const FORM_URL = "https://forms.yandex.ru/surveys/10022784.8ae29888f3224e212d4a904160b6baf0a05acd37/"

function getElementByXpath(xpath, root = document) {
  return document.evaluate(
    xpath, root,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null).singleNodeValue;
}

function getElementsByXpath(xpath, root = document) {
  const iterator = document.evaluate(
    xpath, root,
    null,
    XPathResult.ORDERED_NODE_ITERATOR_TYPE,
    null);
  let result = []
  let el = iterator.iterateNext();
  while (el) {
    result.push(el)
    el = iterator.iterateNext();
  }
  return result
}

function radioByText(text) {
  let xpath = `//p[text() = '${text}']/../..`;
  const matchingElement = getElementByXpath(xpath)
  matchingElement.click()
}

function selectByLabel(label, option) {
  let xpath = `//p[text() = '${label}']/ancestor::tbody//select`
  const select = getElementByXpath(xpath)
  let selected = getElementByXpath(`//option[@selected]`, select)
  selected.removeAttribute('selected')
  let opt = getElementByXpath(`//option[text() = '${option}']`, select)
  select.value = opt.value
  opt.setAttribute('selected', true)
  return select
}

function fillInputByLabel(label, text) {
  let xpath = `//p[text() = '${label}']/ancestor::tbody//input`
  const el = getElementByXpath(xpath)
  el.value = text
  return el
}

function getUserName() {
  const el = getElementByXpath(`//span[@class='user__name']`)
  return el.innerText
}

function parseSearch() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries())
}


function waitElement(match, callback) {
  let observer = new MutationObserver((mutations) => {
    let matchFlag = false
    mutations.forEach((mutation) => {
      if (!mutation.addedNodes) return
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        // do things to your newly added nodes here
        let node = mutation.addedNodes[i]
        matchFlag = match(node)
      }
    })
    if (matchFlag) {
      callback()
    }
  })

  observer.observe(document.body, {
    childList: true
    , subtree: true
    , attributes: false
    , characterData: false
  })

  return () => {
    // stop watching using:
    observer.disconnect()
  }
}

function E(tag, attributes = {}, ...children) {
  const element = document.createElement(tag)
  for (const attribute in attributes) {
    if (attributes.hasOwnProperty(attribute)) {
      element.setAttribute(attribute, attributes[attribute])
    }
  }
  const fragment = document.createDocumentFragment()
  children.forEach((child) => {
    if (typeof child === 'string') {
      child = document.createTextNode(child)
    }
    fragment.appendChild(child)
  })
  element.appendChild(fragment)
  return element
}

function hdAddRequest(sub) {
  let filmContainer = getElementByXpath('ancestor::section', sub)

  let subNames = [].slice.call(sub.getElementsByTagName('li')).map(el => el.innerText)
  if (sub.getAttribute('request-added')) {
    return
  }
  let audio = getElementByXpath(`//div[text() = 'Аудиодорожки']/../ul`)
  let audioNames = [].slice.call(audio.getElementsByTagName('li')).map(el => el.innerText)

  function getInfo() {
    let link = getElementByXpath(`//a[text() ='Подробнее на КиноПоиске']/@href`, filmContainer).value;
    let type = getElementByXpath(`//button[text() = 'О сериале']`) ? 'series' : 'film'
    return {
      link,
      type,
    }
  }

  if (!audioNames.includes("Английский")) {
    let info = { ...getInfo(), mode: 'audio' }
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('li', {},
      E('a', { 'href': formUrl, 'target': '_blank' },
        'Запросить оригинальную озвучку')
    )
    audio.appendChild(li)
  }

  if (!subNames.includes("Русские")) {
    let info = getInfo()
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('li', {},
      E('a', { 'href': formUrl, 'target': '_blank' },
        'Запросить русские сабы')
    )

    sub.appendChild(li)
  }
  sub.setAttribute('request-added', 1)
}

function kinopoiskAddRequest(sub) {
  let filmContainer = getElementByXpath('ancestor::body', sub)
  if (sub.getAttribute('request-added')) {
    return
  }
  const country = getElementByXpath(`//div[text() = 'Страна']/following-sibling::div`, filmContainer).innerText
  let audio = getElementByXpath(`//div[text() = 'Аудиодорожки']/following-sibling::div`, filmContainer)
  let audioNames = audio.innerText.split(', ')
  let subNames = sub.innerText.split(', ')

  let info = {
    link: window.location.href,
    type: window.location.href.match('https://(?:www.|)kinopoisk.ru/(series|film)/')[1]
  }

  if (!audioNames.includes("Английский") && country !== "Россия") {
    let formUrl = FORM_URL + '?' + new URLSearchParams({ ...info, mode: 'audio' }).toString()

    let li = E('a', { 'href': formUrl, 'target': '_blank' },
      'Запросить оригинальную озвучку')

    audio.appendChild(li)
  }

  if (!subNames.includes("Русские")) {
    let formUrl = FORM_URL + '?' + new URLSearchParams(info).toString()

    let li = E('a', { 'href': formUrl, 'target': '_blank' },
      'Запросить русские сабы')

    sub.appendChild(li)

  }
  sub.setAttribute('request-added', 1)
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
    waitElement(el => getElementByXpath(xpath, el),
      () => {
        let subtitles = getElementsByXpath(xpath)
        for (let el of subtitles) {
          hdAddRequest(el)
        }
      })
  }
  if (window.location.href.match('https://(www.|)kinopoisk.ru/(series|film)/')) {
    let xpath = `//div[text() = 'Субтитры']/following-sibling::div`
    waitElement(el => getElementByXpath(xpath, el),
      () => {
        let subtitles = getElementsByXpath(xpath)
        for (let el of subtitles) {
          kinopoiskAddRequest(el)
        }
      })
  }
})();
