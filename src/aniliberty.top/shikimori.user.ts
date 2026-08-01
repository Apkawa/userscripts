// ==UserScript==
// @name         AniLibria shikimori status sync
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sync and display shikimori status
// @author       UserScript
// @match        https://www.aniliberty.top/*
// @match        https://aniliberty.top/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

import { showNotification } from "@app/utils/ui/notification";
import { getErrorMessage } from "@app/utils/error";

(function () {
  "use strict";

  // ---------- Types ----------

  type AnimeListEntry = {
    target_title: string;
    target_title_ru: string;
    target_id: number;
    target_type: "Anime";
    score: number;
    status: string;
    rewatches: number;
    episodes: number;
    text: string;
  };

  type AnimeStatusInfo = {
    status: string;
    score: number;
    episodes: number;
  };

  // ---------- Constants ----------

  const STORAGE_KEYS = {
    SHIKIMORI_SYNC_DATA: "shikimori_data",
    SHIKIMORI_LOGIN: "shikimori_login",
    LAST_SYNC: "shikimori_last_sync",
  } as const;

  const PAGE_PATHS = {
    SETTINGS_ACCOUNT: "/app/settings/account",
    ANIME_CATALOG: "/anime/catalog/",
    ANIME_RELEASE: "/anime/releases/release/",
  } as const;

  // ---------- State ----------
  type StatusMap = Map<string, AnimeStatusInfo>;

  // In-memory cache to avoid repeated deserialization from GM storage
  let cachedStatusMap: StatusMap | null = null;

  // ---------- Title normalization ----------

  function sanitizeTitle(title: string): string {
    return title
      .replace(/[^a-z0-9а-яё\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // ---------- Storage ----------

  function getShikimoriLogin(): string | null {
    const value = GM_getValue(STORAGE_KEYS.SHIKIMORI_LOGIN, null);
    return value as string | null;
  }

  function setShikimoriLogin(login: string): void {
    GM_setValue(STORAGE_KEYS.SHIKIMORI_LOGIN, login);
  }

  function getLastSyncTimestamp(): number | null {
    const value = GM_getValue(STORAGE_KEYS.LAST_SYNC, null);
    return value as number | null;
  }

  function setLastSyncTimestamp(): void {
    GM_setValue(STORAGE_KEYS.LAST_SYNC, Date.now());
  }

  // ---------- Sync ----------

  function fetchAnimeList(login: string): Promise<AnimeListEntry[]> {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest<unknown>({
        method: "GET",
        url: `https://shikimori.io/${encodeURIComponent(login)}/list_export/animes.json`,
        timeout: 15000,
        onload: (response) => {
          if (response.status === 200) {
            try {
              const data = JSON.parse(response.responseText) as AnimeListEntry[];
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
        },
      });
    });
  }

  function buildStatusMap(entries: AnimeListEntry[]): void {
    const statusMap: StatusMap = new Map();
    for (const entry of entries) {
      const key = sanitizeTitle(entry.target_title);
      statusMap.set(key, {
        status: entry.status,
        score: entry.score,
        episodes: entry.episodes,
      });
    }
    // GM_setValue uses JSON serialization, so convert Map to plain object
    const serializable = Object.fromEntries(statusMap.entries());
    GM_setValue(STORAGE_KEYS.SHIKIMORI_SYNC_DATA, serializable);

    // Update in-memory cache
    cachedStatusMap = statusMap;
  }

  function loadStatusMapFromStorage(): StatusMap {
    const raw = GM_getValue(STORAGE_KEYS.SHIKIMORI_SYNC_DATA);
    if (!raw) return new Map();

    // If stored as plain object, convert back to Map
    if (raw instanceof Map) return raw;
    return new Map(Object.entries(raw));
  }

  function getStatusMap(): StatusMap {
    if (cachedStatusMap) return cachedStatusMap;
    cachedStatusMap = loadStatusMapFromStorage();
    return cachedStatusMap;
  }

  async function syncAnimeList(login?: string): Promise<void> {
    const userLogin = login ?? getShikimoriLogin();
    if (!userLogin) {
      throw new Error("Shikimori login not set. Please configure it in settings.");
    }

    const entries = await fetchAnimeList(userLogin);
    buildStatusMap(entries);
    setLastSyncTimestamp();
    showNotification(`Synced ${entries.length} anime titles from shikimori`);
  }

  // ---------- Status lookup ----------

  function getStatusForTitle(title: string): AnimeStatusInfo | null {
    const key = sanitizeTitle(title);
    return getStatusMap().get(key) ?? null;
  }

  function formatStatus(info: AnimeStatusInfo): string {
    const parts: string[] = [];
    parts.push(info.status);
    if (info.score > 0) {
      parts.push(`★ ${info.score}`);
    }
    return parts.join(" ");
  }

  // ---------- Status badge creation ----------

  function createStatusBadge(status: string): HTMLDivElement {
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

  // ---------- Page detection ----------

  function getCurrentPath(): string {
    return window.location.pathname;
  }

  function isSettingsPage(): boolean {
    return getCurrentPath() === PAGE_PATHS.SETTINGS_ACCOUNT;
  }

  function isCatalogPage(): boolean {
    return getCurrentPath().startsWith(PAGE_PATHS.ANIME_CATALOG);
  }

  function isReleasePage(): boolean {
    return getCurrentPath().startsWith(PAGE_PATHS.ANIME_RELEASE);
  }

  // ---------- Settings page ----------

  function injectSettingsForm(): void {
    const container = document.querySelector("div.d-flex > div.w-100");
    if (!container) return;

    if (container.querySelector("#shikimori-settings")) return;

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
    const settingsElement = tempDiv.firstElementChild as HTMLElement;
    container.appendChild(settingsElement);

    setupSettingsHandlers();
  }

  function setupSettingsHandlers(): void {
    const saveBtn = document.getElementById("shikimori-save-btn");
    const syncBtn = document.getElementById("shikimori-sync-btn");
    const input = document.getElementById("shikimori-login-input");

    saveBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const login = (input as HTMLInputElement).value.trim();
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
      const login = (input as HTMLInputElement).value.trim();
      syncAnimeList((login || getShikimoriLogin()) ?? undefined).catch((err) => {
        showNotification(getErrorMessage(err), { type: "error" });
      });
    });
  }

  // ---------- Catalog page ----------

  function processCatalogItem(anchor: HTMLAnchorElement): void {
    if (anchor.dataset.shikimoriProcessed === "true") return;

    const href = anchor.getAttribute("href");
    if (!href?.startsWith(PAGE_PATHS.ANIME_RELEASE)) return;

    const titleEl = anchor.querySelector(
      "div.v-list-item__content div.ff-heading.text-grey-darken-2",
    );
    if (!titleEl) return;

    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo) return;

    const target = titleEl.nextSibling;
    if (!target) return;

    const badge = createStatusBadge(formatStatus(statusInfo));
    target.parentNode?.insertBefore(badge, target.nextSibling);
    anchor.dataset.shikimoriProcessed = "true";
  }

  function processCatalogItems(): void {
    const anchors = document.querySelectorAll<HTMLAnchorElement>('div.v-list > a[role="listitem"]');
    for (const anchor of anchors) {
      if (anchor.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)) {
        processCatalogItem(anchor);
      }
    }
  }

  // ---------- Release page ----------

  function processReleasePage(): void {
    const titleEl = document.querySelector(
      "div.v-col-md-8.v-col-12.align-self-end > div.fz-70.ff-heading.text-grey-darken-2.mb-3",
    );
    if (!titleEl) return;

    const container = document.querySelector(
      "div.v-col-md-8.v-col-12.align-self-end > .fz-80.ff-body.mb-3",
    );
    if (!container) return;

    // Guard against reprocessing (check flag OR existing badge)
    if (
      container.dataset.shikimoriProcessed === "true" ||
      container.querySelector("[data-shikimori-badge]")
    ) {
      return;
    }

    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo) return;

    const badge = createStatusBadge(formatStatus(statusInfo));
    container.appendChild(badge);
    container.dataset.shikimoriProcessed = "true";
  }

  // ---------- Search modal ----------

  function processSearchItem(anchor: HTMLAnchorElement): void {
    if (anchor.dataset.shikimoriProcessed === "true") return;

    const titleEl = anchor.querySelector(
      ".ff-body > div.v-list-item-subtitle.fz-70.text-grey.text-pre-wrap",
    );
    if (!titleEl) return;

    const title = titleEl.textContent?.trim() ?? "";
    const statusInfo = getStatusForTitle(title);
    if (!statusInfo) return;

    const ffBody = anchor.querySelector(".ff-body");
    if (!ffBody) return;

    const statusDiv = document.createElement("div");
    statusDiv.className = "v-list-item-subtitle fz-70 text-grey";
    statusDiv.textContent = `Shikimori: ${formatStatus(statusInfo)}`;
    ffBody.appendChild(statusDiv);
    anchor.dataset.shikimoriProcessed = "true";
  }

  function processSearchResults(): void {
    const modal = document.querySelector("div.search__modal");
    if (!modal) return;

    const anchors = modal.querySelectorAll<HTMLAnchorElement>(
      'div.v-overlay__content .v-list > a[role="listitem"]',
    );
    for (const anchor of anchors) {
      processSearchItem(anchor);
    }
  }

  // ---------- SPA / Infinite scroll handling ----------

  function processCurrentPage(): void {
    if (isSettingsPage()) {
      injectSettingsForm();
    } else if (isCatalogPage()) {
      processCatalogItems();
    } else if (isReleasePage()) {
      processReleasePage();
    }
  }

  function setupMutationObservers(): void {
    const mainContent = document.querySelector("#__nuxt");
    if (!mainContent) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (!mutation.addedNodes.length) continue;

        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;

          // Catalog items
          if (isCatalogPage()) {
            if (
              el.matches('a[role="listitem"]') &&
              el.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)
            ) {
              processCatalogItem(el as HTMLAnchorElement);
            } else {
              const anchors = el.querySelectorAll<HTMLAnchorElement>(
                'div.v-list > a[role="listitem"]',
              );
              for (const anchor of anchors) {
                if (anchor.getAttribute("href")?.startsWith(PAGE_PATHS.ANIME_RELEASE)) {
                  processCatalogItem(anchor);
                }
              }
            }
          }

          // Search results
          if (el.closest("div.search__modal")) {
            const searchAnchors = el.querySelectorAll<HTMLAnchorElement>(
              'div.v-overlay__content .v-list > a[role="listitem"]',
            );
            for (const anchor of searchAnchors) {
              processSearchItem(anchor);
            }
          }
        }
      }
    });

    observer.observe(mainContent, {
      childList: true,
      subtree: true,
    });
  }

  function setupSearchModalObserver(): void {
    const searchObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const el = node as Element;
          if (el.matches("div.search__modal")) {
            processSearchResults();
          }
        }
      }
    });

    searchObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // ---------- Navigation handling (SPA) ----------

  function setupNavigationObserver(): void {
    const handleNavigation = (): void => {
      const pageData = document.querySelectorAll("[data-shikimori-processed]");
      pageData.forEach((el) => {
        el.removeAttribute("data-shikimori-processed");
      });
      processCurrentPage();
    };

    window.addEventListener("hashchange", handleNavigation);

    // Observe URL changes for SPA navigation
    const urlObserver = new MutationObserver(() => {
      const currentPath = window.location.pathname;
      if (getCurrentPath() !== currentPath) {
        handleNavigation();
      }
    });

    urlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-url"],
    });

    // Also watch for pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      setTimeout(handleNavigation, 500);
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      setTimeout(handleNavigation, 500);
      return result;
    };
  }

  // ---------- Helpers ----------

  function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // ---------- Init ----------

  function init(): void {
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
