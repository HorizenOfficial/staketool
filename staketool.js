/* eslint-disable prefer-destructuring */
require('colors');
const steps = require('./helpers/steps');
const { getBalance, listStakes, sendSignedTx } = require('./helpers/utils');
const { getFile } = require('./helpers/fileutils');
const help = require('./help/help');



// /////////////////////////////////////////////////////////
//
//  Main module for verifying Horizen stake address ownership
//
// //////////////////////////////////////////////////////////


// check for verbose argument
const verbose = process.argv.includes('--verbose', 2) || process.argv.includes('-v', 2);

// check for ERROR_DETAILS environment var - outputs lines for debugging
const ERROR_DETAILS = process.env.ERROR_DETAILS || false;
if (verbose) console.log('ENV: ERROR_DETAILS', ERROR_DETAILS);

const commands = ['createstakeverification', 'signverificationtransaction', 'sendtxandstakeverification', 'liststakes', 'getbalance'];
const command = process.argv[2];
const arg3 = process.argv[3] || null;
if (commands.indexOf(command) === -1 || command === 'help' || command === '--help' || command === '-h' || arg3 === 'help') {
  help.main(command, arg3, { verbose });
  process.exit();
}

if (verbose) console.log(`COMMAND ${command}`);

const displayArg = (val) => {
  const status = val[1] || (val[0] === '--testnet' || val[0] === '--verbose' || val[0] === '-t' || val[0] === '-v' ? 'true' : 'missing');
  console.log(`ARG ${val[0]} = ${status}`);
};


// argument processing
let stake;
let payaddress;
let method;
let outputfile;
let testnet;
let inputfile;
let valErrors = '';

