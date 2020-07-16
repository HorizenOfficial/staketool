const os = require('os');
const path = require('path');
const Table = require('table-layout');
require('colors'); // modifies String prototype
const pk = require('../package');
const content = require('./signcontent');

const getapp = () => {
  const n = process.argv[0].indexOf('node') !== -1;
  const p = n ? path.resolve() : process.argv[0];
  const name = path.basename(p);
  if (n) return { usage: `node ${name}`, ver: `${name}` };
  const rel = process.argv[0].replace(process.cwd(), process.cwd() === '/' ? '/' : '.');
  return { usage: rel, ver: name };
};

const app = getapp();

const desc = () => {
  console.log('');
  console.log(pk.description.green);
  console.log('');
};
const ver = () => {
  console.log('VERSION'.cyan);
  console.log(`  ${app.ver} v${pk.version}   ${os.platform()}-${os.arch()}   node ${process.version}`);
  console.log('');
};

const format = { padding: { left: '  ' } };

const genhelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} help [COMMAND]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Display help for [COMMAND] ');
};

const signtxhelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} signverificationtransaction [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Signs a raw transaction using output from "staketool createstakeverification" ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.signtx, format)).toString());
  console.log('');
  console.log('NOTES'.cyan);
  console.log((new Table(content.signtxNotes, format)).toString());
};

const keysfromseedhelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} keysfromseed  [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Shows addresses and private keys of a BIP39 Mnemonic seed phrase ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.keysfromseed, format)).toString());
  console.log('');
};
/**
 *
 * @param {string} command  command from cli
 * @param {string} arg3  the 1st argument after the commmand
 * @param {object} options  pass optional key:value
 */
exports.main = (command, arg3, options) => {
  const { verbose } = options;
  if (verbose) console.log('HELP: ', command, arg3);
  if ((arg3 === 'help' && command === 'signverificationtransaction')
    || (arg3 === 'signverificationtransaction' && command === 'help')) return signtxhelp();

  if ((arg3 === 'help' && command === 'keysfromseed')
    || (arg3 === 'keysfromseed' && command === 'help')) return keysfromseedhelp();

  if (arg3 === 'help') return genhelp();

  // default message
  desc();
  ver();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} [COMMAND]`.yellow);
  console.log('');
  console.log('COMMANDS'.cyan);
  const detail = content.main;
  detail.push({ command: 'help'.yellow, desc: `Display help for ${app.ver}. Use '${app.usage} help [COMMAND]' for help about [COMMAND]` });
  console.log((new Table(detail, format)).toString());
  return null;
};
