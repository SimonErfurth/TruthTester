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
     * Testing function that "verifies" all blockquotes by adding an attribute
     * containing the hash of their content to them.
     */
    async function verifyAll() {
        const encoder = new TextEncoder();
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(quote.textContent));
            hashArray = Array.from(new Uint8Array(hashBuffer));
            hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            quote.setAttribute("contentHash", hashHex);
        }
    }

    
    /**
     * Go over every blockqoute, changing its style to green, and saving its
     * previous color.
     */
    async function recolourTruths() {
        const encoder = new TextEncoder();
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            quote.setAttribute("style-old", quote.getAttribute("style"));
            hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(quote.textContent));
            hashArray = Array.from(new Uint8Array(hashBuffer));
            hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            contentHash = quote.getAttribute("contentHash");
            if (hashHex === contentHash) {
                quote.setAttribute("style", "border-color:#00FF00");
            } else if (!contentHash) {
                quote.setAttribute("style", "border-color:#AAAAAA");
            } else {
                quote.setAttribute("style", "border-color:#FF0000");
            }
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
        } else if (message.command === "verifyQuotes") {
            verifyAll();
        }
    });

})();
