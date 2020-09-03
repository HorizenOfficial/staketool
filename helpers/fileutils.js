const fs = require('fs-extra');
const { config } = require('../config.js');


/**
 *
 * @param {string} path filename or path with filename
 */
const checkPath = (path) => {
  // check if a path was entered with the file name
  if (path.indexOf('/') > 0 || path.indexOf('\\') > 0) {
    return path;
  }
  const dir = config.savePath || './verificationfiles';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return `${dir}/${path}`;
};


/**
 *
 * @param {JSON} data  object
 * @param {string} path  file name or full path with filename
 */
exports.saveFile = (data, path) => {
  const filepath = checkPath(path);
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
 *  @param {string} path  full path otherwise default from config
 *
 *  returns file contents as string
 */
exports.getFile = (path) => {
  const filepath = checkPath(path);
  let file;
  try {
    file = fs.readFileSync(filepath, 'utf8');
  } catch (err) {
    console.error(err);
  }
  return file;
};
