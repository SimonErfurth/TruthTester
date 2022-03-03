import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import * as fs from 'fs';
const argv = process.argv;
const privateKeyFile = argv[2];
const publicKeyFile = argv[3];
const documentFile = argv[4];
const identity = argv[5];
const comment = argv[6];
const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384", hash: { name: "SHA-256" }, };
// const KEY_PARAM = { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' };

(async function() {
    /**
     * Returns the content of `file`
     */
    function getContent(file) {
        // Using the sync version is bad, but it shouldn't matter since the keys are also small...
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
    async function getKey(keyfile) {
        let KeyString = getContent(keyfile);
        let KeyJWK = JSON.parse(KeyString);
        let key = await webcrypto.subtle.importKey(
            "jwk",
            KeyJWK,
            KEY_PARAM,
            true,
            KeyJWK.key_ops
        );
        return key;
    }

    /**
     * Write signature of `fileToSign` to file `fileToSign.sig`
     */
    async function writeSignatureToFile(key, publicKey, fileToSign) {
        let toSign = getContent(fileToSign);
        toSign = await hashOfContent(toSign);
        let name = fileToSign.replace(".quoteH", "");
        // Convert to ArrayBuffer
        const encoder = new TextEncoder();
        toSign = encoder.encode(toSign);
        let signature = await webcrypto.subtle.sign(
            KEY_PARAM,
            key,
            toSign
        );
        let signatureArray = new Uint8Array(signature);
        let signatureString = signatureArray.toString('base64');
        let signatureFull = {
            "signature":signatureString,
            "KEY_PARAM": KEY_PARAM,
            "publicKey": publicKey,
            "identity": identity,
            "comment": comment,
        };
        fs.writeFile(name + '.sig', JSON.stringify(signatureFull, null), err => {
            if (err) { console.log(err); }
        });
        console.log("signatureFull = ", signatureFull);
    }

    let privateKey = await getKey(privateKeyFile);
    let publicKey = getContent(publicKeyFile);
    await writeSignatureToFile(privateKey, publicKey, documentFile);

    /**
     * THE FOLLOWING CODE IS FOR TESTING PURPOSES ONLY
     */

    // Generate signature for documentFile
    // let toSign =  getContent(documentFile);
    // let signature = await webcrypto.subtle.sign(
    //     KEY_PARAM,
    //     privateKey,
    //     toSign
    // );

    // // Load publicKey (for Alice)
    // let publicKeyString = getContent('AlicePublicKey');
    // let publicKeyJWK = JSON.parse(publicKeyString);
    // let publicKey = await webcrypto.subtle.importKey(
    //     "jwk",
    //     publicKeyJWK,
    //     KEY_PARAM,
    //     true,
    //     ['verify']
    // );

    // // And perform verification
    // let toVerify = getContent(documentFile);
    // let verification = await webcrypto.subtle.verify(
    //     KEY_PARAM,
    //     publicKey,
    //     signature,
    //     toVerify
    // );

    // console.log(verification);

})();
