const { definitions } = require('./definitions');

function activate(context) {
  context.subscriptions.push(definitions());
}

function deactivate() { }

module.exports = {
  activate,
  deactivate
}