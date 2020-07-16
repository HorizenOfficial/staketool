const os = require('os');
const path = require('path');
const Table = require('table-layout');
require('colors'); // modifies String prototype
const pk = require('../package');
const content = require('./content');

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
  console.log(' Display help for [COMMAND] ');
};

const createstakehelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} createstakeverification [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Creates a stake verification request and optionally creates a raw transaction or outputs instructions to send funds ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.createstake, format)).toString());
  console.log('');
  console.log('NOTES'.cyan);
  console.log((new Table(content.createstakeNotes, format)).toString());
};

const sendtxhelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} sendtxandstakeverification [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Broadcasts the verification transaction to the blockchain and the verification request to the tracking server ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.sendtx, format)).toString());
  console.log('');
  console.log('NOTES'.cyan);
  console.log((new Table(content.sendtxNotes, format)).toString());
};

const liststakeshelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} liststakes [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  List stakeaddresses and their verification status ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.liststakes, format)).toString());
  console.log('');
  console.log('NOTES'.cyan);
  console.log((new Table(content.liststakesNotes, format)).toString());
};

const getbalancehelp = () => {
  desc();
  console.log('USAGE'.cyan);
  console.log(`  ${app.usage} getbalance [OPTIONS]`.yellow);
  console.log('');
  console.log('DESCRIPTION'.cyan);
  console.log('  Display confirmed balance of an address ');
  console.log('');
  console.log('OPTIONS'.cyan);
  console.log((new Table(content.getbalance, format)).toString());
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
  if ((arg3 === 'help' && command === 'createstakeverification')
    || (arg3 === 'createstakeverification' && command === 'help')) return createstakehelp();

  if ((arg3 === 'help' && command === 'sendtxandstakeverification')
    || (arg3 === 'sendtxandstakeverification' && command === 'help')) return sendtxhelp();

  if ((arg3 === 'help' && command === 'liststakes')
    || (arg3 === 'liststakes' && command === 'help')) return liststakeshelp();

  if ((arg3 === 'help' && command === 'getbalance')
    || (arg3 === 'getbalance' && command === 'help')) return getbalancehelp();

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
