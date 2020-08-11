const crypto = require('crypto');
const axios = require('axios').default;
const zencashjs = require('zencashjs');
const { config } = require('../config.js');


// //////////////////////////////////////////
// Step 1a helpers create stake verification
// ///////////////////////////////////////////
/**
 *
 * @param {object} hashObj  stake and array of payout object with address and pct for each
 *
 * returns the amount to send in a transaction and the stringified input of object to hash
 * this is also the id to use in the optional export file
 */
exports.hashIt = (hashObj) => {
  let satoshis = 0;
  const hashSource = JSON.stringify(hashObj);
  let hash = hashSource;
  let i = 1;
  while (satoshis < 10000) {
    if (i > 1) console.log(`We hashed ${i} times without a result which is very rare, you should play the lottery.`);
    if (i > 10) throw new Error('Unable to hash the request properly.');
    hash = crypto.createHash('sha256').update(hash).digest('hex');
    satoshis = parseInt(parseInt(hash.slice(-8), 16).toString(10).slice(0, 6), 10);
    i++;
  }
  return [satoshis, hashSource];
};

// //////////////////////////////////////////
// Step 1b   create verification transaction
// //////////////////////////////////////////

/**
 *
 * @param {string} stake  zen address
 * @param {boolean} testnet
 */
exports.getUTXOs = (stake, testnet) => {
  let url = testnet ? config.testnet.explorerURL : config.mainnet.explorerURL;
  url += `/addrs/${stake}/utxo`;
  return axios.get(url)
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return { issue: `Explorer returned status ${response.status} from getting utxos. ${response.data || ''}` };
    })
    .catch((error) => {
      console.log(error.message || error);
      throw new Error(error.message || error);
    });
};

/**
 *
 * @param {array} utxos utxos from explorer
 * @param {number} amtSatoshis   amount of zen in satoshis
 */
exports.findVOUTS = (utxos, amtSatoshis, options) => {
  const { verbose } = options;
  const pointone = 10000000;
  const unspent = [];
  let lucky;

  // check if only one
  if (utxos.length === 0) {
    return { issue: 'Insufficient funds. ', bal: 0, need: (amtSatoshis / 100000000) };
  }
  if (utxos.length === 1 && utxos[0].satoshis < amtSatoshis && utxos[0].scriptPubKey.length > 50) {
    const bal = utxos[0].satoshis / 100000000;
    const need = Number(((amtSatoshis / 100000000) - bal).toFixed(8));
    return { issue: 'Insufficient funds. ', bal, need };
  }
  if (utxos.length === 1 && utxos[0].satoshis >= amtSatoshis  && utxos[0].scriptPubKey.length > 50) {
    if (utxos[0].confirmations < 1) return { issue: 'Funds found but must have at least 1 block confirmation. Rerun after next block.' };
    // sort below skips if only one utxo
    unspent.push({ txid: utxos[0].txid, vout: utxos[0].vout, scriptPubKey: utxos[0].scriptPubKey });
    const sum = utxos[0].satoshis / 100000000;
    return { unspent, sum, sumSatoshis: utxos[0].satoshis };
  }
  // filter out coinbase zen
  noncoinbase = utxos.filter((u) => u.scriptPubKey.length > 50);

  // check for a single vout less than 0.1 while sorting
  noncoinbase.sort((a, b) => {
    if (a.satoshis > amtSatoshis && a.satoshis < pointone && a.confirmation > 0) lucky = a;
    return a.satoshis - b.satoshis;
  });

  if (lucky) {
    if (verbose) console.log('Found one lucky UTXO to use');
    unspent.push({ txid: lucky.txid, vout: lucky.vout, scriptPubKey: lucky.scriptPubKey });
    return { unspent, sum: lucky.satoshis / 100000000, sumSatoshis: lucky.satoshis };
  }

  // start accumulating
  let sumSats = 0;
  let i = 0;
  while (sumSats < amtSatoshis && i < noncoinbase.length) {
    if (noncoinbase[i].confirmations > 0) {
      unspent.push({ txid: noncoinbase[i].txid, vout: noncoinbase[i].vout, scriptPubKey: noncoinbase[i].scriptPubKey });
      sumSats += noncoinbase[i].satoshis;
    }
    i++;
  }

  if (sumSats < amtSatoshis) {
    const bal = sumSats / 100000000;
    const need = (amtSatoshis / 100000000) - bal;
    return { issue: 'Insufficient funds.', bal, need };
  }
  if (unspent.length > 100) return { issue: 'Too many small unspent utxos. Transaction will be too big.' };

  return { unspent, sum: sumSats / 100000000, sumSatoshis: sumSats };
};

