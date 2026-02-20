(() => {
    "use strict";
    function search(event) {
        console.log(event);
    }
    GM_registerMenuCommand("Image search on pixiv", search);
})();