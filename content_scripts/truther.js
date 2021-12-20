(function() {
    /**
     * Check and set a global guard variable.
     * If this content script is injected into the same page again,
     * it will do nothing next time.
     */
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    /**
     * Go over every blockqoute, changing its style to green, and saving its
     * previous color.
     */
    function recolourTruths() {
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            quote.setAttribute("style-old", quote.getAttribute("style"));
            quote.setAttribute("style", "border-color:#00FF00");
        }
    }
    
    /**
     * Go over every blockqoute with the class "dre-block-quote", and change its style to style-old
     */
    function removeTruths() {
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            quote.setAttribute("style", quote.getAttribute("style-old"));
            quote.removeAttribute("style-old");
        }
    }

    /**
     * Listen for messages from the background script.
     * Call corresponding function
     */
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "quoteKill") {
            removeTruths();
        } else if (message.command === "quoteRecolour") {
            recolourTruths();
        }
    });

})();
