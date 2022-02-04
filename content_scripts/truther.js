(function() {
    const relativeSignaturePath = "signatures/";
    const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-256" }, };

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
     * Calculates and return the hash of `element`
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
        let response = await fetch(filePath, { cache: "no-cache" });
        if (response.status !== 200) {
            throw response.status;
        }
        return await response.text();
    }


    /**
     * Modifies the page to include the needed code for the AuthenticModal. 
     * Returns the created `modal`.
     */
    function authenticModalSetup() {
        const modalHTML = `<!-- AuthenticityAuthenticator Modal -->
  <div id="AuthenticModal" class="modal">

    <!-- Modal content -->
    <div class="modal-content">
      <div class="modal-header">
        <span id="AuthenticClose" class="close">&times;</span>
        <h2>This quote is authentic</h2>
      </div>
      <div class="modal-body">
        <p>This quote's authenticity has been verified by AuthenticityAuthenticator.</p>
        <p>Details: TBD</p>
      </div>
      <div class="modal-footer">
        <h3>Learn more about AuthenticityAuthenticator at <a href="https://github.com/SimonErfurth/TruthTester">AuthenticityAuthenticator's website</a>.</h3>
      </div>
    </div>

  </div>`;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        let modal = document.getElementById("AuthenticModal");
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });

        let close = document.getElementById("AuthenticClose");
        close.addEventListener('click', function() {
            modal.style.display = "none";
        });
        return modal;
    }

    /**
     * Make it so clicking `element` brings up `modal`, by wrapping `element` in
     * a <span> of class `classString`.
     */
    function addModalToggle(element, classString, modal) {
        let wrapper = document.createElement('span');
        wrapper.classList.add(classString);
        wrapper.addEventListener('click', function() {
            modal.style.display = "block";
        });
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    /**
     * Retrieves key from `quote.keyFile`. Returns a `CryptoKey` object
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
        let modal = authenticModalSetup();
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
            if (await verifyQuote(quote)) {
                quote.classList.add("true-quote");
                addModalToggle(quote, "modal-btn-verified", modal);
            } else {
                quote.classList.add("false-quote");
                addModalToggle(quote, "modal-btn-refused", modal);
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
