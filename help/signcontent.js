module.exports.main = [
  {
    command: 'signverificationtransaction '.yellow,
    desc: 'Signs a raw transaction using output from "staketool createstakeverification"',
  },
  {
    command: 'keysfromseed'.yellow,
    desc: 'Shows addresses and private keys of a BIP39 Mnemonic seed phrase',
  },
];

module.exports.signtx = [
  {
    command: '-sys=| --system=super|secure|testnet'.yellow,
    desc: '(required) tracking system where stake is used',
  },
  {
    command: '-p=  | --privkey=myprivatekeyWIF'.yellow,
    desc: '(optional) stakeaddress private key in standard WIF format, optionally environment variable PRIVKEY can be used instead, see NOTES',
  },
  {
    command: '-i=  | --inputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json] override default input file from previous steps',
  },
  {
    command: '-o=  | --outputfile=path/filename'.yellow,
    desc: '(optional) [default: ./verificationfiles/<system>/<stakeFirst8Chars>_<satoshis>.json] override default filename or path/filename',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];

module.exports.signtxNotes = [
  { desc: 'If the --privkey switch and the PRIVKEY environment variable are both omitted, the app will prompt for the private key to be entered.' },
  { desc: 'One of the three methods to enter the private key must be used.' },
  { desc: '' },
  { desc: 'The private key can be obtained from the wallet containing the stake address or "zen-cli dumpprivkey mystakeaddr".' },
  { desc: 'If only a wallet seed phrase is available, "signtxtool keysfromseed" or a tool like https://iancoleman.io/bip39/' },
  { desc: 'can be used to obtain the private key of the stakeaddress.' },
  { desc: '' },
  { desc: 'USING OFFLINE'.cyan },
  { desc: 'When using this tool to sign on a another system (other than the system where the stake verification was done)' },
  { desc: 'the corresponding "./verificationfiles/<system>" folder (including the inprocess.json file) should be copied too.' },
  { desc: '<system> is either: super, secure, or testnet.' },
  { desc: 'If not, the inputfile option should be used with the verifcation file. e.g. -i="/mypath/zthC3Poh_264954.json".' },
  { desc: 'The verication file will be updated with the signed transaction.' },
  { desc: 'Copy the verification file back to the original system (into the folder) and continue with sendtxandstakeverification.' },
];

module.exports.keysfromseed = [
  {
    command: '-s=  | --seed="BIP39 seed phrase words"'.yellow,
    desc: '(required) the BIP39 seed phrase',
  },
  {
    command: '-net=| --network=mainnet|testnet'.yellow,
    desc: '(optional) The ZEN network to use (default: mainnet)',
  },
  {
    command: '-a=  | --account=integer'.yellow,
    desc: '(optional) [default: 0] the account to use for the derivation path',
  },
  {
    command: '-n=  | --number=integer'.yellow,
    desc: '(optional) [default: 10] the quantity of addresses to return',
  },
  {
    command: '-p=  | --password="BIP39 Passphrase"'.yellow,
    desc: '(optional) the BIP39 Passphrase',
  },
  {
    command: '-f=  | --format=json|list'.yellow,
    desc: '(optional) [default: json] format the output, displays either JSON or a list of one zen address and WIF private key per console line',
  },
  {
    command: '-v   | --verbose'.yellow,
    desc: '(optional) displays additional messages to help with troubleshooting',
  },
];
