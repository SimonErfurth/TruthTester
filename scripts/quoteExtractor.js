import { webcrypto, randomBytes } from 'crypto';
import { TextEncoder } from 'util';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';
const argv = process.argv;
const HTMLFile = argv[2];
const tagToSign = argv[3];

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

    let htmlPage = getContent(HTMLFile);
    const dom = new JSDOM(htmlPage);

    let quotes = dom.window.document.querySelectorAll(tagToSign);
    for (let quote of quotes) {
        // Here there is a decision to be made, for now we go with textContent
        // let hashOfQuote = await hashOfContent(quote.textContent.replace(/\s+/g, ' ').trim());
        // console.log("hashOfQuote = ", hashOfQuote);
        let ID = randomBytes(6).toString('base64url').slice(0,6) + "---" + await hashOfContent(quote.textContent.replace(/\s+/g, ' ').trim());
        fs.writeFile(ID + ".quoteH", quote.textContent.replace(/\s+/g, ' ').trim(), err => {
            if (err) { console.log(err); }
        });
        quote.setAttribute("signatureFile",ID);
    }
    fs.writeFile(HTMLFile,dom.window.document.documentElement.outerHTML, err => {
        if (err) { console.log(err); }
    });
})();
