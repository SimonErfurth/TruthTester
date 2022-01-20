import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import * as fs from 'fs';
const argv = process.argv;
const publicKeyFile = argv[2];
const documentFile = argv[3];
const signatureFile = argv[4];
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
        console.log(KeyJWK.key_ops);
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
     * Write signature of `fileToSign` to file `fileToSign.sig`
     */
    async function writeSignatureToFile(key, fileToSign) {
        let toSign = getContent(fileToSign);
        let signature = await webcrypto.subtle.sign(
            KEY_PARAM,
            key,
            toSign
        );
        fs.writeFile(fileToSign + '.sig', Buffer.from(signature), err => {
            if (err) { console.log(err); }
        });
    }

    let privateKey = await getKey(publicKeyFile);

//     writeSignatureToFile(privateKey, documentFile);

    
//     /**
//      * THE FOLLOWING CODE IS FOR TESTING PURPOSES ONLY
//      */

//     // Generate signature for documentFile
//     let toSign = getContent(documentFile);
//     let signature = await webcrypto.subtle.sign(
//         KEY_PARAM,
//         privateKey,
//         toSign
//     );

//     // Load publicKey (for Alice)
//     let publicKeyString = getContent('AlicePublicKey');
//     let publicKeyJWK = JSON.parse(publicKeyString);
//     let publicKey = await webcrypto.subtle.importKey(
//         "jwk",
//         publicKeyJWK,
//         KEY_PARAM,
//         true,
//         ['verify']
//     );

//     // And perform verification
//     let toVerify = getContent(documentFile);
//     let verification = await webcrypto.subtle.verify(
//         KEY_PARAM,
//         publicKey,
//         signature,
//         toVerify
//     );

//     console.log(verification);

})();
