import { webcrypto } from 'crypto';
import * as fs from 'fs';
const argv = process.argv;
const signatureFile = argv[2];
const documentFile = argv[3];

(async function() {
    /**
     * Returns the content of `file`
     */
    function getContent(file) {
        // Using the sync version is bad...
        let data = fs.readFileSync(file, 'utf8', (err) => {
            if (err) { console.error(err); }
        });
        return data;
    }

    /**
     * Calculates and return the hash of the string.
     */
    async function hashOfContent(element) {
        const encoder = new TextEncoder();
        const hashBuffer = await webcrypto.subtle.digest('SHA-256', encoder.encode(element));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Retrieves key from `keyfile`. Returns a `CryptoKey` object
     */
    async function getKey(KeyString) {
        let KeyJWK = JSON.parse(KeyString);
        let privateKey = await webcrypto.subtle.importKey(
            "jwk",
            KeyJWK,
            KEY_PARAM,
            true,
            KeyJWK.key_ops
        );
        return privateKey;
    }

    /**
     * Retrieves the signature stored in `file`. Returns an `ArrayBuffer` object
     */
    async function loadSignature(signatureString){
        let signatureArray = new Uint8Array(signatureString.toString('base64').split(","));
        return signatureArray.buffer;
    }

    // let publicKey = await getKey(publicKeyFile);
    let signatureFull = JSON.parse(getContent(signatureFile));
    let KEY_PARAM = signatureFull.KEY_PARAM;
    let signature = await loadSignature(signatureFull.signature);
    let publicKey = await getKey(signatureFull.publicKey);

    let toVerify = await hashOfContent(getContent(documentFile));
    let verification = await webcrypto.subtle.verify(
        KEY_PARAM,
        publicKey,
        signature,
        toVerify
    );
    console.log(verification);
    
})();
