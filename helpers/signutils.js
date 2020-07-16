const zencashjs = require('zencashjs');
const bip32 = require('bip32');
const bip39 = require('bip39');

const { saveFile, getFile } = require('./fileutils');

/* ********************************************
 *
 *   Step 2 sign verification transaction
 *
 * ********************************************
 * */

/**
*
* @param {object} txObj  transaction object used by zencashjs
* @param {string} privkeyWIF  private key in WIF format
*/
const signRawTx = (txObj, privkeyWIF) => {
  const privkey = zencashjs.address.WIFToPrivKey(privkeyWIF);
  let tmpObj = { ...txObj };
  for (let x = 0; x < txObj.ins.length; x++) {
    tmpObj = zencashjs.transaction.signTx(tmpObj, x, privkey, true);
  }
  return zencashjs.transaction.serializeTx(tmpObj);
};

/**
*
* @param {sting} input file path and name or just file name
* @param {string} privkey  private key of the stake address
* @param {object} options optional key:value items
*/
exports.signTransaction = async (input, privkey, options) => {
  const { outputfile, verbose } = options;

  // get the file and the raw tx
  const contents = await getFile(input);
  if (!contents) return { issue: 'File not found' };

  const data = JSON.parse(contents);

  if (verbose) console.log('Signing tx for stake:', data.stake);

  const serializedSignedTx = signRawTx(data.txObj, privkey);
  data.signedTx = serializedSignedTx;
  // output to file
  const filename = outputfile || input;
  saveFile(data, filename);
  const result = serializedSignedTx;

  return result;
};

exports.getKeys = async (mnemonicPhrase, options) => {
  const { account, number, password, testnet } = options;
  const numAddresses = number || 10;
  // const mnemonicPhrase = seed;
  const mnemonicPassword = password || '';
  const derivationPathAccount = account || 0;

  const BIP32 = {
    DERIVATION_PATH_BASE: "m/44'",
    COIN: { ZEN: "121'" },
    CHANGE_CHAIN: {
      EXTERNAL: 0,
      INTERNAL: 1,
    },
  };
  const bip32Network = {
    mainnet: {
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      wif: 0x80,
    },
    testnet: {
      bip32: {
        public: 0x0488b21e,
        private: 0x0488ade4,
      },
      wif: 0xef,
    },
  };
  const keyObj = [];

  const derivationPrefix = `${BIP32.DERIVATION_PATH_BASE}/${BIP32.COIN.ZEN}/${derivationPathAccount}'/${BIP32.CHANGE_CHAIN.EXTERNAL}/`;
  const seed = await bip39.mnemonicToSeed(mnemonicPhrase, mnemonicPassword);
  const hdNode = await bip32.fromSeed(seed, testnet ? bip32Network.testnet : bip32Network.mainnet);
  for (let i = 0; i < numAddresses; ++i) {
    const derivationPath = derivationPrefix + i.toString();
    const hdNodeDerived = hdNode.derivePath(derivationPath);
    const privKey = hdNodeDerived.privateKey.toString('hex');
    const pubKey = hdNodeDerived.publicKey.toString('hex');
    const privKeyWIF = zencashjs.address.privKeyToWIF(privKey, true, testnet ? zencashjs.config.testnet.wif : zencashjs.config.mainnet.wif);
    const address = zencashjs.address.pubKeyToAddr(pubKey, testnet ? zencashjs.config.testnet.pubKeyHash : zencashjs.config.mainnet.pubKeyHash);
    keyObj.push({ path: derivationPath, address, pubKey, privKey, privKeyWIF });
  }
  return keyObj;
};


