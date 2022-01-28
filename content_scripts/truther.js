(function() {
    const relativeSignaturePath = "signatures/";
    const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384", hash: {name: "SHA-256"}, };

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
     * Calculates and return the hash of the string
     */
    async function hashOfContent(element) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(element));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Load file from server.
     */
    async function loadFile(filePath) {
        let response = await fetch(filePath, {cache: "no-cache"});
        if (response.status !== 200) {
            throw response.status;
        }
        return await response.text();
    }

    /**
     * Retrieves key from `keyfile`. Returns a `CryptoKey` object
     */
    async function getKey(quote) {
        let keyLocation = window.location.href + relativeSignaturePath + quote.getAttribute("keyFile");
        let KeyString = await loadFile(keyLocation);
        let KeyJWK = JSON.parse(KeyString);
        // console.log(KeyString);
        let publicKey = await crypto.subtle.importKey(
            "jwk",
            KeyJWK,
            KEY_PARAM,
            true,
            KeyJWK.key_ops
        );
        // console.log(publicKey);
        return publicKey;
    }
    
    /**
     * Verifies the signature of a quote. Returns false if either there is no
     * signature, or if the signature doesn't match the quote.
     */
    async function verifyQuote(quote) {
        // Get the location where the signature should be located, attempt to
        // load it into signature, and convert it to an ArrayBuffer.
        let signatureLocation = window.location.href + relativeSignaturePath + quote.getAttribute("signaturefile") + ".sig";
        // console.log(signatureLocation);
        let signature = await loadFile(signatureLocation);
        // console.log(signature);
        signature = new Uint8Array(signature.toString('base64').split(","));
        signature = signature.buffer;

        let publicKey = await getKey(quote);
        
        // Get the hash of the element, and convert it into an ArryBuffer
        const encoder = new TextEncoder();
        let hashH = await hashOfContent(quote.innerHTML);
        hashH = encoder.encode(hashH).buffer;
        // console.log(hashH);
        // console.log(encoder.encode(hashH));
        // console.log(publicKey);
        let verification = await crypto.subtle.verify(
            KEY_PARAM,
            publicKey,
            signature,
            hashH
        );
        return verification;
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
     * Go over every element with class "signedQuote", and remove it's truth class.
     */
    function removeColorings() {
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
            removeColorings();
        } else if (message.command === "quoteRecolour") {
            recolourQuotes();
        }
    });

})();
