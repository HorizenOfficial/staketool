// Commands and/or descriptions of how to the transaction manually

/**
 *
 * @param {object} outputObj { stake, amount, satoshis, request }
 */
function zencliVerification(stakeObj, fee) {
  const cmd = `zen-cli z_sendmany "${stakeObj.stake}"`;
  const to = `[{"address":"${stakeObj.stake}","amount":${stakeObj.amount}}]`;

  console.log('ZEN-CLI COMMAND: ', `${cmd} '${to}' 0 ${fee} true`);
  console.log(' OR  ');
  console.log('ZEN-CLI COMMAND ESCAPED: ', `${cmd} '${to.replace(/"/g, '\\"')}' 0 ${fee} true`);
  console.log(' Depending on your OS and shell the escaped payto address list may need to start and end with double quotes');
}

/**
 *
 * @param {object} stakeObj  contains stake and amount
 * @param {number} fee  the fee to use in the transaction;
 */
exports.listSendTxInstructions = (stakeObj, fee, link) => {
  zencliVerification(stakeObj, fee);
  console.log(' OR  ');
  console.log(`Use your wallet or other means to send ${stakeObj.amount} FROM your stake address ${stakeObj.stake} `
  + 'to any other address or back to the stake address. Use the resulting transaction id in the next step. ');
  console.log(`Additional instructions: ${link}`);
};


/**
 *
 * @param {string} serializedRawTx  fromr step 1
 * @param {array} inputs  array of utxo to be used as inputs for this tx
 */
exports.listSignRawTxInstructions = (serializedRawTx, inputs) => {
  const cmd = `zen-cli signrawtransaction "${serializedRawTx}" '${JSON.stringify(inputs)}'`;
  console.log('ZEN-CLI COMMAND: ', `${cmd} '["YOUR PRIVATE KEY HERE"]'`);
};
