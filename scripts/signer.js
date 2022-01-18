import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import * as fs from 'fs';
const argv = process.argv;
const privateKeyFile = argv[2];
const documentFile = argv[3];
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
     * Retrieves privatekey from `keyfile`. Returns a `CryptoKey` object
     */
    async function getPrivateKey(keyfile) {
        let privateKeyString = getContent(keyfile);
        let privateKeyJWK = JSON.parse(privateKeyString);
        let privateKey = await webcrypto.subtle.importKey(
            "jwk",
            privateKeyJWK,
            KEY_PARAM,
            true,
            ['sign']
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

    let privateKey = await getPrivateKey(privateKeyFile);

    writeSignatureToFile(privateKey, documentFile);

    
    /**
     * THE FOLLOWING CODE IS FOR TESTING PURPOSES ONLY
     */

    // Generate signature for documentFile
    let toSign = getContent(documentFile);
    let signature = await webcrypto.subtle.sign(
        KEY_PARAM,
        privateKey,
        toSign
    );

    // Load publicKey (for Alice)
    let publicKeyString = getContent('AlicePublicKey');
    let publicKeyJWK = JSON.parse(publicKeyString);
    let publicKey = await webcrypto.subtle.importKey(
        "jwk",
        publicKeyJWK,
        KEY_PARAM,
        true,
        ['verify']
    );

    // And perform verification
    let toVerify = getContent(documentFile);
    let verification = await webcrypto.subtle.verify(
        KEY_PARAM,
        publicKey,
        signature,
        toVerify
    );

    console.log(verification);

})();
