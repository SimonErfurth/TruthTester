/**
 * CSS to insert green boxes around `div.dre-block-quote` elements
 */
const truetherPage = `.verified-quote { background-color: lightgreen; }      
.rejected-quote { background-color: red; }`;

/**
 * Listen for clicks on the buttons, and inserts/removes the appropriate CSS code
 */
function listenForClicks() {
    document.addEventListener("click", (e) => {

        /**
         * Insert the page-modifying CSS into the active tab
         */
        function verifier(tabs) {
            browser.tabs.insertCSS({ code: truetherPage }).then(() => {
                browser.tabs.sendMessage(tabs[0].id, {
                    command: "verifyElements",
                });
            });
        }

        /**
         * Remove the page-modifying CSS from the active tab
         */
        function reset(tabs) {
            browser.tabs.removeCSS({ code: truetherPage }).then(() => {
                browser.tabs.sendMessage(tabs[0].id, {
                    command: "resetAll",
                });
            });
        }

        /**
         * Just log the error to the console.
         */
        function reportError(error) {
            console.error(`Could not test authenticity: ${error}`);
        }

        /**
         * Get the active tab,
         * then call "verifier()" or "reset()" as appropriate.
         */
        if (e.target.classList.contains("authentify")) {
            browser.tabs.query({ active: true, currentWindow: true })
                .then(verifier)
                .catch(reportError);
        } else if (e.target.classList.contains("reset")) {
            browser.tabs.query({ active: true, currentWindow: true })
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
    console.error(`Failed to execute truther content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({ file: "/content_scripts/truther.js" })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);
