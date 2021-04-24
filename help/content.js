
module.exports.main = [
  {
    command: 'createstakeverification'.yellow,
    desc: 'Creates a stake verification request and optionally creates a raw transaction or outputs instructions to send funds',
  },
  {
    command: 'sendtxandstakeverification'.yellow,
    desc: 'Broadcasts the verification transaction to the blockchain and the verification request to the tracking server',
  },
  {
    command: 'cancelstakeverification'.yellow,
    desc: 'Cancel a verification request that is confirming or verified',
  },
  {
    command: 'liststakes'.yellow,
    desc: 'List stakeaddresses and their verification status',
  },
  {
    command: 'getbalance'.yellow,
    desc: 'Display confirmed balance of an address',
  }];

module.exports.createstake = [
  {
    command: '-s=  | --stake=stakeaddress'.yellow,
    desc: '(required) stakeaddress to verify',
  },
  {
    command: '-p=  | --payaddress=\'[]\''.yellow,
    desc: '(required) JSON array of payaddress objects, see NOTES',
  },
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system must be: super, secure, or testnet',
  },
  {
    command: '-m=  | --method=tool|zen-cli|instructions'.yellow,
    desc: '(optional) [default: tool] method to use to create and sign the transaction, see NOTES',
  },
  {
    command: '-o=  | --outputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json] override default filename or path/filename',
  },
  {
    command: '-ez= | --extrazen=zen'.yellow,
    desc: '(optional) an amount in zen to add to the verification transaction, see NOTES',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.createstakeNotes = [
  {
    command: 'Payaddress:',
    desc: 'The addresses in --payaddress need to be 1 to 5 valid transparent zen addresses. The sum of all "pct" needs to equal 100.00. A payaddress can be'
      + ' the same as the stakeaddress.',
  },
  {
    command: '',
    desc: 'Some platforms may not need to have quotes escaped or may not have to encapsulate the array in single quotes.',
  },
  {
    command: '',
    desc: 'Example:--payaddress=\'[{"address":"ztcXfXAdPoDtyBJhzNmC3DzUkq3r22phsbt","pct":66.66},'
      + '{"address":"zrFzxutppvxEdjyu4QNjogBMjtC1py9Hp1S","pct":33.34}]\'',
  },
  {
    command: '',
    desc: '',
  },
  {
    command: 'Tracking System',
    desc: 'The system where the stake address will be used: super, secure, or testnet.  A stake address cannot be used for both secure and super node systems.',
  },
  {
    command: '',
    desc: '',
  },
  {
    command: 'Method:',
    desc: 'Option "tool" creates a raw transaction to be used by the tool (using zencashjs) and returns transaction and verification data '
      + 'to the tracking file. Signtxtool can be used to sign the transaction with the private key of the stake address.',
  },
  {
    command: '',
    desc: 'Option "zen-cli" displays a zen-cli command to run manually that creates a raw transaction to sign using the zen-cli signrawtransaction command.',
  },
  {
    command: '',
    desc: 'Option "instructions" displays links to documentation on how to create the transaction '
      + 'using other methods like Sphere by Horizen or zen-cli z_sendmany.',
  },
  {
    command: '',
    desc: '',
  },
  {
    command: 'Extrazen:',
    desc: 'By default the tool creates a transaction smaller than 1 zen, in some circumstances this might be lower than a minimum transaction size.',
  },
  { desc: 'With this option you can specifiy the minimum amount to send in the verification transaction. Must be a whole number (no decimals).' },
];


module.exports.sendtx = [
  {
    command: '-a=  | --apikey=apisubkey'.yellow,
    desc: '(required) a Super Node API sub key. Environment variable APIKEY can be used instead.',
  },
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system where stake is used',
  },
  {
    command: '-i=  | --inputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override default input file from previous steps',
  },
  {
    command: '-s=  | --signedtxhex=mysignedtxhex'.yellow,
    desc: '(optional) [default: parsed from inputfile] hexadecimal signed serialized raw transaction, '
      + 'this is the output from a zen-cli signrawtransaction command',
  },
  {
    command: '-tx= | --txid=transactionidhex'.yellow,
    desc: '(optional) the transaction id of a signed transaction that has already been broadcasted to the network',
  },
  {
    command: '-o=  | --outputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<stakeFirst8Chars>_<satoshis>.json] override default filename or path/filename',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.sendtxNotes = [
  {
    desc: 'The API key must be a sub key, not a main key. It may be obtained from your hosting provider or created '
      + 'on the API Settings page of the Tracking System.',
  },
  { desc: '' },
  {
    desc: 'If -signedtxhex is not used, the current verification file is checked for a signed raw transaction from '
      + 'the previous step and sent to the blockchain.',
  },
  { desc: '' },
  { desc: 'If -txid is used, it is assumed that the transaction has already been broadcasted to the network by this tool or zen-cli or a wallet.' },
  { desc: '' },
  { desc: 'When this step completes the transaction id (txid) is written back to the verification tracking file.' },
  { desc: 'The tracking server replies with whether the stake verification request is created (status=confirming) or if there is an error.' },
  { desc: '' },
  { desc: 'If "sendtxandstakeverification" is run again and the txid is present, the tool will check the tracking server for status.' },
  { desc: '' },
  { desc: 'The tracking system waits for a number of block confirmations before changing the status to verified.' },
  { desc: 'Once verified a request is set to active after the end of the current earning period. Any existing active is set to replaced.' },
  {
    desc: 'The current status can also be found by using the liststakes command or by checking the My Stakes page on the tracking server '
      + 'web site after setting up your API key.',
  },
  { desc: '' },
  {
    desc: 'If the transaction is not found by the tracking server within 4 hours the request is set to failed and '
      + 'the process will need to be repeated with a new transaction.',
  },
];

module.exports.liststakes = [
  {
    command: '-a=  | --apikey=apisubkey'.yellow,
    desc: '(required) a Super Node API sub key. Environment variable APIKEY can be used instead.',
  },
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system where stake is used',
  },
  {
    command: '-s=  | --stake=stakeaddress'.yellow,
    desc: '(optional) filter by single stakeaddress',
  },
  {
    command: '-st= | --status=confirming|verified|cancelled|active|replaced|failed|all'.yellow,
    desc: '(optional) filter by status',
  },
  {
    command: '-f=  | --format=json|list'.yellow,
    desc: '(optional) [default: json] format the output. Displays either JSON or a list of one stake with details per console line',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.liststakesNotes = [
  { desc: 'Default is a list of all confirming, verified, and active stakes.  Also includes payto addresses and node ids with FQDNS (once configured).' },
];

module.exports.getbalance = [
  {
    command: '-s=  | --stake=stakeaddress'.yellow,
    desc: '(required) the stakeaddress to show the balance of',
  },
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system where stake is used',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];


module.exports.cancelstake = [
  {
    command: '-a=  | --apikey=apisubkey'.yellow,
    desc: '(required) a Super Node API sub key. Environment variable APIKEY can be used instead.',
  },
  {
    command: '-id= | --idstake=stakeid'.yellow,
    desc: '(required) stake id to cancel',
  },
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system where stake is used',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.cancelstakeNotes = [
  { desc: 'Only status \'confirming\' and \'verified\' requests can be cancelled. Use \'liststakes\' command to get the stake id.' },
];
