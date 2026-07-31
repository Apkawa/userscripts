// ==UserScript==
// @name         Zed download helpers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds copy buttons to download links for Zed releases, generates aria2c input
// @author       Apkawa
// @match        https://github.com/zed-industries/zed/releases/*
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/zed-helper.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/zed-helper.user.js
// @license      MIT
// ==/UserScript==
// src/github/zed-helper.user.ts
(() => {
  const REPO = "zed-industries/zed";
  const DOWNLOAD_PATH = "/zed-industries/zed/releases/download/";
  const GITHUB_API = "https://api.github.com";
  function extractVersion(sectionId) {
    if (!sectionId || !sectionId.startsWith("release-v"))
      return null;
    return sectionId.replace("release-v", "");
  }
  function getCommitSha(section) {
    const commitLink = section.querySelector('a[data-hovercard-type="commit"]');
    if (commitLink) {
      const href = commitLink.getAttribute("href");
      if (href) {
        const parts = href.split("/");
        return parts[parts.length - 1];
      }
    }
    const fallback = section.querySelector('a[href*="/commit/"]');
    if (fallback) {
      const href = fallback.getAttribute("href");
      if (href) {
        const parts = href.split("/");
        return parts[parts.length - 1];
      }
    }
    return null;
  }
  async function fetchRunNumber(commitSha) {
    const url = `${GITHUB_API}/repos/${REPO}/actions/workflows/release.yml/runs?head_sha=${commitSha}&per_page=5&status=completed`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.workflow_runs && data.workflow_runs.length > 0) {
      return data.workflow_runs[0].run_number;
    }
    throw new Error("No workflow run found for this commit");
  }
  function splitFileName(fileName) {
    if (fileName.endsWith(".tar.gz")) {
      return {
        base: fileName.slice(0, -7),
        ext: ".tar.gz"
      };
    }
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot !== -1) {
      return {
        base: fileName.slice(0, lastDot),
        ext: fileName.slice(lastDot)
      };
    }
    return { base: fileName, ext: "" };
  }
  function generateOutName(fileName, version, runNumber, commitSha) {
    const { base, ext } = splitFileName(fileName);
    if (fileName.startsWith("zed-remote-server-")) {
      return `${base}-${version}+stable.${runNumber}.${commitSha}${ext}`;
    }
    return `${base}-v${version}${ext}`;
  }
  async function handleCopyClick(button) {
    let section = button.closest('section[id^="release-v"]');
    if (!section) {
      let el = button.parentElement;
      while (el && el !== document.body) {
        if (el.tagName === "SECTION" && el.id && el.id.startsWith("release-v")) {
          section = el;
          break;
        }
        el = el.parentElement;
      }
    }
    if (!section) {
      console.error("Не удалось найти секцию релиза");
      alert("Не удалось найти секцию релиза");
      return;
    }
    const version = extractVersion(section.id);
    if (!version) {
      alert("Не удалось определить версию");
      return;
    }
    const commitSha = getCommitSha(section);
    if (!commitSha) {
      alert("Не удалось найти SHA коммита");
      return;
    }
    const originalText = button.textContent;
    button.textContent = "⏳";
    button.classList.add("loading");
    try {
      const runNumber = await fetchRunNumber(commitSha);
      const downloadLinks = section.querySelectorAll(`a[href^="${DOWNLOAD_PATH}"]`);
      if (downloadLinks.length === 0) {
        alert("Нет ссылок на скачивание в этом релизе");
        return;
      }
      const lines = [];
      for (const link of downloadLinks) {
        const href = link.getAttribute("href");
        if (!href)
          continue;
        const fullUrl = `https://github.com${href}`;
        const fileName = href.split("/").pop() || "";
        const outName = generateOutName(fileName, version, runNumber, commitSha);
        lines.push(fullUrl);
        lines.push(`    out=${outName}`);
      }
      const copyText = lines.join(`
`);
      await navigator.clipboard.writeText(copyText);
      button.textContent = "✓";
      button.classList.add("copied");
      setTimeout(() => {
        button.textContent = originalText;
        button.classList.remove("copied");
      }, 2000);
    } catch (error) {
      console.error("Ошибка:", error);
      alert(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
      button.textContent = originalText;
    } finally {
      button.classList.remove("loading");
    }
  }
  function addCopyButtons() {
    const links = document.querySelectorAll(`a[href^="${DOWNLOAD_PATH}"]`);
    for (const link of links) {
      if (link.nextElementSibling?.classList.contains("copy-download-btn")) {
        continue;
      }
      const button = document.createElement("span");
      button.className = "copy-download-btn";
      button.textContent = "\uD83D\uDCCB";
      button.title = "Скопировать ссылки для aria2c";
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopyClick(button);
      });
      link.parentNode?.insertBefore(button, link.nextSibling);
    }
  }
  function init() {
    addCopyButtons();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  const observer = new MutationObserver(() => {
    addCopyButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
