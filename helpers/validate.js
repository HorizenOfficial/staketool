const bs58check = require('bs58check');
const Decimal = require('decimal.js-light');

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
  const { verbose } = options;
  let payto;
  try {
    payto = JSON.parse(payaddress);
  } catch (error) {
    console.log(error.message);
    console.log('The quotes in payaddress may need to be escaped or start/end with a different quote. Examples: '
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
  let total = new Decimal(0);
  for (let i = 0; i < payto.length; i++) {
    const { address, pct } = payto[i];
    const isAddrZen = this.isZenAddr(address, options);
    if (!isAddrZen) return false;
    if (pct < 0.1) {
      console.log(`Minimum pct is 0.10  ${address} is set to ${pct}`);
      return false;
    }

    const pctDec = new Decimal(pct);
    if (pctDec.dp() > 2) {
      console.log(`Payaddress pct may only have 2 decimal places. Found ${pct} for ${address}`);
      return false;
    }
    // in case there are trailing 0s or pct is a string, replace with number
    payto[i].pct = pctDec.toNumber();

    total = total.plus(pctDec);
  }
  if (!total.eq(100.00)) {
    console.log(`The total pct must equal 100.00 Total= ${total.toDecimalPlaces(2).toNumber()}`);
    return false;
  }
  payto.sort((a, b) => ((a.address > b.address) ? 1 : -1));
  if (verbose) console.log(`PAYADDRESS: ${JSON.stringify(payto)}`);
  return payto;
};
