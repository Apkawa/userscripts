// ==UserScript==
// @name         Copy all tags for SD
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Helper for subtitle petition
// @author       Apkawa
// @license      MIT
// @match        https://danbooru.donmai.us/*
// @match        https://gelbooru.com/*
// @match        https://e621.net/posts*
// @icon         https://www.google.com/s2/favicons?domain=kinopoisk.ru
// @require      https://greasemonkey.github.io/gm4-polyfill/gm4-polyfill.js
// @grant        GM_setClipboard
// @grant GM_setClipboard
// @grant GM.setClipboard

// ==/UserScript==

import {entries, mapLocation, parseSearch} from '../utils';
import {createElementFromHTML} from '../utils/dom';
import {capitalize} from '../utils/string';
import {SectionTagList, TagList} from './types';
import {e621GetSectionTagList} from './e621_net';

const EXCLUDED_TAGS: string[] = [
  '.*censor.*',
  'commentary_request',
  'translation_request',
  'commentary',
  'absurdres',
  'lowres',
  'highres',
  '(hi|low|absurd|superabsurd)_res',
  'thumbnail',
  'wallpaper',
  'high_framerate',
  'incredibly_absurdres',
  'huge_filesize',
  'animated',
];

const EXCLUDED_TAGS_RE = RegExp(`(:?${EXCLUDED_TAGS.join('|')})`);

function escapePrompt(prompt: string): string {
  // Escape brackets
  // eslint-disable-next-line no-useless-escape
  return prompt.replaceAll(/[\(\)\[\]\{\}]/g, '\\$&');
}

function filterTags(tags: TagList) {
  return tags.filter((t) => !EXCLUDED_TAGS_RE.test(t));
}

function filterSections(section: SectionTagList): SectionTagList {
  const excludedSections = ['Meta', 'Metadata'];
  if (section['Copyright']?.[0] == 'original') {
    excludedSections.push('Copyright');
  }
  for (const n of excludedSections) {
    delete section[n];
  }
  return section;
}

function renderClipboardButton(
  root_el: Element,
  dataText: string,
  button_text: string,
  attr_name = 'data-sd-tags',
) {
  const button_el = createElementFromHTML(
    `<button ${attr_name}='${dataText}'>
    ${button_text}</button>`,
  );
  button_el.addEventListener('click', (event) => {
    const _this = event.currentTarget as HTMLElement;
    const t = _this.getAttribute(attr_name);
    t && void navigator.clipboard.writeText(t);
    return false;
  });
  root_el?.appendChild(button_el);
}

function gelbooruGetSectionTagList(): SectionTagList {
  const result: SectionTagList = {};
  const tagList = document.querySelectorAll('ul.tag-list li[class^="tag-type"]');
  for (const tagEl of tagList) {
    const sectionName = capitalize(tagEl.className.substr('tag-type-'.length).trim());
    if (!result[sectionName]) {
      result[sectionName] = [];
    }
    result[sectionName].push(tagEl.querySelector('& > a')?.innerHTML || '');
  }
  return result;
}

function danbooruGetSectionTagList(): SectionTagList {
  const result: SectionTagList = {};

  // Находим секцию с тегами
  const section = document.querySelector('section#tag-list');
  if (!section) return result;

  const categories = section.querySelectorAll('ul');
  for (const category of categories) {
    // Находим следующий элемент после h3 (список ul с таким же классом)
    const listItems = category.querySelectorAll(`li`);
    if (listItems) {
      const tagList: TagList = [];
      // Парсим все элементы списка
      for (const item of listItems) {
        const tagName = item.getAttribute('data-tag-name');

        if (tagName) {
          // Получаем текст тега (убираем лишние пробелы)
          tagList.push(tagName);
        }
      }
      const categoryName = capitalize(category.className.split('-tag-list')[0]);
      result[categoryName] = tagList;
    }
  }
  return result;
}

function renderCopyTagsButton(el: Element | null, tags: string) {
  let dataTags = filterTags(tags.split(' ')).join(', ');
  console.log('123');
  dataTags = escapePrompt(dataTags);

  el && renderClipboardButton(el, dataTags, 'copy tags');
}

function renderCopyPostPrompt(tagList: SectionTagList, el: Element | null) {
  const filteredSectionTagList = filterSections(tagList);
  let prompt = '';
  for (const [section, tags] of entries(filteredSectionTagList)) {
    const filteredTags = filterTags(tags);
    if (section == 'Artist') {
      const animaArtist = filteredTags.map((t) => '@' + t);
      prompt += `*${section}:* ${filteredTags.join(', ')}, ${animaArtist.join(', ')} \n`;
    } else {
      prompt += `*${section}:* ${filteredTags.join(', ')} \n`;
    }
  }

  el && renderClipboardButton(el, prompt, 'copy prompt');
}

(function () {
  mapLocation({
    '^danbooru.donmai.us/': () => {
      const imgs = document.querySelectorAll('[data-tags]');
      for (const img of imgs) {
        renderCopyTagsButton(img, img.getAttribute('data-tags') || '');
      }
      document.querySelector('#subnav-menu')?.appendChild(
        createElementFromHTML(`
        <a id='subnav-help' class='py-1.5 px-3 ' href='/posts/random'>Random</a>
        `),
      );
    },
    '^danbooru.donmai.us/posts/': () => {
      renderCopyPostPrompt(
        danbooruGetSectionTagList(),
        document.querySelector('section.image-container picture'),
      );
    },
    '^gelbooru.com/': () => {
      const q = parseSearch();
      if (q['page'] === 'post' && q['s'] === 'list') {
        const imgs = document.querySelectorAll('article.thumbnail-preview img[title]');
        for (const img of imgs) {
          renderCopyTagsButton(img.parentElement, img.getAttribute('title') || '');
        }
      }
      if (q['page'] === 'post' && q['s'] === 'view') {
        const img = document.querySelector('section[data-tags]');
        renderCopyTagsButton(img, img?.getAttribute('data-tags') || '');

        renderCopyPostPrompt(gelbooruGetSectionTagList(), img);
      }
    },
    '^e621.net/posts': () => {
      const imgs = document.querySelectorAll('section.posts-container article[data-tags]');
      for (const img of imgs) {
        renderCopyTagsButton(img, img.getAttribute('data-tags') || '');
      }
    },
    '^e621.net/posts/\\d+': () => {
      const img = document.querySelector('section#image-container');
      renderCopyTagsButton(img, img?.getAttribute('data-tags') || '');
      renderCopyPostPrompt(e621GetSectionTagList(), img);
    },
  });
})();
