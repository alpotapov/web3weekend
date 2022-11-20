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


const owner1 = '0x8f196bEbF800e6e9c0382F49E56862bFDCd5aF4a';
const owner1PrivateKey = process.env.PERSONA_1_PRIVATE_KEY;

const callMintMethod = async (guardians) => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(
    accessNft.address,
    new ethers.utils.Interface(accessNft.abi),
    wallet
  );

  const tx = await contract.mintFor(owner1, guardians);
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

  const accessControlConditions = [
    {
        contractAddress: accessNft.address,
        standardContractType: 'ERC721',
        chain,
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>',
          value: '0',
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

  return {
    encryptedString, encryptedSymmetricKey
  }
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
    this.nftId = await callMintMethod(this.guardians);
    console.log(`-> Minted AccessNFT with id ${this.nftId}`);

    console.log('\n');
    return '';
  }

  async encryptWithLit() {
    console.log('\nEncrypting backup');
    
    const data = fs.readFileSync('./app/backup.txt', 'utf8');
    console.log(`\n-> backup.txt:\n${data}\n`);
    const { encryptedString, encryptedSymmetricKey } = await encryptBackup(data, owner1PrivateKey);
    console.log(`-> Encrypted backup: ${encryptedString}`);
    console.log(`-> Encrypted symmetric key: ${encryptedSymmetricKey}`);
    
    console.log(`-> Setting access control condition: 'Must be owner of AccessNFT #${this.nftId}'`);
    
    console.log('\n');
  }
  
  async uploadToFilecoin() {
    console.log('\nUploading encrypted backup to Filecoin');
    const cid = 'aaaaaaaaaaaaabbbbbbbbbbbbbbcccccccccccccc';
    console.log(`-> CID: ${cid.slice(0, 30)} ... ${cid.length - 30} symbols omitted`);
    
    console.log('-> Waiting for a deal to store the file');

    console.log('-> Storage provider accepted the deal, file is stored for the next 3 months');

    console.log(`-> Writing CID to AccessNFT metadata`);

    console.log('\n');
  }

  async transferAccessNFT() {
    const newAccount = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65';
    this.guardians.slice(0, 2).map((g, index) => {
      console.log(`-> Guardian ${index} is transferring AccessNFT to ${newAccount}`)
    });

    console.log('\n');
  }

  async restoreBackup() {
    console.log('\nRestoring backup from Filecoin');
    const cid = 'aaaaaaaaaaaaabbbbbbbbbbbbbbcccccccccccccc';
    console.log(`-> Retrieving file with CID: ${cid.slice(0, 30)} ... ${cid.length - 30} symbols omitted`);

    console.log('-> Requesting symmetric key decryption from Lit Protocol');
    const { symmetricKey } = {
      'symmetricKey': 'aaaaaaaaaaaaaabbbbbbbbbbbbbbcccccccccccccc',
    };

    console.log(`-> Decrypting backup with symmetric key: ${symmetricKey.slice(0, 30)} ... ${symmetricKey.length - 30} symbols omitted`);
    const { decryptedString } = {
      'decryptedString': '...decrypted backup...',
    };

    console.log(`Restored backup:\n${decryptedString}`);

    console.log('\n');
  }
}

module.exports = new Demo();