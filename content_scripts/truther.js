(function() {
    const relativeSignaturePath = "signatures/";
    const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-256" }, };
    const modalHTML = `<div id="AuthenticModal" class="authenticity-modal">

    <!-- Modal content -->
    <div class="authenticity-modal-content">
      <div class="authenticity-modal-header">
        <span id="AuthenticClose" class="authenticity-close">&times;</span>
        <h2>This quote is authentic</h2>
      </div>
      <div class="authenticity-modal-body">
        <p>This quote's authenticity has been verified by AuthenticityAuthenticator.</p>
        <p>Details: TBD</p>
      </div>
      <div class="authenticity-modal-footer">
        <h3>Learn more about AuthenticityAuthenticator at <a href="https://github.com/SimonErfurth/TruthTester">AuthenticityAuthenticator's website</a>.</h3>
      </div>
    </div>

  </div>`;
    const modalCSS = `/* MODAL */
/* The Modal (background) */
.authenticity-modal {
  display: block; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
  /* -webkit-animation-name: fadeIn; /\* Fade in the background *\/ */
  /* -webkit-animation-duration: 0.4s; */
  /* animation-name: fadeIn; */
  /* animation-duration: 0.4s */
}

/* Modal Content */
.authenticity-modal-content {
  position: fixed;
  bottom: 0;
  background-color: #fefefe;
  width: 100%;
  -webkit-animation-name: slideIn;
  -webkit-animation-duration: 0.4s;
  animation-name: slideIn;
  animation-duration: 0.4s
}

/* The Close Button */
.authenticity-close {
  color: white;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.authenticity-close:hover,
.authenticity-close:focus {
  color: #000;
  text-decoration: none;
  cursor: pointer;
}

.authenticity-modal-header {
  padding: 2px 16px;
  background-color: #5cb85c;
  color: white;
}

.authenticity-modal-body {padding: 2px 16px;}

.authenticity-modal-footer {
  padding: 2px 16px;
  background-color: #5cb85c;
  color: white;
}`;

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
     * Inject `css` into the headder of the window
     */
    function addCss(css) {
        var head = document.getElementsByTagName('head')[0];
        var s = document.createElement('style');
        s.setAttribute('type', 'text/css');
        s.setAttribute('id', 'AuthenticModalCSS');
        s.appendChild(document.createTextNode(css));
        head.appendChild(s);
    }

    /**
     * Removes element with id `idString` from the webpage
     */
    function elementRemover(idString) {
        let element = document.getElementById(idString);
        element.remove();
    }

    /**
     * Modifies the page to include the needed code for the AuthenticModal. 
     * Returns the created `modal`.
     */
    function authenticModalSetup() {
        addCss(modalCSS);
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        let modal = document.getElementById("AuthenticModal");
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                elementRemover('AuthenticModal');
                elementRemover('AuthenticModalCSS');
            }
        });

        let close = document.getElementById("AuthenticClose");
        close.addEventListener('click', function() {
            elementRemover('AuthenticModal');
            elementRemover('AuthenticModalCSS');
        });
        // return modal;
    }

    /**
     * Function st. when clicking a authenticated (respectfully rejected)
     * element it injects and opens a modality
     */
    function addModalityFunction(element, classString) {
        let wrapper = document.createElement('span');
        wrapper.classList.add(classString);
        wrapper.addEventListener('click', function() {
            authenticModalSetup(); // Here we can add as input a function formatModal(element) returning a string with correct info
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
        // let modal = authenticModalSetup();
        let existingQuotes = document.querySelectorAll(".signedQuote");
        for (let quote of existingQuotes) {
            if (await verifyQuote(quote)) {
                quote.classList.add("true-quote");
                addModalityFunction(quote, "modal-btn-verified");
                // addModalToggle(quote, "modal-btn-verified", modal);
            } else {
                quote.classList.add("false-quote");
                addModalityFunction(quote, "modal-btn-rejected");
                // addModalToggle(quote, "modal-btn-refused", modal);
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
