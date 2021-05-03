const path = require('path');

const Helpers = {}

Helpers.mockDocument = (attr = {}) => ({
  getText: () => attr.text,
  lineAt: (i) => ({ text: attr.text.split('\n')[i] }),
  lineCount: attr.lineCount || 3,
  uri: {
    fsPath: path.join(__dirname, attr.fsPath || 'src/Application.njs'),
    with: ({ path }) => path
  }
});

module.exports = Helpers;