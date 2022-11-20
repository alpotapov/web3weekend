// Copied from
// https://raw.githubusercontent.com/LIT-Protocol/lit-demo-simple-string-encrypt-nodejs/main/main.js

const LitJsSdk = require('lit-js-sdk/build/index.node.js');
const u8a = require("uint8arrays");
const ethers = require("ethers");
const siwe = require("siwe");

const go = async () => {

    // -- init litNodeClient
    const litNodeClient = new LitJsSdk.LitNodeClient();

    await litNodeClient.connect();

    const messageToEncrypt = "🔥🔥🔥🔥🔥 THIS IS A SECRET MESSAGE 🔥🔥🔥🔥🔥 ";

    const chain = 'ethereum';

    const authSig = await signAuthMessage();

    const accessControlConditions = [
        {
            contractAddress: '',
            standardContractType: '',
            chain: 'ethereum',
            method: 'eth_getBalance',
            parameters: [':userAddress', 'latest'],
            returnValueTest: {
            comparator: '>=',
            value: '0',  // 0 ETH, so anyone can open
            },
        },
    ];

    // 1. Encryption
    // <Blob> encryptedString
    // <Uint8Array(32)> symmetricKey 
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(messageToEncrypt);

    // 2. Saving the Encrypted Content to the Lit Nodes
    // <Unit8Array> encryptedSymmetricKey
    const encryptedSymmetricKey = await litNodeClient.saveEncryptionKey({
        accessControlConditions,
        symmetricKey,
        authSig,
        chain,
    });

    // 3. Decrypt it
    // <String> toDecrypt
    const toDecrypt = LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16');

    // <Uint8Array(32)> _symmetricKey 
    const _symmetricKey = await litNodeClient.getEncryptionKey({
        accessControlConditions,
        toDecrypt,
        chain,
        authSig
    })

    // <String> decryptedString
    let decryptedString;

    try{
        decryptedString = await LitJsSdk.decryptString(
            encryptedString,
            _symmetricKey
        );
    }catch(e){
        console.log(e);
    }

    console.warn("decryptedString:", decryptedString);
}

/**
 * Get auth signature using siwe
 * @returns 
 */
const signAuthMessage = async (pk, chain) => {

    const privKey = pk;
    const privKeyBuffer = u8a.fromString(privKey, "base16");
    const wallet = new ethers.Wallet(privKeyBuffer);

    const domain = "localhost";
    const origin = "https://localhost/login";
    const statement =
    "This is a test statement.  You can put anything you want here.";

    const siweMessage = new siwe.SiweMessage({
    domain,
    address: wallet.address,
    statement,
    uri: origin,
    version: "1",
    chainId: chain,
    });

    const messageToSign = siweMessage.prepareMessage();

    const signature = await wallet.signMessage(messageToSign);

    console.log("signature", signature);

    const recoveredAddress = ethers.utils.verifyMessage(messageToSign, signature);

    const authSig = {
    sig: signature,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: messageToSign,
    address: recoveredAddress,
    };

    return authSig;
}

module.exports = {
  go,
  signAuthMessage
}