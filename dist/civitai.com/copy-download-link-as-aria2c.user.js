// ==UserScript==
// @name         Civitai Aria2c Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds aria2c direct link copy button to civitai.com
// @author       Apkawa
// @match        https://civitai.com/*
// @match        https://civitai.red/*
// @grant        GM_xmlhttpRequest
// @connect      ://civitai.red
// @connect      ://civitai.com
// @connect      ://*.civitai.red
// @connect      ://*.civitai.com
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/copy-download-link-as-aria2c.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/copy-download-link-as-aria2c.user.js
// @license      MIT
// ==/UserScript==
// src/civitai.com/copy-download-link-as-aria2c.user.ts
(() => {
  const DOWNLOAD_SELECTOR = 'a[href^="/api/download/"]';
  const PROCESSED_ATTR = "data-aria2c-processed";
  const BUTTON_TEXT = "\uD83D\uDCCB aria2c";
  function showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.backgroundColor = isError ? "#f44336" : "#4caf50";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "5px";
    notification.style.zIndex = "10000";
    notification.style.fontFamily = "sans-serif";
    notification.style.fontSize = "14px";
    notification.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s";
    document.body.appendChild(notification);
    notification.getBoundingClientRect();
    setTimeout(() => {
      notification.style.opacity = "1";
    }, 10);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }
  function getFilenameFromUrl(url) {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;
      if (pathname.endsWith("/"))
        pathname = pathname.slice(0, -1);
      const segments = pathname.split("/");
      let filename = segments.pop() || "";
      filename = decodeURIComponent(filename);
      return filename;
    } catch (e) {
      console.error("Error parsing URL for filename:", e);
      return "unknown_file";
    }
  }
  async function handleCopy(linkElement, originalUrl) {
    const absoluteUrl = new URL(originalUrl, window.location.origin).href;
    try {
      showNotification("Получение прямой ссылки...", false);
      const finalUrl = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "HEAD",
          url: absoluteUrl,
          onload: (response) => {
            resolve(response.finalUrl || response.url);
          },
          onerror: (error) => {
            reject(error);
          }
        });
      });
      const filename = getFilenameFromUrl(finalUrl);
      const aria2cText = `${finalUrl}
    out=${filename}`;
      await navigator.clipboard.writeText(aria2cText);
      showNotification(`Скопировано! ${filename}`, false);
    } catch (error) {
      console.error("Ошибка при получении ссылки:", error);
      showNotification("Ошибка: не удалось получить прямую ссылку. Проверьте консоль.", true);
    }
  }
  function addButtonToLink(linkElement) {
    if (linkElement.hasAttribute(PROCESSED_ATTR))
      return;
    linkElement.setAttribute(PROCESSED_ATTR, "true");
    const button = document.createElement("button");
    button.textContent = BUTTON_TEXT;
    button.style.marginLeft = "8px";
    button.style.padding = "4px 8px";
    button.style.fontSize = "12px";
    button.style.cursor = "pointer";
    button.style.backgroundColor = "#2c2c2c";
    button.style.color = "#fff";
    button.style.border = "none";
    button.style.borderRadius = "4px";
    button.style.transition = "background-color 0.2s";
    button.addEventListener("mouseenter", () => button.style.backgroundColor = "#555");
    button.addEventListener("mouseleave", () => button.style.backgroundColor = "#2c2c2c");
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const href = linkElement.getAttribute("href");
      if (href) {
        handleCopy(linkElement, href);
      }
    });
    const parent = linkElement.parentNode;
    if (parent && parent.tagName !== "BUTTON") {
      if (linkElement.nextSibling) {
        parent.insertBefore(button, linkElement.nextSibling);
      } else {
        parent.appendChild(button);
      }
    } else {
      linkElement.insertAdjacentElement("afterend", button);
    }
  }
  function processAllLinks() {
    const links = document.querySelectorAll(DOWNLOAD_SELECTOR);
    links.forEach(addButtonToLink);
  }
  function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          shouldProcess = true;
          break;
        }
      }
      if (shouldProcess) {
        processAllLinks();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function init() {
    processAllLinks();
    observeDOMChanges();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
