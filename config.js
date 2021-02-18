exports.config = {
  testnet: {
    explorerURL: 'https://explorer-testnet.horizen.io/api',
    server: 'https://securenodes.testnet.zensystem.io',
    anchorBlock: 677000,
    anchorHash: '0008d95b1d2631edaffaaacb1afa43e1ebca97347c682795b042fda1b09a848c',
    defaultFee: 0.0001,
  },
  mainnet: {
    explorerURL: 'https://explorer.horizen.io/api',
    super: 'https://supernodes.zensystem.io',
    secure: 'https://securenodes.zensystem.io',
    anchorBlock: 760000,
    anchorHash: '0000000004ae3b44b9643ef95b09f980cf11f149b902217ccbcdcf72984a2990',
    defaultFee: 0.0001,
  },
  savePath: './verificationfiles',
  instructionslink: 'https://horizenofficial.atlassian.net/wiki/spaces/ZEN/pages/1458667521/Staketool+-+Intro+Setup',
};
