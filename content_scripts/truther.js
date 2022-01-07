(function() {
    const relativeSignaturePath = "signatures/";

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
     * Load file from server.
     */
    async function loadFile(filePath) {
        let response = await fetch(filePath);
        if (response.status !== 200) {
            throw response.status;
        }
        return await response.text();
    }

    /**
     * Verifies the signature of a quote. Returns false if either there is no
     * signature, or if the signature doesn't match the quote.
     */
    async function verifyQuote(quote) {
        // Get the location where the signature should be located, and attempt to load it into signature
        let signatueLocation = window.location.href + relativeSignaturePath + quote.getAttribute("signaturefile");
        let signature = await loadFile(signatueLocation);
        signature = signature.trim();
        let hashH = await hashOfContent(quote);
        hashH = hashH.trim();
        return (signature == hashH);
    }

    /**
     * Testing function that allows "varification" of all elements with class
     * "signedQuote" by adding an attribute containing the hash of their content
     * to them.
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
    async function recolourQuotes() {
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
            if (await verifyQuote(quote)) {
                quote.classList.add("true-quote");
            } else {
                quote.classList.add("false-quote");
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
            recolourQuotes();
        } else if (message.command === "verifyQuotes") {
            verifyAll();
        }
    });

})();
