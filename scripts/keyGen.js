import { webcrypto } from 'crypto';
import * as fs from 'fs';
const argv = process.argv;
const KEY_NAME = argv[2];
const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384", hash: {name: "SHA-256"}, };

(async function() {
    /**
     * Generates a public/private key pair
     */
    async function generateNewKeys() {
        return webcrypto.subtle.generateKey(
            KEY_PARAM,
            true,
            ['sign', 'verify']
        );
    }
    /**
    * Converts `key` to JWK format, and tries to write it to `file`.
    */
    async function writeKeyToFile(key, file) {
        let keyJWK = await webcrypto.subtle.exportKey('jwk', key);
        let keyString = JSON.stringify(keyJWK, null, " ");
        fs.writeFile(file, keyString, err => {
            if (err) {
                throw err;
            }
        });
    }
    let keys = await generateNewKeys();
    writeKeyToFile(keys.privateKey, KEY_NAME + 'PrivateKey.key');
    writeKeyToFile(keys.publicKey, KEY_NAME + 'PublicKey.key');
})();
