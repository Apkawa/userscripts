// ==UserScript==
// @name         AniLibria torrents
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds HEVC magnet and torrent buttons to anime catalog
// @author       UserScript
// @match        https://www.aniliberty.top/anime/catalog/
// ==/UserScript==
import { showNotification } from "@app/utils/ui/notification";

type CatalogItem = {
  id: number;
  name: {
    english: string;
    main: string;
  };
  alias: string;
};

type TorrentCodec = {
  label: string;
};

type Torrent = {
  hash: string;
  codec: TorrentCodec;
  magnet: string;
  label: string;
  filename: string;
};

type PiniaState = {
  "anime.catalog": {
    releases: {
      _rawValue: {
        data: CatalogItem[];
      };
    };
  };
  "me.account": {
    profile: {
      _rawValue: {
        torrents: {
          passkey: string;
        };
      };
    };
  };
};

(function () {
  "use strict";

  // ---------- Type guards and helpers ----------
  function getNuxtState(): PiniaState | null {
    const nuxtApp = document.querySelector("#__nuxt")?.__vue_app__;
    if (!nuxtApp) return null;
    try {
      const pinia = nuxtApp._context.config.globalProperties.$pinia;
      return pinia?.state?._rawValue ?? null;
    } catch {
      return null;
    }
  }

  function getPasskey(state: PiniaState): string | null {
    try {
      return state["me.account"].profile._rawValue.torrents.passkey;
    } catch {
      return null;
    }
  }

  function getCatalogItems(state: PiniaState): CatalogItem[] {
    try {
      return state["anime.catalog"].releases._rawValue.data;
    } catch {
      return [];
    }
  }

  // ---------- Alias -> ID map ----------
  const aliasMap = new Map<string, CatalogItem>();

  function updateAliasMap(): void {
    const state = getNuxtState();
    if (!state) return;
    const items = getCatalogItems(state);
    for (const item of items) {
      if (!aliasMap.has(item.alias)) {
        aliasMap.set(item.alias, item);
      }
    }
  }

  function getReleaseByAlias(alias: string): CatalogItem | null {
    // Try map first, then update from state and try again
    if (aliasMap.has(alias)) {
      return aliasMap.get(alias)!;
    }
    updateAliasMap();
    return aliasMap.get(alias) ?? null;
  }

  function getReleaseId(alias: string): number | null {
    return getReleaseByAlias(alias)?.id ?? null;
  }

  // ---------- API calls ----------
  async function fetchTorrents(releaseId: number): Promise<Torrent[]> {
    const url = `https://www.aniliberty.top/api/v1/anime/torrents/release/${releaseId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch torrents: ${res.status}`);
    const data = await res.json();
    // Filter HEVC
    return data.filter((t: Torrent) => t.codec.label === "HEVC");
  }

  async function downloadTorrentFile(torrent: Torrent, passkey: string): Promise<void> {
    const { hash, filename } = torrent;
    const url = `https://www.aniliberty.top/api/v1/anime/torrents/${hash}/file?pk=${encodeURIComponent(passkey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to download torrent: ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
  // ---------- Button creation ----------
  function createIconButton(iconSvg: string, label: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "v-btn v-btn--flat v-theme--dark v-btn--density-null v-btn--size-default v-btn--variant-flat px-3 br-root";
    Object.assign(button.style, {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      height: "36px",
      minWidth: "40px",
      width: "40px",
      cursor: "pointer",
      border: "none",
      borderRadius: "4px",
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
    });

    // Overlay spans (mimic Vuetify structure)
    const overlay = document.createElement("span");
    overlay.className = "v-btn__overlay";
    const underlay = document.createElement("span");
    underlay.className = "v-btn__underlay";
    const content = document.createElement("span");
    content.className = "v-btn__content";
    content.setAttribute("data-no-activator", "");

    // Icon
    const iconWrapper = document.createElement("i");
    iconWrapper.className = "v-icon notranslate v-theme--dark text-white";
    iconWrapper.setAttribute("aria-hidden", "true");
    Object.assign(iconWrapper.style, {
      fontSize: "20px",
      height: "20px",
      width: "20px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    });
    iconWrapper.innerHTML = iconSvg;

    content.appendChild(iconWrapper);
    button.append(overlay, underlay, content);

    button.setAttribute("aria-label", label);
    return button;
  }

  function getMagnetSvg(): string {
    return `
    <svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M3,7V13A9,9 0 0,0 12,22A9,9 0 0,0 21,13V7H17V13A5,5 0 0,1 12,18A5,5 0 0,1 7,13V7M17,5H21V2H17M3,5H7V2H3M13,1.5L9,9H11V14.5L15,7H13V1.5Z"></path></svg>
    `;
  }

  function getTorrentSvg(): string {
    return `
    <svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"></path></svg>
    `;
  }

  function createButtonContainer(alias: string): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "d-flex";
    Object.assign(container.style, {
      gap: "4px",
      alignItems: "center",
      marginLeft: "4px",
    });

    // Magnet button
    const magnetBtn = createIconButton(getMagnetSvg(), "HEVC Magnet");
    magnetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleMagnetClick(alias).catch(handleError);
    });

    // Torrent button
    const torrentBtn = createIconButton(getTorrentSvg(), "HEVC Torrent");
    torrentBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleTorrentClick(alias).catch(handleError);
    });

    container.appendChild(magnetBtn);
    container.appendChild(torrentBtn);
    return container;
  }

  function handleError(err: Error | string) {
    console.error(err);
    showNotification(err instanceof Error ? err.message : err.toString(), { type: "error" });
  }

  /**
   * Очищает строку от символов, запрещённых в именах файлов Windows,
   * заменяя их на пробелы, и нормализует пробелы.
   * @param input - исходная строка
   * @returns очищенная строка
   */
  function sanitizeFileName(input: string): string {
    // Заменяем недопустимые символы (\, /, :, *, ?, ", <, >, |) на пробелы
    let result = input.replace(/[\\/:*?"<>|]/g, " ");
    // Заменяем управляющие символы (коды 0–31) на пробелы
    result = result.replace(/[\x00-\x1F]/g, " ");
    // Схлопываем множественные пробелы в один и убираем пробелы по краям
    result = result.replace(/\s+/g, " ").trim();
    return result;
  }

  // ---------- Click handlers ----------
  async function handleMagnetClick(alias: string): Promise<void> {
    try {
      const release = getReleaseByAlias(alias);
      if (!release) {
        showNotification("Release ID not found for alias: " + alias, { type: "error" });
        return;
      }

      const torrents = await fetchTorrents(release.id);
      if (torrents.length === 0) {
        showNotification("No HEVC torrent found", { type: "error" });
        return;
      }
      // Open first magnet
      const magnet = torrents[0].magnet;
      window.open(magnet, "_blank");
      showNotification("Magnet opened");
      await navigator.clipboard.writeText(sanitizeFileName(release.name.main));
    } catch (err) {
      console.error(err);
      showNotification(err instanceof Error ? err.message : "Error fetching magnet", {
        type: "error",
      });
    }
  }

  async function handleTorrentClick(alias: string): Promise<void> {
    try {
      const state = getNuxtState();
      if (!state) {
        showNotification("Cannot access app state", { type: "error" });
        return;
      }
      const passkey = getPasskey(state);
      if (!passkey) {
        showNotification("Passkey not found", { type: "error" });
        return;
      }

      const release = getReleaseByAlias(alias);
      if (!release) {
        showNotification("Release ID not found", { type: "error" });
        return;
      }
      const { id, name } = release;
      const torrents = await fetchTorrents(id);
      if (torrents.length === 0) {
        showNotification("No HEVC torrent found", { type: "error" });
        return;
      }

      await downloadTorrentFile(torrents[0], passkey);
      showNotification("Torrent downloaded");
      await navigator.clipboard.writeText(sanitizeFileName(name.main));
    } catch (err) {
      console.error(err);
      showNotification(err instanceof Error ? err.message : "Error downloading torrent", {
        type: "error",
      });
    }
  }

  // ---------- DOM processing ----------
  function processAnchor(anchor: HTMLAnchorElement): void {
    if (anchor.dataset.userscriptProcessed === "true") return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    const match = href.match(/^\/anime\/releases\/release\/([^/]+)\/episodes/);
    if (!match) return;
    const alias = match[1];

    const layout = anchor.querySelector(".v-layout");
    if (!layout) return;

    // Insert button container after the layout
    const container = createButtonContainer(alias);
    layout.parentNode?.insertBefore(container, layout.nextSibling);

    anchor.dataset.userscriptProcessed = "true";
  }

  function processAnchors(anchors: NodeListOf<HTMLAnchorElement>): void {
    for (const anchor of anchors) {
      processAnchor(anchor);
    }
  }

  function init(): void {
    console.log("init");
    // Initial update of alias map
    updateAliasMap();

    // Process existing items
    const anchors = document.querySelectorAll<HTMLAnchorElement>('div.v-list > a[role="listitem"]');
    processAnchors(anchors);

    // Set up MutationObserver for infinite scroll
    const listContainer = document.querySelector("div#__nuxt");
    if (listContainer) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as Element;
              // Check if it's an anchor directly or contains anchors
              if (el.matches('a[role="listitem"]')) {
                processAnchor(el as HTMLAnchorElement);
              } else {
                const innerAnchors = el.querySelectorAll<HTMLAnchorElement>(
                  'div.v-list > a[role="listitem"]',
                );
                processAnchors(innerAnchors);
              }
            }
          }
        }
        // Update alias map after new items added (they might have new aliases)
        updateAliasMap();
      });

      observer.observe(listContainer, {
        childList: true,
        subtree: true,
      });
    }
  }

  // Run after a short delay to let page initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
