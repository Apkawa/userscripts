(() => {
    "use strict";
    function waitElement(match, callback, root = document.body) {
        const observer = new MutationObserver(mutations => {
            let matchFlag = false;
            mutations.forEach(mutation => {
                if (!mutation.addedNodes) return;
                for (let i = 0; i < mutation.addedNodes.length; i++) {
                    const node = mutation.addedNodes[i];
                    matchFlag = match(node);
                }
            });
            if (matchFlag) {
                _stop();
                callback();
                _start();
            }
        });
        let isStarted = false;
        function _start() {
            if (isStarted) return;
            observer.observe(root || document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
            isStarted = true;
        }
        function _stop() {
            observer.disconnect();
            isStarted = false;
        }
        _start();
        return () => {
            _stop();
        };
    }
    function isFunction(x) {
        return typeof x === "function";
    }
    function matchLocation(...patterns) {
        const s = document.location.href;
        for (const p of patterns) {
            if (isFunction(p) && p(s)) return true;
            if (RegExp(p).test(s)) return true;
        }
        return false;
    }
    Object.keys;
    Object.entries;
    Object.values;
    (function() {
        "use strict";
        if (!matchLocation("^https://pikabu.ru/.*")) return;
        function isImage(event) {
            if (!event.target) return false;
            const target = event.target;
            return target.querySelector(".image-loaded") || target.classList.contains("image-loaded");
        }
        window.addEventListener("contextmenu", function(event) {
            if (isImage(event)) event.stopImmediatePropagation();
        }, true);
        window.addEventListener("mouseenter", function(event) {
            if (isImage(event)) event.stopImmediatePropagation();
        }, true);
        waitElement(el => {
            const _el = el;
            return Boolean(_el.querySelectorAll && _el.querySelectorAll("img[data-watermarked='1']"));
        }, () => {
            const elList = document.querySelectorAll("img[data-watermarked='1']");
            for (const el of elList) el.remove();
        });
    })();
})();