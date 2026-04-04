// ==UserScript==
// @name         Hugging Face Download Links to aria2c
// @namespace    https://github.com/yourname
// @version      1.0
// @description  Adds a button next to download links on huggingface.co to copy an aria2c command line.
// @author       Apkawa
// @match        https://huggingface.co/*
// @grant        GM_addStyle
// @grant        GM_notification
// @homepage     https://github.com/Apkawa/userscripts
// @homepageURL  https://github.com/Apkawa/userscripts
// @supportURL   https://github.com/Apkawa/userscripts/issues
// @downloadURL  https://github.com/Apkawa/userscripts/raw/master/dist/huggingface.co/copy-download-link-as-aria2c.user.js
// @updateURL    https://github.com/Apkawa/userscripts/raw/master/dist/huggingface.co/copy-download-link-as-aria2c.user.js
// @license      MIT
// ==/UserScript==
(() => {
    // ==UserScript==
    // @name         Hugging Face Download Links to aria2c
    // @namespace    https://github.com/yourname
    // @version      1.0
    // @description  Adds a button next to download links on huggingface.co to copy an aria2c command line.
    // @author       YourName
    // @match        https://huggingface.co/*
    // @grant        GM_addStyle
    // @grant        GM_notification
    // ==/UserScript==
    (function() {
        "use strict";
        // ========== Styles for the button ==========
                GM_addStyle(`\n        .aria2c-copy-btn {\n            margin-left: 8px;\n            padding: 2px 6px;\n            font-size: 12px;\n            cursor: pointer;\n            border: 1px solid #ccc;\n            border-radius: 4px;\n            background-color: #f0f0f0;\n            color: #333;\n            display: inline-block;\n            line-height: 1.2;\n        }\n        .aria2c-copy-btn:hover {\n            background-color: #e0e0e0;\n        }\n    `);
        // ========== Helper functions ==========
                function getOwnerAndFilename(url) {
            try {
                const parsed = new URL(url);
                const pathParts = parsed.pathname.split("/").filter(p => p);
                const owner = pathParts[0] || "unknown";
                const filename = pathParts[pathParts.length - 1] || "file";
                return {
                    owner,
                    filename
                };
            } catch (e) {
                console.warn("Failed to parse URL:", url, e);
                return {
                    owner: "unknown",
                    filename: "file"
                };
            }
        }
        async function generateAria2cText(originalUrl) {
            const url = new URL(originalUrl, window.location.href);
            if (url.searchParams.get("download") !== "true") url.searchParams.set("download", "true");
            const finalUrl = url.toString();
            const {owner, filename} = getOwnerAndFilename(finalUrl);
            return `${finalUrl}\n    out=${owner}_${filename}`;
        }
        async function copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                if (typeof GM_notification !== "undefined") GM_notification({
                    text: "aria2c command copied to clipboard!",
                    timeout: 2e3,
                    title: "Copied"
                }); else {
                    const msg = document.createElement("div");
                    msg.textContent = "✓ aria2c command copied!";
                    msg.style.position = "fixed";
                    msg.style.bottom = "20px";
                    msg.style.right = "20px";
                    msg.style.backgroundColor = "#4caf50";
                    msg.style.color = "white";
                    msg.style.padding = "8px 12px";
                    msg.style.borderRadius = "4px";
                    msg.style.zIndex = "10000";
                    msg.style.fontSize = "14px";
                    document.body.appendChild(msg);
                    setTimeout(() => msg.remove(), 2e3);
                }
            } catch (err) {
                console.error("Failed to copy:", err);
                alert("Failed to copy to clipboard. See console for details.");
            }
        }
        function isDownloadLink(link) {
            if (link.hasAttribute("download")) return true;
            try {
                const url = new URL(link.href, window.location.href);
                return url.searchParams.get("download") === "true";
            } catch (e) {
                return false;
            }
        }
        function addButtonToLink(link) {
            if (link.hasAttribute("data-aria2c-processed")) return;
            link.setAttribute("data-aria2c-processed", "true");
            const button = document.createElement("button");
            button.textContent = "📋 aria2c";
            button.className = "aria2c-copy-btn";
            button.addEventListener("click", async event => {
                event.stopPropagation();
                const text = await generateAria2cText(link.href);
                await copyToClipboard(text);
            });
            link.insertAdjacentElement("afterend", button);
        }
        function processLinks(links) {
            for (const link of links) if (isDownloadLink(link)) addButtonToLink(link);
        }
        function findAnchorsInNode(node) {
            let anchors = [];
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === "A") anchors.push(node);
                node.querySelectorAll("a").forEach(a => anchors.push(a));
            }
            return anchors;
        }
        function processAllLinks() {
            const allLinks = document.querySelectorAll("a");
            processLinks(allLinks);
        }
        // ========== MutationObserver for dynamic content ==========
                const observer = new MutationObserver(mutations => {
            const newLinks = [];
            for (const mutation of mutations) for (const addedNode of mutation.addedNodes) {
                const anchors = findAnchorsInNode(addedNode);
                for (const a of anchors) if (!a.hasAttribute("data-aria2c-processed")) newLinks.push(a);
            }
            if (newLinks.length) processLinks(newLinks);
        });
        window.addEventListener("load", () => {
            processAllLinks();
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    })();
})();