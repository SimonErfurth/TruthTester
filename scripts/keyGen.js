import { webcrypto } from 'crypto';
import * as fs from 'fs';
const argv = process.argv;
const KEY_NAME = argv[2];

(async function() {
    /**
     * Generates a pair of public and private keys
     */
    async function generateEd25519Key() {
        return webcrypto.subtle.generateKey({
            name: 'NODE-ED25519',
            namedCurve: 'NODE-ED25519',
        }, true, ['sign', 'verify']);
    }

    /**
     * Converts given key to JWK format, and tries to write it to a file.
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

    let keys = await generateEd25519Key();
    writeKeyToFile(keys.privateKey, KEY_NAME + 'PrivateKey');
    writeKeyToFile(keys.publicKey, KEY_NAME + 'PublicKey');
})();