/**
 *
 * @param {object} inputs vouts from stake used as inputs for this tx
 * @param {object} outputs where to send the zen
 * @param {boolean} testnet
 */
exports.createRawTx = (inputs, outputs, testnet) => {
  // check the config
  let anchorBlock;
  let anchorHash;
  if (testnet) {
    if (!config.testnet.anchorBlock) throw new Error('Missing anchorBlock in config for testnet');
    anchorBlock = config.testnet.anchorBlock;
    anchorHash = config.testnet.anchorHash;
  } else {
    if (!config.mainnet.anchorBlock) throw new Error('Missing anchorBlock in config for mainnet');
    anchorBlock = config.mainnet.anchorBlock;
    anchorHash = config.mainnet.anchorHash;
  }
  const tx = zencashjs.transaction.createRawTx(inputs, outputs, anchorBlock, anchorHash);
  return tx;
};

exports.serializeTx = (txObj) => zencashjs.transaction.serializeTx(txObj);

exports.deserializeTx = (hexTx) => zencashjs.transaction.deserializeTx(hexTx);



// ///////////////////////////////////////////////
// Step 3a   send signed transaction to blockchain
// ///////////////////////////////////////////////

/**
 *
 * @param {string} signedTx   signed transaction as hex string
 * @param {boolean} testnet
 */
exports.sendSignedTx = async (signedTx, testnet) => {
  let url = testnet ? config.testnet.explorerURL : config.mainnet.explorerURL;
  const data = { rawtx: signedTx };
  url += '/tx/send';

  return axios.post(url, data, { timeout: 8000 })
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return { issue: `Explorer returned status ${response.status} from sending tx. ${response.data || ''}` };
    })
    .catch((error) => {
      // console.log(error);
      const msg = `sending signed tx. Status code:${error.response.status} error:${error.response.data || error.message}`;
      // throw new Error(msg || error.message || error);
      return { issue: msg };
    });
};

// /////////////////////////////////////////////////
// Step 3b   send verification transaction to server
// /////////////////////////////////////////////////

/**
 *
 * @param {string} apikey  user's apikey either main or sub key
 * @param {object} verification stake verification from step 1
 * @param {boolean} testnet
 */
exports.sendVerification = async (apikey, verification, testnet) => {
  let url = testnet ? config.testnet.server : config.mainnet.server;
  if (process.env.DEVSERVER) url = process.env.DEVSERVER;

  return axios.head(url, { timeout: 8000, maxRedirects: 0 })
  .then((response) => response.data)
  .catch((error) => {
    // axios turns a redirect POST into GET. Resubmit.
    // head request will error with 302. Use server returned.
    if (error.response.status === 302) {
      const resUrl = `${error.response.headers.location}api/stake/verify`;
      const data = { ...verification };
      data.key = apikey;
      return axiosPost.post(resUrl, data, { timeout: 8000 })
        .then((response) => response.data)
        .catch((err) => {
          const servermsg = err.response && err.response.data ? err.response.data.message : err.message;
          const msg = `sending verification request. error:${servermsg || err}`;
          return { issue: msg };
        });
    }
    const servermsg = error.response && error.response.data ? error.response.data.message : error.message;
    const msg = `sending verification request. error:${servermsg || error}`;
    return { issue: msg };
  });
};

// //////////////////////////////////////////
//             Helpers
// //////////////////////////////////////////

/**
 *
 * @param {string} apikey  users apikey either main or sub key
 * @param {object} options  stake, status and testnet
 *
 */
exports.listStakes = async (apikey, options) => {
  let url = options.testnet ? config.testnet.server : config.mainnet.server;
  let filters = options.stake ? `&stake=${options.stake}` : '';
  filters += options.status ? `&status=${options.status}` : '';
  if (process.env.DEVSERVER) url = process.env.DEVSERVER;
  url += `/api/stake/list?key=${apikey}${filters}`;

  return axios.get(url, { timeout: 30000 })
    .then((response) => response.data)
    .catch((error) => {
      const msg = `Status code:${error.response ? error.response.status : error.code} error:${error.response.data.message || error.message}`;
      throw new Error(msg || error.message || error);
    });
};

/**
 *
 * @param {string} stake   stake address
 * @param {boolean} testnet
 */
exports.getBalance = async (stake, testnet) => {
  let url = testnet ? config.testnet.explorerURL : config.mainnet.explorerURL;
  url += `/addr/${stake}/?noTxList=1`;

  return axios.get(url, { timeout: 8000 })
    .then((response) => response.data.balance)
    .catch((error) => {
      // console.log(error);
      const msg = `Status code:${error.response.status} error:${error.response.data || error.message}`;
      throw new Error(msg || error.message || error);
    });
};
