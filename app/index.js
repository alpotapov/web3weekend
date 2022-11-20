class Demo {
  constructor() {
    this.guardians = [
      '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    ]
  }
  async mintAccessNFT () {
    console.log('\nCalling mint method of AccessNFT contract');
    this.guardians.map((g, index) => console.log(`-> Assigned guardian ${index}: ${g}`));
  
    const accessNFTId = 1;
    console.log(`-> Minted AccessNFT with id ${accessNFTId}`);

    console.log('\n');
    return '';
  }

  async encryptWithLit() {
    console.log('\nEncrypting backup.txt with symmetric key');
    const { encryptedString, symmetricKey } = {
      'encryptedString': 'aaaaaaaaaaaaaabbbbbbbbbbbbbbcccccccccccccc',
    };
    console.log(`-> Encrypted backup: ${encryptedString.slice(0, 30)} ... ${encryptedString.length - 30} symbols omitted`);
    console.log(`-> Encrypted symmetric key: ${symmetricKey}`);
    
    const accessNftId = '1';
    console.log(`Setting access control condition: 'Must be owner of AccessNFT #${accessNftId}'`);
    
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
    this.guardians.map((g, index) => {
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