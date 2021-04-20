const fs = require('fs');
const Utils = {};

Utils.fileExists = function(url) {
  return fs.existsSync(url);
}

Utils.isDirectory = function(url) {
  return (
    Utils.fileExists(url) &&
    fs.lstatSync(url).isDirectory()
  );
}

Utils.resolvePath = function(root, url) {
  if (url.match(/^[@a-zA-Z]/)) {
    try {
      return require.resolve(`${root}/node_modules/${url}`);
    } catch {}
  }
  url = `${root}/${url}`;
  if (Utils.isDirectory(url)) {
    try {
      return require.resolve(`${url}/index.njs`);
    } catch {}
    try {
      return require.resolve(`${url}/index.js`);
    } catch {}
  }
  const njsFile = `${url}.njs`;
  if (Utils.fileExists(njsFile)) {
    return require.resolve(njsFile);
  }
  try {
    return require.resolve(url);
  } catch {
    return false;
  }
}

module.exports = Utils;