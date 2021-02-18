/* eslint-disable prefer-destructuring */
const prompt = require('prompt-sync')({ sigint: true });
require('colors');
const utils = require('./helpers/signutils');
const help = require('./help/signhelp');
const { getFile } = require('./helpers/fileutils');

// /////////////////////////////////////////////////////////////////
//
//    Main module for signing raw transactions
//
//    This application is part of a three step process
//    for verifying stake ownership for Horizen nodes
//
//    It can be used offline or on an air-gapped system as it
//    does not contain any modules to access a network.
//
//
// //////////////////////////////////////////////////////////////////


// check for verbose argument
const verbose = process.argv.includes('--verbose', 2) || process.argv.includes('-v', 2);

// check for ERROR_DETAILS environment var - outputs lines for debugging
const ERROR_DETAILS = process.env.ERROR_DETAILS || false;
if (verbose) console.log('ENV: ERROR_DETAILS', ERROR_DETAILS);

const commands = ['signverificationtransaction', 'keysfromseed'];
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
let outputfile;
let testnet;
let inputfile;
let valErrors = '';
let system;

switch (command) {
  case 'signverificationtransaction': {
    let privkey;
    let issue;
    const allowed = ['-i', '-o', '-p', '-sys', '-v', '--inputfile', '--outputfile', '--privkey', '--system', '--verbose'];
    if (verbose) console.log('ARGUMENT COUNT=', process.argv.length);
    // process.argv.forEach((value, index) => {
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. For command help: signtxtool signverificationtransaction help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-i' || val[0] === '--inputfile') inputfile = val[1];
      if (val[0] === '-o' || val[0] === '--outputfile') outputfile = val[1];
      if (val[0] === '-p' || val[0] === '--privkey') privkey = val[1];
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    testnet = system === 'testnet';
    valErrors = '';

    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!privkey) {
      if (process.env.PRIVKEY) {
        privkey = process.env.PRIVKEY;
      } else {
        privkey = prompt('Enter private key: ');
      }
    }
    if (!privkey) {
      valErrors += 'Missing private key. ';
    }

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      break;
    } else {
      valErrors = '';
    }

    (async () => {
      try {
        if (!inputfile) {
          const file = getFile('inprocess.json', system);
          inputfile = JSON.parse(file).filename;
          if (!inputfile) throw new Error('No inputfile and missing inprocess.json file');
        }
        if (verbose) console.log(`PROCESSING ${inputfile}`);
        const result = await utils.signTransaction(inputfile, privkey, { outputfile, verbose, system });
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        console.log(result);
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  case 'keysfromseed': {
    let seed;
    let account;
    let number;
    let password;
    let format;
    let issue;
    const allowed = ['-s', '-a', '-n', '-p', '-f', '-sys', '-v', '--seed', '--account', '--number', '--password', '--format', '--system', '--verbose'];
    if (verbose) console.log('ARGUMENT COUNT=', process.argv.length);
    for (let i = 0; i < process.argv.length; i++) {
      const val = process.argv[i].split('=');
      if (i > 2 && verbose) displayArg(val);
      if (i > 2 && allowed.indexOf(val[0]) === -1) {
        console.log(`${val[0]} is not valid for this command. Ensure seed phrase has quotes. For command help: signtxtool keysfromseed help`.red);
        issue = true;
        break;
      }
      if (val[0] === '-s' || val[0] === '--seed') seed = val[1];
      if (val[0] === '-a' || val[0] === '--account') account = val[1];
      if (val[0] === '-n' || val[0] === '--number') number = val[1];
      if (val[0] === '-p' || val[0] === '--password') password = val[1];
      if (val[0] === '-f' || val[0] === '--format') format = val[1];
      if (val[0] === '-sys' || val[0] === '--system') system = val[1];
    }
    if (issue) break;
    testnet = system === 'testnet';
    valErrors = '';

    if (!system || !sys.includes(system)) valErrors += ` --system is required and must be one of: ${sys.join(', ')}.`;
    if (!seed) {
      seed = prompt('Enter the BIP39 seed phrase: ');
    }
    if (!seed) {
      valErrors += 'Missing seed phrase. ';
    }

    if (valErrors.length > 1) {
      console.log(`Errors found. Exiting. ${valErrors}`.red);
      process.exit();
    } else {
      valErrors = '';
    }
    if (!testnet) testnet = 0;

    (async () => {
      try {
        const result = await utils.getKeys(seed, { account, number, password, format, testnet, verbose });
        if (result.issue) throw new Error(`ISSUE ${result.issue}`);
        if (format === 'list') {
          result.forEach((addr) => console.log(`${addr.address} ${addr.privKeyWIF}`));
        } else if (verbose) {
          console.log(JSON.stringify(result, undefined, 1));
        } else {
          const keys = result.map((addr) => ({ address: addr.address, privatekey: addr.privKeyWIF }));
          console.log(JSON.stringify(keys, undefined, 1));
        }
      } catch (error) {
        console.log(ERROR_DETAILS ? error : error.message.red);
      }
    })();
    break;
  }
  default:
    console.log('No command found. For command help: signtxtool help'.red);
}
