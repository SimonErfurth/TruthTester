import { webcrypto } from 'crypto';
import * as fs from 'fs';
const argv = process.argv;
const KEY_NAME = argv[2];
// const KEY_PARAM = { name: "ECDSA", namedCurve: "P-384" };
const KEY_PARAM = { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' };

(async function() {
    /**
     * Generates a public/private key pair
     */
    async function generateEd25519Key() {
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
    let keys = await generateEd25519Key();
    writeKeyToFile(keys.privateKey, KEY_NAME + 'PrivateKey.key');
    writeKeyToFile(keys.publicKey, KEY_NAME + 'PublicKey.key');
})();
