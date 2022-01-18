import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import * as fs from 'fs';
const argv = process.argv;
const privateKeyFile = argv[2];
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
     * Retrieves privatekey from `keyfile`. Returns a `CryptoKey` object
     */
    async function getPrivateKey(keyfile) {
        let privateKeyString = getContent(keyfile);
        let privateKeyJWK = JSON.parse(privateKeyString);
        let privateKey = await webcrypto.subtle.importKey(
            "jwk",
            privateKeyJWK,
            {
                name: 'NODE-ED25519',
                namedCurve: 'NODE-ED25519',
            },
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
            {
                name: 'NODE-ED25519',
                namedCurve: 'NODE-ED25519',
            },
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
        {
            name: 'NODE-ED25519',
            namedCurve: 'NODE-ED25519',
        },
        privateKey,
        toSign
    );

    // Load publicKey (for Alice)
    let publicKeyString = getContent('AlicePublicKey');
    let publicKeyJWK = JSON.parse(publicKeyString);
    let publicKey = await webcrypto.subtle.importKey(
        "jwk",
        publicKeyJWK,
        {
            name: 'NODE-ED25519',
            namedCurve: 'NODE-ED25519',
        },
        true,
        ['verify']
    );

    // And perform verification
    let toVerify = getContent(documentFile);
    let verification = await webcrypto.subtle.verify(
        {
            name: 'NODE-ED25519',
            namedCurve: 'NODE-ED25519',
        },
        publicKey,
        signature,
        toVerify
    );

    console.log(verification);

})();
