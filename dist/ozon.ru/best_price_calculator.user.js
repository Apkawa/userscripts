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
// @homepage     https://github.com/Apkawa/userscripts
// @homepageUrl  https://github.com/Apkawa/userscripts
// @supportUrl   https://github.com/Apkawa/userscripts/issues
// @downloadUrl  https://github.com/Apkawa/userscripts/raw/master/dist/ozon.ru/best_price_calculator.user.js
// @updateUrl    https://github.com/Apkawa/userscripts/raw/master/dist/ozon.ru/best_price_calculator.user.js
// ==/UserScript==
(function() {
    "use strict";
    function isFunction(x) {
        return "function" === typeof x;
    }
    function waitElement(match, callback) {
        const observer = new MutationObserver((mutations => {
            let matchFlag = false;
            mutations.forEach((mutation => {
                if (!mutation.addedNodes) return;
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    matchFlag = match(node);
                }
            }));
            if (matchFlag) {
                _stop();
                callback();
                _start();
            }
        }));
        let isStarted = false;
        function _start() {
            if (isStarted) return;
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: false
            });
            isStarted = true;
        }
        function _stop() {
            observer.disconnect();
            isStarted = false;
        }
        _start();
        return () => {
            _stop();
        };
    }
    function matchLocation(...patterns) {
        const s = document.location.href;
        for (const p of patterns) {
            if (isFunction(p) && p(s)) return true;
            if (RegExp(p).test(s)) return true;
        }
        return false;
    }
    function isRegexp(value) {
        return "[object RegExp]" === toString.call(value);
    }
    function mRegExp(regExps) {
        return RegExp(regExps.map((function(r) {
            if (isRegexp(r)) return r.source;
            return r;
        })).join(""));
    }
    const WEIGHT_REGEXP = mRegExp([ /(?<value>\d+[,.]\d+|\d+)/, /\s?/, "(?<unit>", "(?<weight_unit>(?<weight_SI>кг|килограмм)|г|грамм|гр)", "|(?<volume_unit>(?<volume_SI>л|литр)|мл))" ]);
    const QUANTITY_REGEXP = /(?<quantity>\d+)\s?(?<quantity_unit>шт?.|рулон|пакет)/;
    const COMBINE_DELIMETER_REGEXP = /\s?[xх*]\s?/;
    const COMBINE_REGEXP_LIST = [ mRegExp([ WEIGHT_REGEXP, COMBINE_DELIMETER_REGEXP, QUANTITY_REGEXP ]), mRegExp([ QUANTITY_REGEXP, COMBINE_DELIMETER_REGEXP, WEIGHT_REGEXP ]), mRegExp([ /(?<quantity>\d+)/, COMBINE_DELIMETER_REGEXP, WEIGHT_REGEXP ]), mRegExp([ WEIGHT_REGEXP, COMBINE_DELIMETER_REGEXP, /(?<quantity>\d+)/ ]) ];
    function parseGroups(groups) {
        const result = {
            weight: null,
            item_weight: null,
            weight_unit: null,
            quantity: 1
        };
        if (groups.value) {
            const valueStr = null === groups || void 0 === groups ? void 0 : groups.value;
            const unit = null === groups || void 0 === groups ? void 0 : groups.unit;
            if (valueStr && unit) {
                let value = parseFloat(valueStr.replace(",", "."));
                if (groups.weight_unit) {
                    if (!groups.weight_SI) value /= 1e3;
                    result.weight_unit = "кг";
                }
                if (groups.volume_unit) {
                    if (!groups.volume_SI) value /= 1e3;
                    result.weight_unit = "л";
                }
                result.weight = value;
                result.item_weight = value;
            }
        }
        if (groups.quantity) {
            const valueStr = null === groups || void 0 === groups ? void 0 : groups.quantity;
            if (valueStr) result.quantity = parseInt(valueStr);
        }
        if (result.item_weight && result.quantity > 1) result.weight = result.quantity * result.item_weight;
        return result;
    }
    function parseTitle(title) {
        for (const r of COMBINE_REGEXP_LIST) {
            const rMatch = r.exec(title);
            if (rMatch) return parseGroups(rMatch.groups);
        }
        let groups = {};
        const weightMatch = WEIGHT_REGEXP.exec(title);
        if (null === weightMatch || void 0 === weightMatch ? void 0 : weightMatch.groups) groups = weightMatch.groups;
        const quantityMatch = QUANTITY_REGEXP.exec(title);
        if (null === quantityMatch || void 0 === quantityMatch ? void 0 : quantityMatch.groups) groups = Object.assign(Object.assign({}, groups), quantityMatch.groups);
        const result = parseGroups(groups);
        return result;
    }
    function getPriceFromElement(el) {
        var _a, _b;
        const priceText = null === (_b = null === (_a = null === el || void 0 === el ? void 0 : el.innerText) || void 0 === _a ? void 0 : _a.split("₽")[0]) || void 0 === _b ? void 0 : _b.trim();
        if (priceText) return parseInt(priceText.replace("&thinsp;", "").replace(" ", ""));
        return null;
    }
    function getPrice(sel) {
        const priceEl = document.querySelector(sel);
        return getPriceFromElement(priceEl);
    }
    function round(n, parts = 2) {
        const i = Math.pow(10, parts);
        return Math.round(n * i) / i;
    }
    function renderBestPrice(price, titleInfo) {
        const wrapEl = document.createElement("div");
        wrapEl.className = "GM-best-price";
        if (!price) return wrapEl;
        if (titleInfo.weight) {
            const weightEl = document.createElement("p");
            weightEl.innerText = `${round(price / titleInfo.weight)} ₽/${titleInfo.weight_unit || "?"}`;
            wrapEl.appendChild(weightEl);
        }
        if (titleInfo.quantity && 1 !== titleInfo.quantity) {
            const qtyEl = document.createElement("p");
            qtyEl.innerText = `${round(price / titleInfo.quantity)} ₽/шт`;
            wrapEl.appendChild(qtyEl);
        }
        return wrapEl;
    }
    function initProductPage() {
        const init = () => {
            var _a, _b, _c, _d;
            const title = null === (_a = document.querySelector("[data-widget='webProductHeading']")) || void 0 === _a ? void 0 : _a.textContent;
            if (!title) return;
            const price = getPrice("[data-widget='webPrice']");
            const greenPrice = getPrice("[data-widget='webOzonAccountPrice']");
            const parsedTitle = parseTitle(title);
            if (greenPrice) null === (_c = null === (_b = document.querySelector("[data-widget='webOzonAccountPrice']")) || void 0 === _b ? void 0 : _b.parentElement) || void 0 === _c ? void 0 : _c.appendChild(renderBestPrice(greenPrice, parsedTitle)); else null === (_d = document.querySelector("[data-widget='webPrice']")) || void 0 === _d ? void 0 : _d.appendChild(renderBestPrice(price, parsedTitle));
        };
        let run = true;
        const stop = waitElement((el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll("[data-widget='webCharacteristics']"));
        }), (() => {
            const allowRun = Boolean(document.querySelector("[data-widget='webOzonAccountPrice']"));
            if (run && allowRun) {
                stop();
                run = false;
                init();
            }
        }));
    }
    function initCatalog() {
        const init = () => {
            var _a, _b;
            for (const cardEl of document.querySelectorAll(".widget-search-result-container > div > div")) {
                const wrapEl = cardEl.querySelector(":scope > div");
                if (wrapEl && !wrapEl.querySelector(".GM-best-price")) {
                    const price = getPriceFromElement(wrapEl.querySelector("div"));
                    const title = null === (_a = wrapEl.querySelector("a")) || void 0 === _a ? void 0 : _a.textContent;
                    if (!title) return;
                    console.log(title, price);
                    const parsedTitle = parseTitle(title);
                    const a = wrapEl.querySelector("a");
                    null === (_b = null === a || void 0 === a ? void 0 : a.parentElement) || void 0 === _b ? void 0 : _b.insertBefore(renderBestPrice(price, parsedTitle), a);
                }
            }
        };
        const stop = waitElement((el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll("[data-widget='footer']"));
        }), (() => {
            const allowRun = Boolean(document.querySelector(".tile-hover-target"));
            if (allowRun) {
                stop();
                init();
            }
        }));
    }
    (function() {
        "use strict";
        console.log("OZON>RU");
        if (!matchLocation("^https://(www.|)ozon.ru/.*")) return;
        if (matchLocation("^https://(www.|)ozon.ru/product/.*")) initProductPage();
        if (matchLocation("^https://(www.|)ozon.ru/(category|highlight)/.*")) initCatalog();
    })();
})();