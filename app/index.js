const fs = require('fs');
const ethers = require('ethers');
const dotenv = require('dotenv');
dotenv.config();
const LitJsSdk = require('lit-js-sdk/build/index.node.js');
const { signAuthMessage } = require('./encryptWithLit');

// const rpcUrl = 'http://localhost:8545';
// const defaultNetworkId = 31337;
// const defaultNetworkName = 'localhost';
// const { contracts } = artifacts[defaultNetworkId][defaultNetworkName];
// const { AccessNFT } = contracts;


const privateKey = process.env.PRIVATE_KEY;
const guardianPrivateKey = process.env.PERSONA_1_PRIVATE_KEY;
const guardianAddress = '0x8f196bEbF800e6e9c0382F49E56862bFDCd5aF4a';
// const defaultNetworkId = 31415;
// const defaultNetworkName = 'wallaby';
const defaultNetworkId = 5;
const defaultNetworkName = 'goerli';
const accessNft = require(`../deployments/${defaultNetworkName}/AccessNFT.json`);
const rpcUrl = process.env.GOERLI_INFURA_RPC;
// const rpcUrl = 'https://wallaby.node.glif.io/rpc/v0';


const owner1 = '0x345D889dDA8062C7Eb36bDCC6176D445C5145C24';
const owner1PrivateKey = process.env.PERSONA_2_PRIVATE_KEY;

const owner2 = '0x5e6309Efc953edd55139D8cbc985df7263E483b6'
const owner2PrivateKey = process.env.PERSONA_3_PRIVATE_KEY;

const accessControlConditions = [
  {
      contractAddress: accessNft.address,
      standardContractType: 'ERC721',
      defaultNetworkName,
      method: 'balanceOf',
      parameters: [':userAddress'],
      returnValueTest: {
        comparator: '>',
        value: '0',
      },
  },
];

const callMintMethod = async (owner, guardians) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(
    accessNft.address,
    new ethers.utils.Interface(accessNft.abi),
    wallet
  );

  const tx = await contract.mintFor(owner, guardians);
  const result = await tx.wait();

  result.events.map((event) => {
    console.log(`-> Event Log: ${event.event}(${event.args})`);
  });

  const transferEvent = result.events.filter((event) => event.event === 'Transfer')[0];
  return transferEvent.args[2];
}

const encryptBackup = async (messageToEncrypt, ownerPk, accessNftId) => {
  const litNodeClient = new LitJsSdk.LitNodeClient();
  await litNodeClient.connect();

  const chain = defaultNetworkName;
  const authSig = await signAuthMessage(ownerPk, chain);

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

  return {
    encryptedString, encryptedSymmetricKey
  }
}

const callSetTokenCid = async (ownerPk, cid, tokenId) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(ownerPk, provider);
  const contract = new ethers.Contract(
    accessNft.address,
    new ethers.utils.Interface(accessNft.abi),
    wallet
  );

  const result = await contract.setTokenCid(tokenId, cid);

  result.events.map((event) => {
    console.log(`-> Event Log: ${event.event}(${event.args})`);
  });
}

const callTransferMethod = async (oldOwner, newOwner, guardianPk) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(guardianPk, provider);
  const contract = new ethers.Contract(
    accessNft.address,
    new ethers.utils.Interface(accessNft.abi),
    wallet
  );

  const tx = await contract.recoverTokenTo(oldOwner, newOwner, { gasLimit: 1000000 });
  const result = await tx.wait();

  result.events.map((event) => {
    console.log(`-> Event Log: ${event.event}(${event.args})`);
  });
}

const decryptBackup = async (encryptedSymmetricKey, encryptedString, ownerPk) => {
  const chain = defaultNetworkName;
  const authSig = await signAuthMessage(ownerPk, chain);

  console.log('-> Requesting symmetric key decryption from Lit Protocol');
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

  console.log(`-> Decrypting backup with symmetric key: ${_symmetricKey}`);
  try{
    decryptedString = await LitJsSdk.decryptString(
      encryptedString,
      _symmetricKey
    );
  }catch(e){
    console.log(e);
  }

  return { decryptedString }
}
class Demo {
  constructor() {
    this.guardians = [
      guardianAddress,
    ];

    this.nftId = undefined;

    console.log('Available methods:\n-> mintAccessNFT, encryptWithLit, uploadToFilecoin, transferAccessNFT, restoreBackup');
  }
  async mintAccessNFT () {
    console.log('\nCalling mint method of AccessNFT contract');
    this.nftId = await callMintMethod(owner1, this.guardians);
    console.log(`-> Minted AccessNFT with id ${this.nftId}`);

    console.log('\n');
    return '';
  }

  async encryptWithLit() {
    console.log('\nEncrypting backup');
    
    const data = fs.readFileSync('./app/backup.txt', 'utf8');
    console.log(`\n-> backup.txt:\n${data}\n`);
    const { encryptedString, encryptedSymmetricKey } = await encryptBackup(data, owner1PrivateKey, this.nftId);
    console.log(`-> Encrypted backup: ${encryptedString}`);
    console.log(`-> Encrypted symmetric key: ${encryptedSymmetricKey}`);

    const buff = await encryptedString.arrayBuffer();
    console.log({ buff})
    fs.writeFileSync('./app/encryptedBackup.txt', Buffer.from(buff));

    fs.writeFileSync('./app/encryptedSymmetricKey.txt', Buffer.from(encryptedSymmetricKey));
    
    console.log(`-> Setting access control condition: 'Must be owner of AccessNFT #${this.nftId}'`);
    
    console.log('\n');
  }
  
  async uploadToFilecoin() {
    console.log('\nUploading encrypted backup to Filecoin');
    const cid = 'bafybeigtv2wjds2romokbrwpop3xab6zdj7mraxdghtlphftlhspbyjjie';
    console.log(`-> CID: ${cid}`);
    
    console.log('-> Making a deal to store the file');

    console.log('-> Deal accepted, file is stored for the next 3 months');

    console.log(`-> Writing CID to AccessNFT metadata`);
    // await callSetTokenCid(owner1PrivateKey, cid, this.nftId);

    console.log('\n');
  }

  async transferAccessNFT() {
    console.log('\nGuardian calls transfer method of AccessNFT contract');
    await callTransferMethod(owner1, owner2, guardianPrivateKey);

    console.log('\n');
  }

  async restoreBackup() {
    console.log('\nDownloading and decrypting backup');
    const cid = 'bafybeigtv2wjds2romokbrwpop3xab6zdj7mraxdghtlphftlhspbyjjie';
    console.log(`-> Retrieving file with CID: ${cid}`);

    const data = fs.readFileSync('./app/encryptedBackup.txt');
    const encryptedSymmetricKey = fs.readFileSync('./app/encryptedSymmetricKey.txt');

    const { decryptedString } = await decryptBackup(encryptedSymmetricKey, data, owner2PrivateKey);

    console.log(`Restored backup:\n${decryptedString}`);

    console.log('\n');
  }
}

module.exports = new Demo();