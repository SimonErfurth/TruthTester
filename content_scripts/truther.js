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
     * Testing function that "verifies" all elements with class "signedQuote" by adding an attribute
     * containing the hash of their content to them.
     */
    async function verifyAll() {
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
            const hashH = await hashOfContent(quote);
            quote.setAttribute("contentHash", hashH);
        }
    }


    /**
     * Go over every element with class "signedQuote", verify if it is
     * authentic, and change it's colour accordingly.
     */
    async function recolourTruths() {
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
            if (quote.hasAttribute('contentHash')) {
                const hashH = await hashOfContent(quote);
                const contentHash = quote.getAttribute("contentHash");
                if (hashH === contentHash) {
                    quote.classList.add("true-quote");
                } else {
                    quote.classList.add("false-quote");
                }
            }
        }
    }

    /**
     * Go over every element with class "signedQuote", and remove it's truth
     * state.
     */
    function removeTruths() {
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
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
