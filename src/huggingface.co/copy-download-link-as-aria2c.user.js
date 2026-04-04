// ==UserScript==
// @name         Hugging Face Download Links to aria2c
// @namespace    https://github.com/yourname
// @version      1.0
// @description  Adds a button next to download links on huggingface.co to copy an aria2c command line.
// @author       YourName
// @match        https://huggingface.co/*
// @grant        GM_addStyle
// @grant        GM_notification
//
// ==/UserScript==

(function () {
  'use strict';

  // ========== Styles for the button ==========
  GM_addStyle(`
        .aria2c-copy-btn {
            margin-left: 8px;
            padding: 2px 6px;
            font-size: 12px;
            cursor: pointer;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: #f0f0f0;
            color: #333;
            display: inline-block;
            line-height: 1.2;
        }
        .aria2c-copy-btn:hover {
            background-color: #e0e0e0;
        }
    `);

  // ========== Helper functions ==========
  /**
   * Extracts repository owner and file name from a download URL.
   * @param {string} url - The download URL.
   * @returns {{owner: string, filename: string}} The owner and filename.
   */
  function getOwnerAndFilename(url) {
    try {
      const parsed = new URL(url);
      const pathParts = parsed.pathname.split('/').filter((p) => p);
      // Expected path: /owner/repo/resolve/revision/.../filename
      // Owner is the first part
      const owner = pathParts[0] || 'unknown';
      // Filename is the last part of the path
      const filename = pathParts[pathParts.length - 1] || 'file';
      return {owner, filename};
    } catch (e) {
      console.warn('Failed to parse URL:', url, e);
      return {owner: 'unknown', filename: 'file'};
    }
  }

  /**
   * Generates the aria2c format text for a given download URL.
   * @param {string} originalUrl - The original href of the link.
   * @returns {string} The text to copy.
   */
  async function generateAria2cText(originalUrl) {
    // Resolve relative URLs
    const url = new URL(originalUrl, window.location.href);
    // Ensure download=true parameter is present
    if (url.searchParams.get('download') !== 'true') {
      url.searchParams.set('download', 'true');
    }
    const finalUrl = url.toString();

    const {owner, filename} = getOwnerAndFilename(finalUrl);
    return `${finalUrl}\n    out=${owner}_${filename}`;
  }

  /**
   * Copies text to clipboard and shows a notification.
   * @param {string} text - The text to copy.
   */
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      // Use GM_notification if available, otherwise fallback to alert
      if (typeof GM_notification !== 'undefined') {
        GM_notification({
          text: 'aria2c command copied to clipboard!',
          timeout: 2000,
          title: 'Copied',
        });
      } else {
        const msg = document.createElement('div');
        msg.textContent = '✓ aria2c command copied!';
        msg.style.position = 'fixed';
        msg.style.bottom = '20px';
        msg.style.right = '20px';
        msg.style.backgroundColor = '#4caf50';
        msg.style.color = 'white';
        msg.style.padding = '8px 12px';
        msg.style.borderRadius = '4px';
        msg.style.zIndex = '10000';
        msg.style.fontSize = '14px';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. See console for details.');
    }
  }

  /**
   * Checks if a link is a download link.
   * @param {HTMLAnchorElement} link - The anchor element.
   * @returns {boolean} True if it should be considered a download link.
   */
  function isDownloadLink(link) {
    // Condition 1: has download attribute
    if (link.hasAttribute('download')) return true;

    // Condition 2: href contains ?download=true (as a parameter)
    try {
      const url = new URL(link.href, window.location.href);
      return url.searchParams.get('download') === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Adds a copy button next to a download link if not already present.
   * @param {HTMLAnchorElement} link - The anchor element.
   */
  function addButtonToLink(link) {
    // Avoid duplicate processing
    if (link.hasAttribute('data-aria2c-processed')) return;
    link.setAttribute('data-aria2c-processed', 'true');

    // Create the button
    const button = document.createElement('button');
    button.textContent = '📋 aria2c';
    button.className = 'aria2c-copy-btn';

    // Attach click handler
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      const text = await generateAria2cText(link.href);
      await copyToClipboard(text);
    });

    // Insert after the link
    link.insertAdjacentElement('afterend', button);
  }

  /**
   * Process a collection of links: add buttons to those that are download links.
   * @param {NodeList|Array<HTMLAnchorElement>} links - The links to process.
   */
  function processLinks(links) {
    for (const link of links) {
      if (isDownloadLink(link)) {
        addButtonToLink(link);
      }
    }
  }

  /**
   * Recursively find all <a> elements inside a given node.
   * @param {Node} node - The root node.
   * @returns {Array<HTMLAnchorElement>} Array of anchor elements.
   */
  function findAnchorsInNode(node) {
    let anchors = [];
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName === 'A') {
        anchors.push(node);
      }
      // Recursively collect from children
      node.querySelectorAll('a').forEach((a) => anchors.push(a));
    }
    return anchors;
  }

  /**
   * Process all download links on the page (for initial load).
   */
  function processAllLinks() {
    const allLinks = document.querySelectorAll('a');
    processLinks(allLinks);
  }

  // ========== MutationObserver for dynamic content ==========
  const observer = new MutationObserver((mutations) => {
    const newLinks = [];
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        const anchors = findAnchorsInNode(addedNode);
        for (const a of anchors) {
          // Avoid reprocessing already handled links
          if (!a.hasAttribute('data-aria2c-processed')) {
            newLinks.push(a);
          }
        }
      }
    }
    if (newLinks.length) {
      processLinks(newLinks);
    }
  });

  // Start observing after page load
  window.addEventListener('load', () => {
    processAllLinks();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
})();