switch (command) {
  case 'createstakeverification': { // Step 1a & 1b
    let issue;
    const allowed = ['-s', '-p', '-m', '-o', '-t', '-v', '--stake', '--payaddress', '--method', '--outputfile', '--testnet', '--verbose'];
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. For command help: staketool createstakeverification help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-s' || val[0] === '--stake') stake = val[1];
      if (val[0] === '-p' || val[0] === '--payaddress') payaddress = val[1];
      if (val[0] === '-m' || val[0] === '--method') method = val[1];
      if (val[0] === '-o' || val[0] === '--outputfile') outputfile = val[1];
      if (val[0] === '-t' || val[0] === '--testnet') testnet = true;
    }
    if (issue) break;

    // default if not set
    if (!method) method = 'tool';

    // validate arguments
    valErrors = '';
    if (!stake) valErrors += 'Missing stake.';
    if (!payaddress) valErrors += ' Missing payaddress.';
    if (method && (method !== 'instructions' && method !== 'tool' && method !== 'zen-cli')) valErrors += '  Method unknown.';
    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}  For command help: staketool createstakeverification help`.red);
      break;
    } else {
      valErrors = '';
    }

    // create the hash from stake and payto addreses
    (async () => {
      try {
        // returns an object with amount and filepath
        let txresult;
        const result = await steps.stakeVerification(stake, payaddress, { testnet, verbose, outputfile, method });
        if (verbose) console.log('stakeverification= ', result);
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        if (method === 'zen-cli' || method === 'tool') {
          txresult = await steps.buildTx(result, method, { testnet, outputfile, verbose });
          if (verbose) console.log('verificationtransaction= ', txresult);
          if (txresult.issue) throw new Error(`ISSUE ${txresult.issue}`);
        }
        // only output object as it may be used as inputfile in a script
        if (method === 'tool') console.log(result);
      } catch (err) {
        console.log(ERROR_DETAILS ? err : err.message.red);
      }
    })();
    break;
  }
  case 'sendtxandstakeverification': { // Step 3
    let apikey;
    let txid;
    let signedtxhex;
    let issue;
    const allowed = ['-a', '-tx', '-s', '-i', '-o', '-t', '-v', '--apikey', '--txid', '--signedtxhex', '--inputfile', '--outputfile', '--testnet', '--verbose'];
    if (verbose) console.log('ARGUMENT COUNT=', process.argv.length);
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. Ensure file names have quotes. For command help: staketool sendtxandstakeverification help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-a' || val[0] === '--apikey') apikey = val[1];
      if (val[0] === '-tx' || val[0] === '--txid') txid = val[1];
      if (val[0] === '-s' || val[0] === '--signedtxhex') signedtxhex = val[1];
      if (val[0] === '-i' || val[0] === '--inputfile') inputfile = val[1];
      if (val[0] === '-o' || val[0] === '--outputfile') outputfile = val[1];
      if (val[0] === '-t' || val[0] === '--testnet') testnet = true;
    }
    if (issue) break;
    valErrors = '';
    if (!apikey) {
      if (process.env.APIKEY) {
        apikey = process.env.APIKEY;
      } else {
        valErrors += 'Missing apikey. ';
      }
    }
    if (signedtxhex && txid) valErrors += 'Do not use --txid with --signedtxhex. ';

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      break;
    } else {
      valErrors = '';
    }
    const txSources = { txid, signedtxhex };
    (async () => {
      try {
        if (!inputfile) {
          const file = getFile('inprocess.json');
          inputfile = JSON.parse(file).filename;
          if (!inputfile) throw new Error('No inputfile and missing inprocess.json file');
        }
        if (verbose) console.log(`PROCESSING ${inputfile}`);
        //
        const stakefile = getFile(inputfile);
        const stakeObj = JSON.parse(stakefile);

        const resultCheck = steps.checkForTxidOrHex(stakeObj, txSources, { verbose });
        if (resultCheck.issue) throw new Error(`ISSUE ${resultCheck.issue}`);
        if (verbose) console.log(`TX STATUS ${resultCheck.status}  SOURCE ${resultCheck.source}`);
        if (resultCheck.status === 'send') {
          const resultSend = await steps.sendTx(stakeObj, testnet);
          if (resultSend.issue) throw new Error(`ISSUE ${resultSend.issue}`);
          stakeObj.txid = resultSend.txid;
        } else if (resultCheck.status === 'sendtxhex') {
          const resultSendHex = await sendSignedTx(signedtxhex, testnet);
          if (resultSendHex.issue) throw new Error(`ISSUE ${resultSendHex.issue}`);
          stakeObj.txid = resultSendHex.txid;
        } else if (resultCheck.status === 'sent') {
          stakeObj.txid = resultCheck.txid;
        }
        const resultSendVer = await steps.sendVerification(apikey, stakeObj, inputfile, { outputfile, testnet, verbose });
        if (resultSendVer.issue) throw new Error(`ISSUE ${resultSendVer.issue}`);
        console.log(resultSendVer.msg);
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  // helpers
  case 'liststakes': {
    let apikey;
    let status;
    let format;
    let issue;
    const allowed = ['-a', '-s', '-st', '-f', '-t', '-v', '--apikey', '--stake', '--status', '--testnet', '--verbose', '--format'];
    if (verbose) console.log('ARGUMENT COUNT=', process.argv.length);
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. Ensure file names are in quotes. For command help: staketool liststakes help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-a' || val[0] === '--apikey') apikey = val[1];
      if (val[0] === '-s' || val[0] === '--stake') stake = val[1];
      if (val[0] === '-st' || val[0] === '--status') status = val[1];
      if (val[0] === '-f' || val[0] === '--format') format = val[1];
      if (val[0] === '-t' || val[0] === '--testnet') testnet = true;
    }
    if (issue) break;
    valErrors = '';
    if (!apikey) {
      if (process.env.APIKEY) {
        apikey = process.env.APIKEY;
      } else {
        valErrors += 'Missing apikey. ';
      }
    }
    if (format && (format !== 'json' && format !== 'list')) valErrors += 'format must be json or list.';

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      break;
    } else {
      valErrors = '';
    }
    // query tracking server via stake API call
    (async () => {
      try {
        const result = await listStakes(apikey, { stake, status, testnet });
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        if (format) {
          if (format === 'list') {
            result.forEach((addr) => {
              let msg = `${addr.stkaddr} status=${addr.status} created=${addr.createdAt}`;
              if (addr.status === 'failed') msg += ` reason=${addr.failreason}`;
              if (addr.status === 'replaced') msg += ` replaced=${addr.replacedAt}`;
              if (addr.paytos) addr.paytos.forEach((p, idx, a) => { msg += ` payto=${p.payto} pct=${p.pct}${idx < a.length - 1 ? ',' : ''} `; return null; });
              console.log(msg);
            });
          } else {
            console.log(JSON.stringify(result));
          }
        } else {
          console.log(JSON.stringify(result, undefined, 1));
        }
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  // query explorer for stake balance
  case 'getbalance': {
    let issue;
    const allowed = ['-s', '-t', '-v', '--stake', '--testnet', '--verbose'];
    if (verbose) console.log('ARGUMENT COUNT=', process.argv.length);
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. Ensure file names are in quotes. For command help: staketool getbalance help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-s' || val[0] === '--stake') stake = val[1];
      if (val[0] === '-t' || val[0] === '--testnet') testnet = true;
    }
    if (issue) break;
    valErrors = '';
    if (!stake) valErrors += 'Missing stake address. ';

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`);
      break;
    } else {
      valErrors = '';
    }

    (async () => {
      try {
        const result = await getBalance(stake, testnet);
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        console.log(result);
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  default:
    console.log('No command found. For command help: staketool help'.red);
    process.exit();
}
