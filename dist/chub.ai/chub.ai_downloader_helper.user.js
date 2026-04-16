// ==UserScript==
// @name         Chub.ai Image Downloader v2
// @namespace    http://tampermonkey.net/
// @version      2026-04-11
// @description  Adds a download button to character avatars/cards and lorebooks
// @author       Apkawa
// @match        https://chub.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chub.ai
// @grant        none
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/chub.ai_downloader_helper.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/chub.ai_downloader_helper.user.js
// @license      MIT
// ==/UserScript==
// src/chub.ai/chub.ai_downloader_helper.user.ts
(function() {
  async function downloadImage(url, filename) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(600000) });
      if (!response.ok)
        throw new Error("Network response was not ok");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed, opening in new tab instead", error);
      window.open(url, "_blank");
    }
  }
  function processImages() {
    const imgs = document.querySelectorAll('img[src*="avatars.charhub.io/avatars/"]');
    imgs.forEach((img) => {
      if (img.dataset.downloaderAdded)
        return;
      const src = img.src;
      if (src.startsWith("https://avatars.charhub.io/avatars/Anonymous/example-character/") || src.startsWith("https://avatars.charhub.io/avatars/users/avatars/plain/"))
        return;
      const urlParts = src.split("/");
      if (urlParts.length < 6)
        return;
      let username = "";
      let name = "";
      let downloadUrl = "";
      let filename = "";
      let isLorebook = false;
      if (urlParts[4] === "lorebooks") {
        isLorebook = true;
        username = urlParts[5];
        name = urlParts[6];
        filename = `lorebook_${name}__${username}.json`;
      } else {
        username = urlParts[4];
        name = urlParts[5];
        downloadUrl = src.substring(0, src.lastIndexOf("/") + 1) + "chara_card_v2.png";
        filename = `${name}__${username}_spec_v2.png`;
      }
      const parent = img.parentElement;
      if (!parent)
        return;
      const style = window.getComputedStyle(parent);
      if (style.position === "static") {
        parent.style.position = "relative";
      }
      const btn = document.createElement("button");
      btn.innerHTML = "⬇️";
      btn.title = `Download ${filename}`;
      btn.style.cssText = `
                position: absolute;
                bottom: 5px;
                right: 5px;
                z-index: 2147483647;
                padding: 4px 8px;
                background: rgba(0, 0, 0, 0.6);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                line-height: 1;
                pointer-events: auto;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
      if (isLorebook) {
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          btn.disabled = true;
          btn.innerHTML = "⏳";
          try {
            const idResponse = await fetch(`https://gateway.chub.ai/api/lorebooks/${username}/${name}`);
            if (!idResponse.ok)
              throw new Error("Failed to fetch lorebook ID");
            const idData = await idResponse.json();
            if (!idData.node || !idData.node.id)
              throw new Error("Lorebook ID not found in API response");
            const id = idData.node.id;
            const finalDownloadUrl = `https://gateway.chub.ai/api/v4/projects/${id}/repository/files/raw%252Fsillytavern_raw.json/raw?ref=main&response_type=blob`;
            await downloadImage(finalDownloadUrl, filename);
          } catch (error) {
            console.error("Lorebook download error:", error);
            alert("Error downloading lorebook. Check console for details.");
          } finally {
            btn.disabled = false;
            btn.innerHTML = "⬇️";
          }
        };
      } else {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          downloadImage(downloadUrl, filename);
        };
      }
      parent.appendChild(btn);
      img.dataset.downloaderAdded = "true";
    });
  }
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        processImages();
        break;
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  processImages();
})();
