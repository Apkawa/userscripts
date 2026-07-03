// ==UserScript==
// @name         Civitai QoL helpers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds some QoL helpers to civitai.red
// @author       Apkawa
// @match        https://civitai.com/*
// @match        https://civitai.red/*
// @connect      ://civitai.red
// @connect      ://civitai.com
// @connect      ://*.civitai.red
// @connect      ://*.civitai.com
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/qol-helpers.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/qol-helpers.user.js
// @license      MIT
// ==/UserScript==
// src/utils/error.ts
function getErrorMessage(error) {
  if (error instanceof Error)
    return error.message;
  return String(error);
}

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

// src/civitai.com/qol-helpers.user.ts
(() => {
  function handleError(e) {
    showNotification(`Error: ${e}`);
  }
  function getImageIdFromCard(card) {
    const anchor = card.querySelector('a[href^="/images/"]');
    if (!anchor)
      return null;
    const match = anchor.href.match(/\/images\/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }
  async function fetchPrompt(imageId) {
    const url = "https://civitai.red/api/trpc/image.getGenerationData?input=" + encodeURIComponent(JSON.stringify({ json: { id: imageId, authed: true } }));
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok)
      throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.result?.data?.json?.meta?.prompt || null;
  }
  async function fetchCollections() {
    const url = "https://civitai.red/api/trpc/collection.getAllUser?input=" + encodeURIComponent(JSON.stringify({
      json: {
        permissions: ["ADD", "ADD_REVIEW"],
        type: "Image",
        authed: true
      }
    }));
    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok)
      throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.result?.data?.json || [];
  }
  async function addImageToFirstCollection(imageId) {
    const collections = await fetchCollections();
    if (collections.length === 0) {
      throw new Error("No collections found");
    }
    const first = collections[0];
    const payload = {
      json: {
        imageId,
        type: "Image",
        collections: [
          {
            collectionId: first.id,
            userId: first.userId,
            read: "Private"
          }
        ],
        removeFromCollectionIds: [],
        authed: true
      }
    };
    const resp = await fetch("https://civitai.red/api/trpc/collection.saveItem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!resp.ok)
      throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data?.result?.data?.json?.status !== "added") {
      throw new Error("Failed to add to collection");
    }
  }
  function createButton(icon, title, onClick) {
    const btn = document.createElement("button");
    btn.className = "mantine-focus-auto mantine-active m_8d3f4000        mantine - ActionIcon - root m_87cf2631 mantine - UnstyledButton - root";
    btn.setAttribute("data-variant", "transparent");
    btn.type = "button";
    btn.title = title;
    btn.style.width = "32px";
    btn.style.height = "32px";
    btn.style.backgroundColor = "rgba(0,0,0,0.5)";
    btn.style.borderRadius = "4px";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.color = "white";
    btn.innerHTML = icon;
    btn.addEventListener("click", onClick);
    return btn;
  }
  function getCopyIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="20"
    height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2">
    </rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
  }
  function getCollectionIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg"
    width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round"
    stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
  }
  function getSpinnerIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg"
    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
    <path
    d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24     16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
    /></svg>`;
  }
  function processCard(card) {
    if (card.hasAttribute("data-qol-processed"))
      return;
    card.setAttribute("data-qol-processed", "true");
    const imageId = getImageIdFromCard(card);
    if (!imageId) {
      return;
    }
    console.log("Process: ", imageId);
    const topLeftContainer = card.querySelector(".absolute.left-2.top-2");
    if (!topLeftContainer)
      return;
    let btnGroup = topLeftContainer.querySelector(".qol-btn-group");
    if (!btnGroup) {
      btnGroup = document.createElement("div");
      btnGroup.className = "qol-btn-group flex flex-nowrap items-center gap-1";
      topLeftContainer.prepend(btnGroup);
    }
    const copyBtn = createButton(getCopyIcon(), "Copy Prompt", (e) => {
      async function handler() {
        const btn = e.currentTarget;
        setButtonLoading(btn);
        try {
          if (!imageId) {
            throw new Error("No image_id");
          }
          const prompt = await fetchPrompt(imageId);
          if (!prompt)
            throw new Error("No prompt found");
          await navigator.clipboard.writeText(prompt);
          setButtonSuccess(btn);
          showNotification("Скопировано!");
        } catch (err) {
          const errMessage = getErrorMessage(err);
          showNotification(`Copy prompt failed: ${errMessage}`, { type: "error" });
          setButtonIdle(btn, getCopyIcon());
        }
      }
      handler().catch(handleError);
    });
    btnGroup.appendChild(copyBtn);
    const collectBtn = createButton(getCollectionIcon(), "Add to first collection", (e) => {
      async function handler() {
        const btn = e.currentTarget;
        setButtonLoading(btn);
        try {
          if (!imageId) {
            throw new Error("No image_id");
          }
          await addImageToFirstCollection(imageId);
          setButtonSuccess(btn);
          showNotification(`Add to collection success`);
        } catch (err) {
          const errMessage = getErrorMessage(err);
          showNotification(`Add to collection failed: ${errMessage}`, { type: "error" });
          setButtonIdle(btn, getCollectionIcon());
        }
      }
      handler().catch(handleError);
    });
    btnGroup.appendChild(collectBtn);
  }
  function setButtonLoading(btn) {
    btn.disabled = true;
    btn.innerHTML = getSpinnerIcon();
    btn.style.color = "white";
  }
  function setButtonSuccess(btn) {
    btn.disabled = true;
    btn.innerHTML = "✓";
    btn.style.color = "#4ade80";
    setTimeout(() => {
      setButtonIdle(btn, btn.title === "Copy Prompt" ? getCopyIcon() : getCollectionIcon());
    }, 1500);
  }
  function setButtonIdle(btn, iconHtml) {
    btn.disabled = false;
    btn.innerHTML = iconHtml;
    btn.style.color = "white";
  }
  function scanCards() {
    const cards = document.querySelectorAll('div:has(> a[href^="/images/"])');
    cards.forEach(processCard);
  }
  const observer = new MutationObserver(() => {
    scanCards();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  scanCards();
  setTimeout(scanCards, 1000);
})();
