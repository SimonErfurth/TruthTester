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
    function elementRemove(idString) {
        let element = document.getElementById(idString);
        element.remove();
    }

    /////////////////////
    // MODAL FUNCTIONS //
    /////////////////////
    /**
     * Helper functions to format the HTML and CSS with correct info.
     */
    // TODO Update signatures to include relevant information, and make this use relevant information.
    function modalHelperHTML(element, verified) {
        let keyFileName = element.getAttribute("keyFile");
        let signer = "Scrooge McDuck";
        let dateOfSigning = "30/02 2021";
        let header = "Authenticity verification failed, proceed with caution!";
        if (verified) {
            header = "The authenticity of this quote has been verified";
        }
        let additionalInformation = "";
        return `<div id="AuthenticModal" class="authenticity-modal">

    <!-- Modal content -->
    <div class="authenticity-modal-content">
      <div class="authenticity-modal-header">
        <span id="AuthenticClose" class="authenticity-close">&times;</span>
        <h2>${header}</h2>
      </div>
      <div class="authenticity-modal-body">
        <dl>
          <dt>Signer</dt> <dd>${signer}</dd>
          <dt>Date of signing</dt> <dd>${dateOfSigning}</dd>
          <dt>Key file</dt> <dd>${keyFileName}</dd>
          <dt>Additional Information</dt> <dd>${additionalInformation}</dd>
        </dl>
        <h4> The signed quote is: </h4>
        <p> ${element.innerHTML}</p>
      </div>
      <div class="authenticity-modal-footer">
        <h4>Learn more about AuthenticityAuthenticator and why you should prefer content that has been verified by it at <a href="https://github.com/SimonErfurth/TruthTester">AuthenticityAuthenticator's website</a>.</h4>
      </div>
    </div>

  </div>`;
    }

    function modalHelperCSS(verified) {
        let modalColour = `#ff2c2c`;
        if (verified) {
            modalColour = `#5cb85c`;
        }
        return `/* MODAL */
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
  background-color: ${modalColour};
  color: white;
}

.authenticity-modal-body {padding: 2px 16px;}

.authenticity-modal-footer {
  padding: 2px 16px;
  background-color: ${modalColour};
  color: white;
}`;
    }

    /**
     * Modifies the page to include the needed code for the AuthenticModal. 
     * Returns the created `modal`.
     */
    function authenticModalSetup(modalCSS, modalHTML) {
        addCss(modalCSS);
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        let modal = document.getElementById("AuthenticModal");
        window.addEventListener('click', function(event) {
            if (event.target == modal) {
                elementRemove('AuthenticModal');
                elementRemove('AuthenticModalCSS');
            }
        });

        let close = document.getElementById("AuthenticClose");
        close.addEventListener('click', function() {
            elementRemove('AuthenticModal');
            elementRemove('AuthenticModalCSS');
        });
        // return modal;
    }

    /**
     * Function st. when clicking a authenticated (respectfully rejected)
     * element it injects and opens a modality
     */
    function addModalityFunction(element, classString, verified) {
        let wrapper = document.createElement('span');
        wrapper.classList.add(classString);
        wrapper.addEventListener('click', function() {
            authenticModalSetup(modalHelperCSS(verified), modalHelperHTML(element, verified));
        });
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    ///////////////////////////////////////
    // FUNCTIONS RELATED TO CRYPTOGRAPHY //
    ///////////////////////////////////////
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
     * Retrieves key from keyFile attribute of `element`. Returns a `CryptoKey` object
     */
    async function getKey(element) {
        let keyLocation = window.location.href + relativeSignaturePath + element.getAttribute("keyFile");
        let KeyString = await loadFile(keyLocation);
        let KeyJWK = JSON.parse(KeyString);
        let publicKey = await crypto.subtle.importKey(
            "jwk",
            KeyJWK,
            KEY_PARAM,
            true,
            KeyJWK.key_ops
        ).catch((error) => {
            console.error('Error:', error);
        });
        return publicKey;
    }

    /**
     * Verifies the signature of an element. Returns false if either there is no
     * signature, or if the signature doesn't match the element.
     */
    async function verifySignature(element) {
        // Get the location where the signature should be located, attempt to
        // load it into signature, and convert it to an ArrayBuffer.
        let signatureLocation = window.location.href + relativeSignaturePath + element.getAttribute("signaturefile") + ".sig";
        let signature = await loadFile(signatureLocation);
        signature = new Uint8Array(signature.toString('base64').split(","));
        signature = signature.buffer;

        let publicKey = await getKey(element);
        
        // Get the hash of the element, and convert it into an ArryBuffer
        const encoder = new TextEncoder();
        let hashH = await hashOfContent(element.innerHTML);
        hashH = encoder.encode(hashH).buffer;
        let verification = await crypto.subtle.verify(
            KEY_PARAM,
            publicKey,
            signature,
            hashH
        );
        return verification;
    }

    ////////////////////////
    // FUNCTIONS FOR TEXT //
    ////////////////////////

    /**
     * Go over `text`, return positions of matching `startString` and `endString`
     */
    function findSignedText(text, startString, endString) {
        // let line = 1;
        // let char = 1;
        // let stack = [];
        // for (let i = 0; i < text.length - endString.length; i ++) {
        //     if (text.slice(i,i+startString.length) == startString) {
        //         console.log("Found a startstring!");
        //         stack.push(i);
        //     }
        //     if (text.slice(i,i+endString.length) == endString && stack != []) {
        //         console.log("Found a quote, starting at char ", stack.pop(), " and ending at char ",i + endString.length);
        //     }
        // }
        text = text.replace(startString,'<span class="signedText">');
        text = text.replace(endString,"</span>");
        return text;
    }

    ////////////////////
    // MAIN FUNCTIONS //
    ////////////////////
    /**
     * Go over every element with class "className", verify if it is
     * authentic, and treat it accordingly.
     */
    async function verifySignedElements(className) {
        // let modal = authenticModalSetup();
        let existingQuotes = document.querySelectorAll(className);
        for (let quote of existingQuotes) {
            let verify = await verifySignature(quote).catch((error) => {
                console.warn('Problem verifying signature!\nError:', error);
                return false;
            });
            if (verify) {
                quote.classList.add("verified-quote");
                addModalityFunction(quote, "modal-btn-verified", true);
            } else {
                quote.classList.add("rejected-quote");
                addModalityFunction(quote, "modal-btn-rejected", false);
            }
        }
    }

    /**
     * Go over every element with class "className", and remove it's truth class.
     */
    function removeVerifications(className) {
        let existingQuotes = document.querySelectorAll(className);
        for (let quote of existingQuotes) {
            quote.classList.remove("verified-quote", "rejected-quote");
        }
    }

    /**
     * Go over the webpage, looking for text with an included signature
     * reference, if any is found verify it accordingly.
     */
    async function verifySignedText() {
        let text = findSignedText(document.body.innerHTML,/START_Q/g,/END_Q/g);
        document.body.innerHTML = text;
    }

    /**
     * Listen for messages from the background script.
     * Call corresponding function
     */
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "resetAll") {
            removeVerifications(".signedQuote");
            removeVerifications(".signedText");
        } else if (message.command === "verifyElements") {
            verifySignedElements(".signedQuote");
        } else if (message.command === "verifyText") {
            verifySignedText();
            verifySignedElements(".signedText");
        }
    });

})();
