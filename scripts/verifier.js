import { webcrypto } from 'crypto';
import * as fs from 'fs';
const argv = process.argv;
const publicKeyFile = argv[2];
const signatureFile = argv[3];
const documentFile = argv[4];
const KEY_PARAM = { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' };

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
     * Retrieves key from `keyfile`. Returns a `CryptoKey` object
     */
    async function getKey(keyfile) {
        let KeyString = getContent(keyfile);
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
    async function loadSignature(file){
        let signatureString = getContent(file);
        let signatureArray = new Uint8Array(signatureString.toString('base64').split(","));
        return signatureArray.buffer;
    }

    let publicKey = await getKey(publicKeyFile);
    let signature = await loadSignature(signatureFile);

    let toVerify = getContent(documentFile);
    let verification = await webcrypto.subtle.verify(
        KEY_PARAM,
        publicKey,
        signature,
        toVerify
    );
    console.log(verification);
    
})();
