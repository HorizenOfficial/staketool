const fs = require('fs-extra');
const { config } = require('../config.js');


/**
 *
 * @param {string} path filename or path with filename
 * @param {string} system system name to use in path: testnet, super, or secure
 */
const checkPath = (path, system) => {
  // check if a path was entered with the file name
  if (path.indexOf('/') > 0 || path.indexOf('\\') > 0) {
    return path;
  }
  const dir = `${config.savePath || './verificationfiles'}/${system}/`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return `${dir}/${path}`;
};


/**
 *
 * @param {JSON} data  object
 * @param {string} path  file name or full path with filename
 * @param {string} system  system name to use in path: testnet, super, or secure
 *
 */
exports.saveFile = (data, path, system) => {
  const filepath = checkPath(path, system);
  let filehandle;
  try {
    filehandle = fs.writeFileSync(filepath, JSON.stringify(data, undefined, 2));
  } catch (err) {
    console.error(err.message);
  }
  return filehandle;
};

/**
 *
 *  @param {string} path  full path from command line otherwise filename from inprocess.js
 *  @param {string} system  system name to use in path: testnet, super, or secure
 *
 *  returns file contents as string
 */
exports.getFile = (path, system) => {
  const filepath = checkPath(path, system);
  let file;
  try {
    file = fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    console.error(err);
  }
  return file;
};
