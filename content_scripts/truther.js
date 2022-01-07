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

    /*
     * Calculates and return the hash of the content of a DOM element.
     */
    async function hashOfContent(element) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(element.textContent));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }


    /**
     * Testing function that "verifies" all blockquotes by adding an attribute
     * containing the hash of their content to them.
     */
    async function verifyAll() {
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            const hashH = await hashOfContent(quote);
            quote.setAttribute("contentHash", hashH);
        }
    }


    /**
     * Go over every blockqoute, changing its style to green, and saving its
     * previous color.
     */
    async function recolourTruths() {
        let existingQuotes = document.querySelectorAll("blockquote");
        for (let quote of existingQuotes) {
            if (quote.hasAttribute('contentHash')) {
                if (!quote.hasAttribute('style-old')) {
                    quote.setAttribute("style-old", quote.getAttribute("style"));
                }
                const hashH = await hashOfContent(quote);
                const contentHash = quote.getAttribute("contentHash");
                if (hashH === contentHash) {
                    quote.setAttribute("style", "border-color:#00FF00");
                    quote.classList.add("true-quote");
                } else {
                    quote.setAttribute("style", "border-color:#FF0000");
                    quote.classList.add("false-quote");
                }
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
            quote.classList.remove("true-quote", "false-quote");
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
