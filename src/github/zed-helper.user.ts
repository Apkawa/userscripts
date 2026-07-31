// ==UserScript==
// @name         Zed download helpers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds copy buttons to download links for Zed releases, generates aria2c input
// @author       UserScript
// @match        https://github.com/zed-industries/zed/releases/*
// ==/UserScript==

(() => {
  "use strict";

  // ---- Конфигурация ----
  const REPO = "zed-industries/zed";
  const DOWNLOAD_PATH = "/zed-industries/zed/releases/download/";
  const GITHUB_API = "https://api.github.com";

  // ---- Типы ----
  interface WorkflowRun {
    run_number: number;
  }

  interface WorkflowRunsResponse {
    total_count: number;
    workflow_runs: WorkflowRun[];
  }

  // ---- Вспомогательные функции ----

  /** Извлечь версию из id секции (release-v1.2.3 → "1.2.3") */
  function extractVersion(sectionId: string): string | null {
    if (!sectionId || !sectionId.startsWith("release-v")) return null;
    return sectionId.replace("release-v", "");
  }

  /** Найти SHA коммита внутри секции релиза */
  function getCommitSha(section: Element): string | null {
    const commitLink = section.querySelector('a[data-hovercard-type="commit"]');
    if (commitLink) {
      const href = commitLink.getAttribute("href");
      if (href) {
        const parts = href.split("/");
        return parts[parts.length - 1];
      }
    }
    // fallback: поиск по href, содержащему "/commit/"
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

  /** Получить run_number через GitHub API */
  async function fetchRunNumber(commitSha: string): Promise<number> {
    const url = `${GITHUB_API}/repos/${REPO}/actions/workflows/release.yml/runs?head_sha=${commitSha}&per_page=5&status=completed`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    const data: WorkflowRunsResponse = await response.json();
    if (data.workflow_runs && data.workflow_runs.length > 0) {
      return data.workflow_runs[0].run_number;
    }
    throw new Error("No workflow run found for this commit");
  }

  /**
   * Разделяет имя файла на базовое имя и расширение.
   * Особый случай: .tar.gz обрабатывается как единое расширение.
   */
  function splitFileName(fileName: string): { base: string; ext: string } {
    if (fileName.endsWith(".tar.gz")) {
      return {
        base: fileName.slice(0, -7), // убираем ".tar.gz"
        ext: ".tar.gz",
      };
    }
    const lastDot = fileName.lastIndexOf(".");
    if (lastDot !== -1) {
      return {
        base: fileName.slice(0, lastDot),
        ext: fileName.slice(lastDot),
      };
    }
    // Если расширения нет
    return { base: fileName, ext: "" };
  }

  /** Генерирует имя для параметра out= в aria2c */
  function generateOutName(
    fileName: string,
    version: string,
    runNumber: number,
    commitSha: string,
  ): string {
    const { base, ext } = splitFileName(fileName);
    // Для remote-server
    if (fileName.startsWith("zed-remote-server-")) {
      return `${base}-${version}+stable.${runNumber}.${commitSha}${ext}`;
    }

    // Для всех остальных файлов
    // Если расширение уже содержит точку, оставляем как есть
    return `${base}-v${version}${ext}`;
  }

  // ---- Основная логика кнопки копирования ----

  async function handleCopyClick(button: HTMLElement): Promise<void> {
    // 1. Найти родительскую секцию
    let section = button.closest('section[id^="release-v"]');
    if (!section) {
      // Попробуем подняться выше
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

    // 2. Извлечь версию
    const version = extractVersion(section.id);
    if (!version) {
      alert("Не удалось определить версию");
      return;
    }

    // 3. Получить SHA коммита
    const commitSha = getCommitSha(section);
    if (!commitSha) {
      alert("Не удалось найти SHA коммита");
      return;
    }

    // 4. Состояние загрузки кнопки
    const originalText = button.textContent;
    button.textContent = "⏳";
    button.classList.add("loading");

    try {
      // 5. Получаем run_number
      const runNumber = await fetchRunNumber(commitSha);

      // 6. Собираем все ссылки на скачивание в этой секции
      const downloadLinks = section.querySelectorAll(`a[href^="${DOWNLOAD_PATH}"]`);
      if (downloadLinks.length === 0) {
        alert("Нет ссылок на скачивание в этом релизе");
        return;
      }

      // 7. Формируем текст для aria2c
      const lines: string[] = [];
      for (const link of downloadLinks) {
        const href = link.getAttribute("href");
        if (!href) continue;
        const fullUrl = `https://github.com${href}`;
        const fileName = href.split("/").pop() || "";
        const outName = generateOutName(fileName, version, runNumber, commitSha);
        lines.push(fullUrl);
        lines.push(`    out=${outName}`);
      }
      const copyText = lines.join("\n");

      // 8. Копируем в буфер обмена
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

  // ---- Добавление кнопок к ссылкам ----

  function addCopyButtons(): void {
    const links = document.querySelectorAll(`a[href^="${DOWNLOAD_PATH}"]`);
    for (const link of links) {
      // Пропускаем, если уже есть кнопка
      if (link.nextElementSibling?.classList.contains("copy-download-btn")) {
        continue;
      }
      const button = document.createElement("span");
      button.className = "copy-download-btn";
      button.textContent = "📋";
      button.title = "Скопировать ссылки для aria2c";
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopyClick(button);
      });
      link.parentNode?.insertBefore(button, link.nextSibling);
    }
  }

  // ---- Инициализация ----

  function init(): void {
    addCopyButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Наблюдаем за динамическими изменениями (турбо-навигация, подгрузка)
  const observer = new MutationObserver(() => {
    addCopyButtons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
