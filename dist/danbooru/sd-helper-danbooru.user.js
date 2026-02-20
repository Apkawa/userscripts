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

// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/danbooru/sd-helper-danbooru.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/danbooru/sd-helper-danbooru.user.js
// ==/UserScript==
(function() {
    "use strict";
    function mapLocation(map) {
        const s = document.location.hostname + document.location.pathname;
        for (const [k, v] of Object.entries(map)) if (RegExp(k).test(s)) v();
    }
    function parseSearch() {
        return Object.fromEntries(new URLSearchParams(window.location.search).entries());
    }
    Object.keys;
    const entries = Object.entries;
    Object.values;
    function createElementFromHTML(htmlString) {
        const div = document.createElement("div");
        div.innerHTML = htmlString.trim();
        if (div.firstChild) return div.firstChild; else throw "oops";
    }
    function capitalize(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    function e621GetSectionTagList() {
        const result = {};
        const section = document.querySelector("section#tag-list");
        if (!section) return result;
        const categories = section.querySelectorAll("ul");
        for (const category of categories) {
            const listItems = category.querySelectorAll(`li`);
            if (listItems) {
                const tagList = [];
                for (const item of listItems) {
                    const tagName = item.getAttribute("data-name");
                    if (tagName) tagList.push(tagName);
                }
                const categoryName = capitalize(category.classList[1].split("-tag-list")[0]);
                result[categoryName] = tagList;
            }
        }
        return result;
    }
    const EXCLUDED_TAGS = [ ".*censor.*", "commentary_request", "translation_request", "commentary", "absurdres", "lowres", "highres", "(hi|low|absurd|superabsurd)_res", "thumbnail", "wallpaper", "high_framerate", "incredibly_absurdres", "huge_filesize", "animated" ];
    const EXCLUDED_TAGS_RE = RegExp(`(:?${EXCLUDED_TAGS.join("|")})`);
    function escapePrompt(prompt) {
        return prompt.replaceAll(/[\(\)\[\]\{\}]/g, "\\$&");
    }
    function filterTags(tags) {
        return tags.filter((t => !EXCLUDED_TAGS_RE.test(t)));
    }
    function filterSections(section) {
        var _a;
        const excludedSections = [ "Meta", "Metadata" ];
        if ("original" == (null === (_a = section["Copyright"]) || void 0 === _a ? void 0 : _a[0])) excludedSections.push("Copyright");
        for (const n of excludedSections) delete section[n];
        return section;
    }
    function renderClipboardButton(root_el, dataText, button_text, attr_name = "data-sd-tags") {
        const button_el = createElementFromHTML(`<button ${attr_name}='${dataText}'>\n    ${button_text}</button>`);
        button_el.addEventListener("click", (event => {
            const _this = event.currentTarget;
            const t = _this.getAttribute(attr_name);
            t && void navigator.clipboard.writeText(t);
            return false;
        }));
        null === root_el || void 0 === root_el ? void 0 : root_el.appendChild(button_el);
    }
    function gelbooruGetSectionTagList() {
        var _a;
        const result = {};
        const tagList = document.querySelectorAll('ul.tag-list li[class^="tag-type"]');
        for (const tagEl of tagList) {
            const sectionName = capitalize(tagEl.className.substr("tag-type-".length).trim());
            if (!result[sectionName]) result[sectionName] = [];
            result[sectionName].push((null === (_a = tagEl.querySelector("& > a")) || void 0 === _a ? void 0 : _a.innerHTML) || "");
        }
        return result;
    }
    function danbooruGetSectionTagList() {
        const result = {};
        const section = document.querySelector("section#tag-list");
        if (!section) return result;
        const categories = section.querySelectorAll("ul");
        for (const category of categories) {
            const listItems = category.querySelectorAll(`li`);
            if (listItems) {
                const tagList = [];
                for (const item of listItems) {
                    const tagName = item.getAttribute("data-tag-name");
                    if (tagName) tagList.push(tagName);
                }
                const categoryName = capitalize(category.className.split("-tag-list")[0]);
                result[categoryName] = tagList;
            }
        }
        return result;
    }
    function renderCopyTagsButton(el, tags) {
        let dataTags = filterTags(tags.split(" ")).join(", ");
        console.log("123");
        dataTags = escapePrompt(dataTags);
        el && renderClipboardButton(el, dataTags, "copy tags");
    }
    function renderCopyPostPrompt(tagList, el) {
        const filteredSectionTagList = filterSections(tagList);
        let prompt = "";
        for (const [section, tags] of entries(filteredSectionTagList)) {
            const filteredTags = filterTags(tags);
            if ("Artist" == section) {
                const animaArtist = filteredTags.map((t => "@" + t));
                prompt += `*${section}:* ${filteredTags.join(", ")}, ${animaArtist.join(", ")} \n`;
            } else prompt += `*${section}:* ${filteredTags.join(", ")} \n`;
        }
        el && renderClipboardButton(el, prompt, "copy prompt");
    }
    (function() {
        mapLocation({
            "^danbooru.donmai.us/": () => {
                var _a;
                const imgs = document.querySelectorAll("[data-tags]");
                for (const img of imgs) renderCopyTagsButton(img, img.getAttribute("data-tags") || "");
                null === (_a = document.querySelector("#subnav-menu")) || void 0 === _a ? void 0 : _a.appendChild(createElementFromHTML(`\n        <a id='subnav-help' class='py-1.5 px-3 ' href='/posts/random'>Random</a>\n        `));
            },
            "^danbooru.donmai.us/posts/": () => {
                renderCopyPostPrompt(danbooruGetSectionTagList(), document.querySelector("section.image-container picture"));
            },
            "^gelbooru.com/": () => {
                const q = parseSearch();
                if ("post" === q["page"] && "list" === q["s"]) {
                    const imgs = document.querySelectorAll("article.thumbnail-preview img[title]");
                    for (const img of imgs) renderCopyTagsButton(img.parentElement, img.getAttribute("title") || "");
                }
                if ("post" === q["page"] && "view" === q["s"]) {
                    const img = document.querySelector("section[data-tags]");
                    renderCopyTagsButton(img, (null === img || void 0 === img ? void 0 : img.getAttribute("data-tags")) || "");
                    renderCopyPostPrompt(gelbooruGetSectionTagList(), img);
                }
            },
            "^e621.net/posts": () => {
                const imgs = document.querySelectorAll("section.posts-container article[data-tags]");
                for (const img of imgs) renderCopyTagsButton(img, img.getAttribute("data-tags") || "");
            },
            "^e621.net/posts/\\d+": () => {
                const img = document.querySelector("section#image-container");
                renderCopyTagsButton(img, (null === img || void 0 === img ? void 0 : img.getAttribute("data-tags")) || "");
                renderCopyPostPrompt(e621GetSectionTagList(), img);
            }
        });
    })();
})();