// ==UserScript==
// @name         AniLibria torrents
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds HEVC magnet and torrent buttons to anime catalog
// @author       Apkawa
// @match        https://www.aniliberty.top/anime/catalog/
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/torrents.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/torrents.user.js
// @license      MIT
// ==/UserScript==
// src/aniliberty.top/torrents.user.ts
(function() {
  function getNuxtState() {
    const nuxtApp = document.querySelector("#__nuxt")?.__vue_app__;
    if (!nuxtApp)
      return null;
    try {
      const pinia = nuxtApp._context.config.globalProperties.$pinia;
      return pinia?.state?._rawValue ?? null;
    } catch {
      return null;
    }
  }
  function getPasskey(state) {
    try {
      return state["me.account"].profile._rawValue.torrents.passkey;
    } catch {
      return null;
    }
  }
  function getCatalogItems(state) {
    try {
      return state["anime.catalog"].releases._rawValue.data;
    } catch {
      return [];
    }
  }
  const aliasMap = new Map;
  function updateAliasMap() {
    const state = getNuxtState();
    if (!state)
      return;
    const items = getCatalogItems(state);
    for (const item of items) {
      if (!aliasMap.has(item.alias)) {
        aliasMap.set(item.alias, item.id);
      }
    }
  }
  function getReleaseId(alias) {
    if (aliasMap.has(alias)) {
      return aliasMap.get(alias);
    }
    updateAliasMap();
    return aliasMap.get(alias) ?? null;
  }
  async function fetchTorrents(releaseId) {
    const url = `https://www.aniliberty.top/api/v1/anime/torrents/release/${releaseId}`;
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Failed to fetch torrents: ${res.status}`);
    const data = await res.json();
    return data.filter((t) => t.codec.label === "HEVC");
  }
  async function downloadTorrentFile(torrent, passkey) {
    const { hash, filename } = torrent;
    const url = `https://www.aniliberty.top/api/v1/anime/torrents/${hash}/file?pk=${encodeURIComponent(passkey)}`;
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Failed to download torrent: ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }
  function showNotification(message, type = "success") {
    const containerId = "us-notification-container";
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      Object.assign(container.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: "9999",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxWidth: "300px",
        pointerEvents: "none"
      });
      document.body.appendChild(container);
    }
    const notification = document.createElement("div");
    Object.assign(notification.style, {
      padding: "12px 16px",
      borderRadius: "8px",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      backgroundColor: type === "success" ? "#2e7d32" : "#c62828",
      pointerEvents: "auto",
      transition: "opacity 0.3s ease",
      opacity: "1"
    });
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }, 4000);
  }
  function createIconButton(iconSvg, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "v-btn v-btn--flat v-theme--dark v-btn--density-null v-btn--size-default v-btn--variant-flat px-3 br-root";
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
      padding: "0"
    });
    const overlay = document.createElement("span");
    overlay.className = "v-btn__overlay";
    const underlay = document.createElement("span");
    underlay.className = "v-btn__underlay";
    const content = document.createElement("span");
    content.className = "v-btn__content";
    content.setAttribute("data-no-activator", "");
    const iconWrapper = document.createElement("i");
    iconWrapper.className = "v-icon notranslate v-theme--dark text-white";
    iconWrapper.setAttribute("aria-hidden", "true");
    Object.assign(iconWrapper.style, {
      fontSize: "20px",
      height: "20px",
      width: "20px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    });
    iconWrapper.innerHTML = iconSvg;
    content.appendChild(iconWrapper);
    button.append(overlay, underlay, content);
    button.setAttribute("aria-label", label);
    return button;
  }
  function getMagnetSvg() {
    return `
    <svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M3,7V13A9,9 0 0,0 12,22A9,9 0 0,0 21,13V7H17V13A5,5 0 0,1 12,18A5,5 0 0,1 7,13V7M17,5H21V2H17M3,5H7V2H3M13,1.5L9,9H11V14.5L15,7H13V1.5Z"></path></svg>
    `;
  }
  function getTorrentSvg() {
    return `
    <svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"></path></svg>
    `;
  }
  function createButtonContainer(alias) {
    const container = document.createElement("div");
    container.className = "d-flex";
    Object.assign(container.style, {
      gap: "4px",
      alignItems: "center",
      marginLeft: "4px"
    });
    const magnetBtn = createIconButton(getMagnetSvg(), "HEVC Magnet");
    magnetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleMagnetClick(alias).catch(handleError);
    });
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
  function handleError(err) {
    console.error(err);
    showNotification(err instanceof Error ? err.message : err.toString(), "error");
  }
  async function handleMagnetClick(alias) {
    try {
      const id = getReleaseId(alias);
      if (!id) {
        showNotification("Release ID not found for alias: " + alias, "error");
        return;
      }
      const torrents = await fetchTorrents(id);
      if (torrents.length === 0) {
        showNotification("No HEVC torrent found", "error");
        return;
      }
      const magnet = torrents[0].magnet;
      window.open(magnet, "_blank");
      showNotification("Magnet opened", "success");
    } catch (err) {
      console.error(err);
      showNotification(err instanceof Error ? err.message : "Error fetching magnet", "error");
    }
  }
  async function handleTorrentClick(alias) {
    try {
      const state = getNuxtState();
      if (!state) {
        showNotification("Cannot access app state", "error");
        return;
      }
      const passkey = getPasskey(state);
      if (!passkey) {
        showNotification("Passkey not found", "error");
        return;
      }
      const id = getReleaseId(alias);
      if (!id) {
        showNotification("Release ID not found", "error");
        return;
      }
      const torrents = await fetchTorrents(id);
      if (torrents.length === 0) {
        showNotification("No HEVC torrent found", "error");
        return;
      }
      await downloadTorrentFile(torrents[0], passkey);
      showNotification("Torrent downloaded", "success");
    } catch (err) {
      console.error(err);
      showNotification(err instanceof Error ? err.message : "Error downloading torrent", "error");
    }
  }
  function processAnchor(anchor) {
    if (anchor.dataset.userscriptProcessed === "true")
      return;
    const href = anchor.getAttribute("href");
    if (!href)
      return;
    const match = href.match(/^\/anime\/releases\/release\/([^/]+)\/episodes/);
    if (!match)
      return;
    const alias = match[1];
    const layout = anchor.querySelector(".v-layout");
    if (!layout)
      return;
    const container = createButtonContainer(alias);
    layout.parentNode?.insertBefore(container, layout.nextSibling);
    anchor.dataset.userscriptProcessed = "true";
  }
  function processAnchors(anchors) {
    for (const anchor of anchors) {
      processAnchor(anchor);
    }
  }
  function init() {
    console.log("init");
    updateAliasMap();
    const anchors = document.querySelectorAll('div.v-list > a[role="listitem"]');
    processAnchors(anchors);
    const listContainer = document.querySelector("div#__nuxt");
    if (listContainer) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              if (el.matches('a[role="listitem"]')) {
                processAnchor(el);
              } else {
                const innerAnchors = el.querySelectorAll('div.v-list > a[role="listitem"]');
                processAnchors(innerAnchors);
              }
            }
          }
        }
        updateAliasMap();
      });
      observer.observe(listContainer, {
        childList: true,
        subtree: true
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
