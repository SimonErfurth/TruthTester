#!/bin/sh
node quoteExtractor.js ./../../testWebsite/index.html ".signedQuote"

for f in *.quoteH; do
    VAR1="Wow, we are signing "
    VAR2=$f
    VAR3="$VAR1$VAR2"
    node signer.js DonaldPrivateKey.key DonaldPublicKey.key $f "Donald Duck" "$VAR3"
done

for f in *.sig; do
    cp $f ~/serfurth.dk/RealFakeNews/sigs/$f
    mv $f ./../../testWebsite/signatures/$f
done

rm *.quoteH

# node quoteExtractor.js ./../../testWebsite/index.html ".test-for-export"
# com="This quote is not to be interpreted as a comment on what is currently going on in Ukraine."
# node signer.js DonaldPrivateKey.key DonaldPublicKey.key *.quoteH "Donald Duck" "$com"
# mv *.sig ~/serfurth.dk/RealFakeNews/sigs/
# Remember to run git for website to get the new signature out there!
