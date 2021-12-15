/**
 * CSS to hide everything on the page,
 * except for elements that have the "beastify-image" class.
 */
// const truetherPage = "blockquote.dre-block-quote { border: 20px solid green; }";
const truetherPage = "div.dre-block-quote__body { border: 10px solid green; }";

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
    document.addEventListener("click", (e) => {

        /**
         * Given the name of a beast, get the URL to the corresponding image.
         */
        function beastNameToURL(beastName) {
            switch (beastName) {
            case "Frog":
                return browser.runtime.getURL("beasts/frog.jpg");
            case "Snake":
                return browser.runtime.getURL("beasts/snake.jpg");
            case "Turtle":
                return browser.runtime.getURL("beasts/turtle.jpg");
            }
        }

        /**
         * Insert the page-hiding CSS into the active tab,
         * then get the beast URL and
         * send a "beastify" message to the content script in the active tab.
         */
        function truther(tabs) {
            browser.tabs.insertCSS({code: truetherPage});
        }

        /**
         * Remove the page-hiding CSS from the active tab,
         * send a "reset" message to the content script in the active tab.
         */
        function reset(tabs) {
            browser.tabs.removeCSS({code: truetherPage});
        }

        /**
         * Just log the error to the console.
         */
        function reportError(error) {
            console.error(`Could not test truth: ${error}`);
        }

        /**
         * Get the active tab,
         * then call "truther()" or "reset()" as appropriate.
         */
        if (e.target.classList.contains("truth")) {
            browser.tabs.query({active: true, currentWindow: true})
                .then(truther)
                .catch(reportError);
        }
        else if (e.target.classList.contains("reset")) {
            browser.tabs.query({active: true, currentWindow: true})
                .then(reset)
                .catch(reportError);
        }
    });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
    document.querySelector("#popup-content").classList.add("hidden");
    document.querySelector("#error-content").classList.remove("hidden");
    console.error(`Failed to execute beastify content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content_scripts/truther.js"})
    .then(listenForClicks)
    .catch(reportExecuteScriptError);
