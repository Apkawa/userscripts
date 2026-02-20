// ==UserScript==
// @name         Enhanced pikabu
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Улучшения пикабу. Возвращает кнопку Save обратно, перенос ответа на пост вверх.
// @author       NosefU
// @match        https://pikabu.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pikabu.ru
// @grant        none
// @license MIT
// ==/UserScript==
// From https://pikabu.ru/story/vernul_knopku_sokhraneniya_posta_9549476

import {GM_addStyle, matchLocation, waitCompletePage} from '../utils';

import saveButtonIcon from '!!raw-loader!./assets/save-icon.svg';
import {E} from '../utils/dom';

function fixSaveButton(): void {
  function addSaveButtons(footerNodes: HTMLCollectionOf<Element>) {
    for (const storyFooter of footerNodes) {
      const storyCard: HTMLElement | null = storyFooter.closest('.story');
      if (!storyCard) {
        continue;
      }
      const storyId = storyCard.dataset.storyId;
      const saveButton = document.createElement('div');
      saveButton.innerHTML = saveButtonIcon;
      saveButton.classList.add('story__save');
      if (storyCard.dataset.saved) saveButton.classList.add('story__save_active');
      saveButton.dataset.storyId = storyId;
      storyFooter.prepend(saveButton);
    }
  }

  // Коллбэк при срабатывании мутации
  const observerCallback = function (mutationsList: MutationRecord[]) {
    for (const mutation of mutationsList) {
      if (mutation.type !== 'childList') {
        continue; // проверяем, что это изменение структуры страницы
      }
      for (const node of mutation.addedNodes) {
        // сначала проходим по добавленным нодам
        if (node.nodeName === '#text' || node.nodeName === '#comment') {
          continue;
        } // отсекаем текст

        const storyFooters = (node as HTMLElement).getElementsByClassName('story__footer');
        addSaveButtons(storyFooters);
      }
    }
  };

  GM_addStyle('.story__save > svg {color: var(--color-black-700); height: 20px; width: 20px;}');
  GM_addStyle('.story__save_active {background-color: var(--color-primary-700) !important;}');
  GM_addStyle('.story__save_active > svg {color: var(--color-bright-900);}');

  const storyFooters = document.getElementsByClassName('story__footer');
  addSaveButtons(storyFooters);

  // и вешаем обсервер для тех, у кого бесконечная лента
  const config = {childList: true, subtree: true};
  const observer = new MutationObserver(observerCallback);
  observer.observe(document.body, config);
}

function fixReplyComment(): void {
  waitCompletePage(() => {
    const replyWrapEl = document.querySelector<HTMLElement>('div.comment-reply')?.parentElement;
    const toEl = document.querySelector<HTMLElement>('.story-comments');

    if (replyWrapEl && toEl) {
      toEl.before(replyWrapEl);
      toEl.after(
        E(
          'a',
          {href: '#reply-comment', class: 'button button_success button_add button_width_100'},
          E('span', {}, 'Ответить'),
        ),
      );
      replyWrapEl.setAttribute('id', 'reply-comment');
    }
  });
}

(function () {
  'use strict';
  const prefix = '^https://pikabu.ru';
  if (!matchLocation(prefix + '/.*')) {
    return;
  }

  if (matchLocation(prefix + '/story/.*')) {
    fixReplyComment();
  }

  fixSaveButton();
})();
