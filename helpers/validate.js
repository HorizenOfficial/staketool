const bs58check = require('bs58check');

const regexZenAddr = /^[z][a-km-zA-HJ-NP-Z1-9]{26,36}$/;

const isZen = (addr) => regexZenAddr.test(addr);

exports.isZenAddr = (addr, options) => {
  const { testnet, verbose } = options;
  if (verbose) console.log('CHECK ZEN', addr);
  if (!isZen(addr)) return false; // throw new Error('invalid address')

  let prefix;
  try {
    prefix = bs58check.decode(addr).toString('hex').slice(0, 4);
  } catch (err) {
    // throw new Error(`invalid address: ${err.message}`);
    return false;
  }

  if (!testnet && !((prefix === '2089' || prefix === '2096'))) {
    console.log('rejecting testnet address');
    return false;
  }
  if (testnet && !((prefix === '2098' || prefix === '2092'))) {
    console.log('rejecting mainnet address');
    return false;
  }
  return true;
};

/**
 *
 * @param {string} payaddress  cli argument returns array of pay to addrs and pct
 */

exports.checkPayaddress = (payaddress, options) => {
  let payto;
  try {
    payto = JSON.parse(payaddress);
  } catch (error) {
    console.log(error.message);
    console.log('The quotes in payaddress may need to be escaped or start/end with different quote. Examples: '
    + `'${'[\\"amount\\"...]'}' or "${'[\\"amount\\"....]'}"`);
    return false;
  }
  if (!Array.isArray(payto)) throw new Error('The payaddress is not formatted properly.');
  if (payto.length > 5) {
    console.log('Too many payto addresses. Limit is 5');
    return false;
  }
  if (payto.length > 1) {
    const addresses = payto.map((pto) => pto.address);
    if (new Set(addresses).size !== addresses.length) {
      console.log('Duplicate payto addresses found.');
      return false;
    }
  }

  // check each address and total
  let total = 0;
  for (let i = 0; i < payto.length; i++) {
    const { address, pct } = payto[i];
    const isAddrZen = this.isZenAddr(address, options);
    if (!isAddrZen) return false;

    if (typeof pct === 'string') payto[i].pct = Number(pct);
    total += payto[i].pct;
  }
  if (total !== 1) {
    console.log(`the total pct must equal 1. Total= ${total}`);
    return false;
  }

  payto.sort((a, b) => ((a.address > b.address) ? 1 : -1));
  return payto;
};
