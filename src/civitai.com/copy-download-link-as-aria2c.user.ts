// ==UserScript==
// @name         Civitai Aria2c Copy Button
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds aria2c direct link copy button to civitai.com
// @author       UserScript
// @match        https://civitai.com/*
// @match        https://civitai.red/*
// @grant        GM_xmlhttpRequest
// @connect      ://civitai.red
// @connect      ://civitai.com
// @connect      ://*.civitai.red
// @connect      ://*.civitai.com
// ==/UserScript==

import { showNotification } from "@app/utils/ui/notification";
import { getErrorMessage } from "@app/utils/error";

(() => {
  // Конфигурация
  const DOWNLOAD_SELECTOR = 'a[href^="/api/download/"]';
  const PROCESSED_ATTR = "data-aria2c-processed";
  const BUTTON_TEXT = "📋 aria2c";

  declare const __NEXT_DATA__: {
    buildId: string;
  };
  /**
   * Лениво получаем buildId из Next.js.
   * __NEXT_DATA__ — глобальная переменная, установленная страницей,
   * поэтому читаем её только при необходимости (не на уровне модуля).
   */
  function getBuildId(): string | null {
    return __NEXT_DATA__?.buildId ?? null;
  }

  /**
   * Извлечение имени файла из content-disposition query-параметра
   * Например: attachment; filename="animayume_v05.safetensors"
   */
  function getFilenameFromContentDisposition(decodedValue: string): string | null {
    // Ищем паттерн filename="..." или filename='...'
    const regex = /filename\s*=\s*["']?([^"';\s]+)/i;
    const match = decodedValue.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Извлечение имени файла из конечного URL:
   * 1. Сначала пытаемся извлечь из response-content-disposition query-параметра
   * 2. Фоллбэк — последний сегмент пути
   */
  function getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // 1. Пробуем найти query-параметр, значение которого
      // содержит Content-Disposition с именем файла
      let cdParam: string | null = null;
      for (const [, value] of urlObj.searchParams) {
        const decoded = decodeURIComponent(value);
        const filename = getFilenameFromContentDisposition(decoded);
        if (filename) {
          return filename;
        }
      }

      // 2. Фоллбэк — последний сегмент пути
      let pathname = urlObj.pathname;
      // Убираем завершающий слэш, если есть
      if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
      const segments = pathname.split("/");
      let filename = segments.pop() || "";
      // Декодируем URL-кодировку (например, %20 -> пробел)
      filename = decodeURIComponent(filename);
      return filename;
    } catch (e) {
      console.error("Error parsing URL for filename:", e);
      return "unknown_file";
    }
  }

  /**
   * Извлечение model_id и model_slug из URL текущей страницы
   * Формат: https://civitai.red/models/<model_id>/<model_slug>
   */
  function parseCurrentPageUrl(): { modelId: string; modelSlug: string } | null {
    try {
      const url = new URL(window.location.href);
      const segments = url.pathname.split("/");
      // pathname: /models/<model_id>/<model_slug>
      const modelsIndex = segments.indexOf("models");
      if (modelsIndex === -1 || modelsIndex + 2 >= segments.length) return null;
      return {
        modelId: segments[modelsIndex + 1],
        modelSlug: segments[modelsIndex + 2],
      };
    } catch (e) {
      console.error("Error parsing current page URL:", e);
      return null;
    }
  }

  /**
   * Извлечение submodel_id и fileId из URL ссылки на скачивание
   * Формат: https://civitai.red/api/download/models/<submodel_id>?fileId=<file_id>
   */
  function parseDownloadUrl(originalUrl: string): { submodelId: string; fileId: string } | null {
    try {
      const url = new URL(originalUrl, window.location.origin);
      const segments = url.pathname.split("/");
      // pathname: /api/download/models/<submodel_id>
      const modelsIndex = segments.indexOf("models");
      if (modelsIndex === -1 || modelsIndex + 1 >= segments.length) return null;
      const submodelId = segments[modelsIndex + 1];
      const fileId = url.searchParams.get("fileId");
      if (!submodelId || !fileId) return null;
      return { submodelId, fileId };
    } catch (e) {
      console.error("Error parsing download URL:", e);
      return null;
    }
  }

  /**
   * Основная функция получения прямой ссылки и копирования в формате aria2c
   */
  async function handleCopy(linkElement: HTMLAnchorElement, originalUrl: string): Promise<void> {
    const absoluteUrl = new URL(originalUrl, window.location.origin).href;
    const downloadInfo = parseDownloadUrl(originalUrl);

    try {
      showNotification("Получение прямой ссылки...");

      // Сначала получаем имя файла из API (до HEAD-запроса)
      let filename = await getFilenameFromApiByDownloadInfo(downloadInfo);

      const finalUrl = await new Promise<string>((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "HEAD",
          url: absoluteUrl,
          onload: (response) => {
            // response.finalUrl содержит URL после всех редиректов
            resolve(response.finalUrl || response.url);
          },
          onerror: (error) => {
            reject(error);
          },
        });
      });

      // Фоллбэк — из CDN URL, если API не вернул имя
      if (!filename) {
        filename = getFilenameFromUrl(finalUrl);
      }
      // Сохраняем текущую страницу в комметарии
      // т.к. ссылка на скачивание может протухнуть и надо снова перекопировать
      const currentPage = window.location.href;
      const aria2cText = `# ${currentPage}\n${finalUrl}\n    out=${filename}`;
      await navigator.clipboard.writeText(aria2cText);
      showNotification(`Скопировано! ${filename}`);
    } catch (error) {
      console.error("Ошибка при получении ссылки:", error);
      showNotification(`Ошибка: ${getErrorMessage(error)}`, { type: "error" });
    }
  }

  /**
   * Получение имени файла из API по информации о скачивании
   */
  async function getFilenameFromApiByDownloadInfo(
    downloadInfo: { submodelId: string; fileId: string } | null,
  ): Promise<string | null> {
    if (!downloadInfo) return null;

    const pageInfo = parseCurrentPageUrl();
    if (!pageInfo) {
      console.warn("Could not parse current page URL for model info");
      return null;
    }

    const buildId = getBuildId();
    if (!buildId) {
      console.warn("buildId not found in window.__NEXT_DATA__");
      return null;
    }

    const apiUrl = `${window.location.origin}/_next/data/${buildId}/en/models/${pageInfo.modelId}/${pageInfo.modelSlug}.json?id=${pageInfo.modelId}&slug=${pageInfo.modelSlug}`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.warn(`API request failed: ${response.status}`);
        return null;
      }

      const data = await response.json();

      // Путь: pageProps.trpcState.json.queries[].state.data.modelVersions[].files[]
      const trpcState = data?.pageProps?.trpcState?.json?.queries;
      if (!trpcState || !Array.isArray(trpcState)) {
        console.warn("Unexpected API response structure: no queries array");
        return null;
      }

      for (const query of trpcState) {
        const modelVersions = query?.state?.data?.modelVersions;
        if (!Array.isArray(modelVersions)) continue;

        for (const version of modelVersions) {
          // Сравниваем по id версии (submodel_id)
          if (String(version.id) !== String(downloadInfo.submodelId)) continue;

          const files = version?.files;
          if (!Array.isArray(files)) continue;

          for (const file of files) {
            // Сравниваем по id файла
            if (String(file.id) === String(downloadInfo.fileId)) {
              return file.name || null;
            }
          }
        }
      }

      console.warn("File not found in API response");
      return null;
    } catch (error) {
      console.error(`Error fetching filename from API: ${getErrorMessage(error)}`);
      return null;
    }
  }

  /**
   * Создание кнопки и вставка рядом с элементом <a>
   */
  function addButtonToLink(linkElement: HTMLAnchorElement): void {
    if (linkElement.hasAttribute(PROCESSED_ATTR)) return;
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

    button.addEventListener("mouseenter", () => (button.style.backgroundColor = "#555"));
    button.addEventListener("mouseleave", () => (button.style.backgroundColor = "#2c2c2c"));

    // Обработчик клика
    button.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const href = linkElement.getAttribute("href");
      if (href) {
        void handleCopy(linkElement, href);
      }
    });

    // Вставляем кнопку после ссылки (оборачиваем при необходимости)
    const parent = linkElement.parentNode;
    if (parent && parent.tagName !== "BUTTON") {
      // Если ссылка находится внутри контейнера, который может ломать inline-расположение,
      // пробуем вставить как соседний элемент
      if (linkElement.nextSibling) {
        parent.insertBefore(button, linkElement.nextSibling);
      } else {
        parent.appendChild(button);
      }
    } else {
      // Запасной вариант: вставить после ссылки в любом случае
      linkElement.insertAdjacentElement("afterend", button);
    }
  }

  /**
   * Обработка всех существующих и новых ссылок
   */
  function processAllLinks(): void {
    const links = document.querySelectorAll<HTMLAnchorElement>(DOWNLOAD_SELECTOR);
    links.forEach(addButtonToLink);
  }

  /**
   * Настройка MutationObserver для отслеживания динамических изменений в DOM (SPA)
   */
  function observeDOMChanges(): void {
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

  /**
   * Инициализация скрипта
   */
  function init(): void {
    processAllLinks();
    observeDOMChanges();
  }

  // Запуск после полной загрузки DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
