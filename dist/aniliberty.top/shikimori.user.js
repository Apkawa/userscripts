// ==UserScript==
// @name         AniLibria shikimori status sync
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sync and display shikimori status
// @author       Apkawa
// @match        https://www.aniliberty.top/*
// @match        https://aniliberty.top/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/shikimori.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/shikimori.user.js
// @license      MIT
// ==/UserScript==
// src/utils/ui/notification.ts
var NotificationDefaultOpts = {
  type: "success"
};
function showNotification(message, opts = NotificationDefaultOpts) {
  const isError = opts?.type == "error";
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

// src/utils/error.ts
function getErrorMessage(error) {
  if (error instanceof Error)
    return error.message;
  return String(error);
}

// src/aniliberty.top/shikimori.user.ts
(function() {
  const STORAGE_KEYS = {
    SHIKIMORI_SYNC_DATA: "shikimori_data",
    SHIKIMORI_LOGIN: "shikimori_login",
    LAST_SYNC: "shikimori_last_sync"
  };
  const PAGE_PATHS = {
    SETTINGS_ACCOUNT: "/app/settings/account",
    ANIME_CATALOG: "/anime/catalog/",
    ANIME_RELEASE: "/anime/releases/release/"
  };
  let cachedStatusMap = null;
  function sanitizeTitle(title) {
    return title.replace(/[^a-z0-9а-яё\s]/gi, " ").replace(/\s+/g, " ").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  }
  function getShikimoriLogin() {
    const value = GM_getValue(STORAGE_KEYS.SHIKIMORI_LOGIN, null);
    return value;
  }
  function setShikimoriLogin(login) {
    GM_setValue(STORAGE_KEYS.SHIKIMORI_LOGIN, login);
  }
  function getLastSyncTimestamp() {
    const value = GM_getValue(STORAGE_KEYS.LAST_SYNC, null);
    return value;
  }
  function setLastSyncTimestamp() {
    GM_setValue(STORAGE_KEYS.LAST_SYNC, Date.now());
  }
  function fetchAnimeList(login) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://shikimori.io/${encodeURIComponent(login)}/list_export/animes.json`,
        timeout: 15000,
        onload: (response) => {
          if (response.status === 200) {
            try {
              const data = JSON.parse(response.responseText);
              resolve(data);
            } catch (e) {
              reject(new Error("Failed to parse anime list JSON"));
            }
          } else if (response.status === 404) {
            reject(new Error(`User "${login}" not found on shikimori.io`));
          } else {
            reject(new Error(`Failed to fetch list: HTTP ${response.status}`));
          }
        },
        onerror: () => {
          reject(new Error("Network error while fetching anime list"));
        },
        ontimeout: () => {
          reject(new Error("Request timed out"));
        }
      });
    });
  }
  function buildStatusMap(entries) {
    const statusMap = new Map;
    for (const entry of entries) {
      const key = sanitizeTitle(entry.target_title);
      statusMap.set(key, {
        status: entry.status,
        score: entry.score,
        episodes: entry.episodes
      });
    }
    const serializable = Object.fromEntries(statusMap.entries());
    GM_setValue(STORAGE_KEYS.SHIKIMORI_SYNC_DATA, serializable);
    cachedStatusMap = statusMap;
  }
  function loadStatusMapFromStorage() {
    const raw = GM_getValue(STORAGE_KEYS.SHIKIMORI_SYNC_DATA);
    if (!raw)
      return new Map;
    if (raw instanceof Map)
      return raw;
    return new Map(Object.entries(raw));
  }
  function getStatusMap() {
    if (cachedStatusMap)
      return cachedStatusMap;
    cachedStatusMap = loadStatusMapFromStorage();
    return cachedStatusMap;
  }
  async function syncAnimeList(login) {
    const userLogin = login ?? getShikimoriLogin();
    if (!userLogin) {
      throw new Error("Shikimori login not set. Please configure it in settings.");
    }
    const entries = await fetchAnimeList(userLogin);
    buildStatusMap(entries);
    setLastSyncTimestamp();
    showNotification(`Synced ${entries.length} anime titles from shikimori`);
  }
  function getStatusForTitle(title) {
    const key = sanitizeTitle(title);
    return getStatusMap().get(key) ?? null;
  }
  function formatStatus(info) {
    const parts = [];
    parts.push(info.status);
    if (info.score > 0) {
      parts.push(`★ ${info.score}`);
    }
    return parts.join(" ");
  }
  function createStatusBadge(status) {
    const badge = document.createElement("div");
    badge.className = "d-flex align-center";
    badge.style.gap = "4px";
    badge.dataset.shikimoriBadge = "true";
    badge.innerHTML = `
    <div class="text-grey-darken-1 mr-1">Shikimori:</div>
    <div class="text-truncate">${status}</div>
  `;
    return badge;
  }
  function getCurrentPath() {
    return window.location.pathname;
  }
  function isSettingsPage() {
    return getCurrentPath() === PAGE_PATHS.SETTINGS_ACCOUNT;
  }
  function isCatalogPage() {
    return getCurrentPath().startsWith(PAGE_PATHS.ANIME_CATALOG);
  }
  function isReleasePage() {
    return getCurrentPath().startsWith(PAGE_PATHS.ANIME_RELEASE);
  }
  function injectSettingsForm() {
    const container = document.querySelector("div.d-flex > div.w-100");
    if (!container)
      return;
    if (container.querySelector("#shikimori-settings"))
      return;
    const currentLogin = getShikimoriLogin() ?? "";
    const settingsHtml = `
    <div id="shikimori-settings" class="v-card v-theme--dark v-card--density-default v-card--variant-elevated mt-2">
      <div
        class="v-list-item v-theme--dark v-list-item--density-default rounded-0 v-list-item--variant-text py-4"
      >
        <span class="v-list-item__underlay"></span>
        <div class="v-list-item__content" data-no-activator="">
          <div class="d-flex align-center flex-wrap justify-space-between">
            <div class="">
              <div class="v-list-item-title fz-80 ff-heading font-weight-bold text-wrap lh-120">
                Shikimori
              </div>
              <div class="v-list-item-subtitle pt-1">
                <div class="fz-70 ff-body lh-150 text-grey-lighten-1">
                  Введите ваш логин shikimori.io для синхронизации статуса
                </div>
              </div>
              <div class="v-layout mt-2 flex-column" style="z-index: 900; position: relative; overflow: hidden;">
                <div
                  class="v-input v-input--horizontal v-input--center-affix v-input--density-comfortable v-theme--dark v-locale--is-ltr v-text-field"
                  style="max-width: 350px;"
                >
                  <div class="v-input__control">
                    <div
                      class="v-field v-field--active v-field--center-affix v-field--dirty v-field--no-label v-field--variant-outlined v-theme--dark v-locale--is-ltr"
                    >
                      <div class="v-field__overlay"></div>
                      <div class="v-field__field" data-no-activator="">
                        <input
                          id="shikimori-login-input"
                          size="1"
                          type="text"
                          class="v-field__input"
                          value="${escapeHtml(currentLogin)}"
                          placeholder="Ваш логин на shikimori.io"
                        />
                      </div>
                      <div class="v-field__outline">
                        <div class="v-field__outline__start"></div>
                        <div class="v-field__outline__end"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  id="shikimori-save-btn"
                  class="v-btn v-btn--flat mt-2 v-theme--dark v-btn--density-default v-btn--size-default v-btn--variant-flat px-3 br-root ml-2"
                  style="background-color: rgba(255, 255, 255, 0.1); height: 48px;"
                >
                  <span class="v-btn__overlay"></span>
                  <span class="v-btn__underlay"></span>
                  <span class="v-btn__content" data-no-activator="">
                    <div class="mx-1 ff-heading fz-70 text-white">Сохранить</div>
                  </span>
                </button>
                <button
                  type="button"
                  id="shikimori-sync-btn"
                  class="v-btn v-btn--flat mt-2 v-theme--dark v-btn--density-default v-btn--size-default v-btn--variant-flat px-3 br-root ml-2"
                  style="background-color: rgba(255, 255, 255, 0.1); height: 48px;"
                >
                  <span class="v-btn__overlay"></span>
                  <span class="v-btn__underlay"></span>
                  <span class="v-btn__content" data-no-activator="">
                    <div class="mx-1 ff-heading fz-70 text-white">Синхронизировать</div>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = settingsHtml;
    const settingsElement = tempDiv.firstElementChild;
    container.appendChild(settingsElement);
    setupSettingsHandlers();
  }
  function setupSettingsHandlers() {
    const saveBtn = document.getElementById("shikimori-save-btn");
    const syncBtn = document.getElementById("shikimori-sync-btn");
    const input = document.getElementById("shikimori-login-input");
    saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const login = input.value.trim();
      if (!login) {
        showNotification("Введите логин", { type: "error" });
        return;
      }
      setShikimoriLogin(login);
      showNotification("Shikimori login saved");
    });
    syncBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const login = input.value.trim();
      syncAnimeList((login || getShikimoriLogin()) ?? undefined).catch((err) => {
        showNotification(getErrorMessage(err), { type: "error" });
      });
    });
  }
  function processCatalogItem(anchor) {
    if (anchor.dataset.shikimoriProcessed === "true")
      return;
    const href = anchor.getAttribute("href");
    if (!href?.startsWith(PAGE_PATHS.ANIME_RELEASE))
      return;
    const titleEl = anchor.querySelector("div.v-list-item__content div.ff-heading.text-grey-darken-2");
    if (!titleEl)
      return;
    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo)
      return;
    const target = titleEl.nextSibling;
    if (!target)
      return;
    const badge = createStatusBadge(formatStatus(statusInfo));
    target.parentNode?.insertBefore(badge, target.nextSibling);
    anchor.dataset.shikimoriProcessed = "true";
  }
  function processCatalogItems() {
    const anchors = document.querySelectorAll('div.v-list > a[role="listitem"]');
    for (const anchor of anchors) {
      if (anchor.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)) {
        processCatalogItem(anchor);
      }
    }
  }
  function processReleasePage() {
    const titleEl = document.querySelector("div.v-col-md-8.v-col-12.align-self-end > div.fz-70.ff-heading.text-grey-darken-2.mb-3");
    if (!titleEl)
      return;
    const container = document.querySelector("div.v-col-md-8.v-col-12.align-self-end > .fz-80.ff-body.mb-3");
    if (!container)
      return;
    if (container.dataset.shikimoriProcessed === "true" || container.querySelector("[data-shikimori-badge]")) {
      return;
    }
    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo)
      return;
    const badge = createStatusBadge(formatStatus(statusInfo));
    container.appendChild(badge);
    container.dataset.shikimoriProcessed = "true";
  }
  function processSearchItem(anchor) {
    if (anchor.dataset.shikimoriProcessed === "true")
      return;
    const titleEl = anchor.querySelector(".ff-body > div.v-list-item-subtitle.fz-70.text-grey.text-pre-wrap");
    if (!titleEl)
      return;
    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo)
      return;
    const ffBody = anchor.querySelector(".ff-body");
    if (!ffBody)
      return;
    const statusDiv = document.createElement("div");
    statusDiv.className = "v-list-item-subtitle fz-70 text-grey";
    statusDiv.textContent = `Shikimori: ${formatStatus(statusInfo)}`;
    ffBody.appendChild(statusDiv);
    anchor.dataset.shikimoriProcessed = "true";
  }
  function processSearchResults() {
    const modal = document.querySelector("div.search__modal");
    if (!modal)
      return;
    const anchors = modal.querySelectorAll('div.v-overlay__content .v-list > a[role="listitem"]');
    for (const anchor of anchors) {
      processSearchItem(anchor);
    }
  }
  function processCurrentPage() {
    if (isSettingsPage()) {
      injectSettingsForm();
    } else if (isCatalogPage()) {
      processCatalogItems();
    } else if (isReleasePage()) {
      processReleasePage();
    }
  }
  function setupMutationObservers() {
    const mainContent = document.querySelector("#__nuxt");
    if (!mainContent)
      return;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!mutation.addedNodes.length)
          continue;
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE)
            continue;
          const el = node;
          if (isCatalogPage()) {
            if (el.matches('a[role="listitem"]') && el.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)) {
              processCatalogItem(el);
            } else {
              const anchors = el.querySelectorAll('div.v-list > a[role="listitem"]');
              for (const anchor of anchors) {
                if (anchor.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)) {
                  processCatalogItem(anchor);
                }
              }
            }
          }
          if (el.closest("div.search__modal")) {
            const searchAnchors = el.querySelectorAll('div.v-overlay__content .v-list > a[role="listitem"]');
            for (const anchor of searchAnchors) {
              processSearchItem(anchor);
            }
          }
        }
      }
    });
    observer.observe(mainContent, {
      childList: true,
      subtree: true
    });
  }
  function setupSearchModalObserver() {
    const searchObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE)
            continue;
          const el = node;
          if (el.matches("div.search__modal")) {
            processSearchResults();
          }
        }
      }
    });
    searchObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function setupNavigationObserver() {
    const handleNavigation = () => {
      const pageData = document.querySelectorAll("[data-shikimori-processed]");
      pageData.forEach((el) => {
        el.removeAttribute("data-shikimori-processed");
      });
      processCurrentPage();
    };
    window.addEventListener("hashchange", handleNavigation);
    const urlObserver = new MutationObserver(() => {
      const currentPath = window.location.pathname;
      if (getCurrentPath() !== currentPath) {
        handleNavigation();
      }
    });
    urlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-url"]
    });
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function(...args) {
      const result = originalPushState.apply(this, args);
      setTimeout(handleNavigation, 500);
      return result;
    };
    history.replaceState = function(...args) {
      const result = originalReplaceState.apply(this, args);
      setTimeout(handleNavigation, 500);
      return result;
    };
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function init() {
    console.log("init shikimori sync");
    processCurrentPage();
    setupMutationObservers();
    setupSearchModalObserver();
    setupNavigationObserver();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
