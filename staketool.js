/* eslint-disable prefer-destructuring */
require('colors');
const steps = require('./helpers/steps');
const { getBalance, listStakes, sendSignedTx, sendCancel } = require('./helpers/utils');
const { getFile } = require('./helpers/fileutils');
const help = require('./help/help');
const { isZenAddr } = require('./helpers/validate');



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

const commands = [
  'createstakeverification',
  'signverificationtransaction',
  'sendtxandstakeverification',
  'cancelstakeverification',
  'liststakes',
  'getbalance',
];
const command = process.argv[2];
const arg3 = process.argv[3] || null;
if (commands.indexOf(command) === -1 || command === 'help' || command === '--help' || command === '-h' || arg3 === 'help') {
  help.main(command, arg3, { verbose });
  process.exit();
}

if (verbose) console.log(`COMMAND ${command}`);

const displayArg = (val) => {
  const status = val[1] || (val[0] === '--verbose' || val[0] === '-v' ? 'true' : 'missing or incorrect');
  console.log(`ARG ${val[0]} = ${status}`);
};

const sys = ['super', 'secure', 'testnet'];
// argument processing
let stake;
let payaddress;
let method;
let outputfile;
let testnet;
let inputfile;
let valErrors = '';
let system;

switch (command) {
  case 'createstakeverification': { // Step 1a & 1b
    let issue;
    let extrazen;
    const short = ['-s', '-p', '-m', '-o', '-sys', '-v', '-ez'];
    const allowed = short.concat(['--stake', '--payaddress', '--method', '--outputfile', '--system', '--verbose', '--extrazen']);
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
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
      if (val[0] === '-ez' || val[0] === '--extrazen') extrazen = Number(val[1]);
    }
    if (issue) break;
    testnet = system === 'testnet';
    // default if not set
    if (!method) method = 'tool';

    // validate arguments
    valErrors = '';
    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!stake) valErrors += ' Missing stake.';
    if (!payaddress) valErrors += ' Missing payaddress.';
    if (method && (method !== 'instructions' && method !== 'tool' && method !== 'zen-cli')) valErrors += '  Method unknown.';
    if (extrazen) {
      if (!Number.isInteger(extrazen)) valErrors += ' --extrazen must be a whole number (no decimals).';
      if (extrazen === 0) valErrors += ' --extrazen must be a whole number greater than 0.';
    }
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
        const result = await steps.stakeVerification(stake, payaddress, { testnet, verbose, outputfile, method, extrazen, system });
        if (!result) throw new Error(`stake verification did not complete properly for ${stake}`);
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        if (verbose) console.log('stakeverification= ', result);
        if (method === 'zen-cli' || method === 'tool') {
          txresult = await steps.buildTx(result, method, { testnet, outputfile, verbose, system });
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
    const short = ['-a', '-tx', '-s', '-i', '-o', '-sys', '-v'];
    const allowed = short.concat(['--apikey', '--txid', '--signedtxhex', '--inputfile', '--outputfile', '--system', '--verbose']);
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
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    testnet = system === 'testnet';
    valErrors = '';

    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!apikey) {
      if (process.env.APIKEY) {
        apikey = process.env.APIKEY;
      } else {
        valErrors += ' Missing apikey. ';
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
          const file = getFile('inprocess.json', system);
          inputfile = JSON.parse(file).filename;
          if (!inputfile) throw new Error('No inputfile and missing inprocess.json file');
        }
        if (verbose) console.log(`PROCESSING ${inputfile}`);
        //
        const stakefile = getFile(inputfile, system);
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
        const resultSendVer = await steps.sendVerification(apikey, stakeObj, inputfile, { outputfile, testnet, verbose, system });
        if (resultSendVer.issue) throw new Error(`ISSUE ${resultSendVer.issue}`);
        console.log(`${resultSendVer.msg} ${resultSendVer.status ? `Status: ${resultSendVer.status}` : ''}`);
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  case 'cancelstakeverification': { // cancel confirming or verified
    let apikey;
    let stakeid;
    let issue;
    const allowed = ['-a', '-id', '-sys', '-v', '--apikey', '--idstake', '--system', '--verbose'];
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
      if (val[0] === '-id' || val[0] === '--idstake') stakeid = val[1];
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    testnet = system === 'testnet';

    valErrors = '';
    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!apikey) {
      if (process.env.APIKEY) {
        apikey = process.env.APIKEY;
      } else {
        valErrors += ' Missing apikey. ';
      }
    }
    if (!stakeid) valErrors += "Missing stake id. Use 'liststakes' to retrieve a list of stakes.";

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      break;
    } else {
      valErrors = '';
    }

    (async () => {
      try {
        const result = await sendCancel(apikey, stakeid, { testnet, verbose, system });
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        console.log(result.msg);
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
    const short = ['-a', '-s', '-st', '-f', '-sys', '-v'];
    const allowed = short.concat(['--apikey', '--stake', '--status', '--system', '--verbose', '--format']);
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
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    testnet = system === 'testnet';
    valErrors = '';
    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!apikey) {
      if (process.env.APIKEY) {
        apikey = process.env.APIKEY;
      } else {
        valErrors += ' Missing apikey. ';
      }
    }
    if (format && (format !== 'json' && format !== 'list')) valErrors += 'format must be json or list.';
    if (stake && !isZenAddr(stake, { testnet, verbose })) valErrors += ' invalid stake address.';

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      break;
    } else {
      valErrors = '';
    }
    // query tracking server via stake API call
    (async () => {
      try {
        const result = await listStakes(apikey, { stake, status, testnet, system });
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        if (format) {
          if (format === 'list') {
            result.forEach((addr) => {
              console.log('');
              let msg = `${addr.stkaddr} status=${addr.status} created=${addr.createdAt} id=${addr.id} txid=${addr.txid}`;
              if (addr.status === 'failed') msg += ` reason=${addr.failreason}`;
              if (addr.status === 'replaced') msg += ` replaced=${addr.replacedAt}`;
              if (addr.paytos) addr.paytos.forEach((p) => { msg += ` payto=${p.payto} pct=${p.pct} `; return null; });
              if (addr.nodes) msg += ` nodes=${addr.nodes.map((n) => n.id).join(',')}`;
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
    const allowed = ['-s', '-sys', '-v', '--stake', '--system', '--verbose'];
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
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    valErrors = '';
    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!stake) valErrors += ' Missing stake address. ';

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
