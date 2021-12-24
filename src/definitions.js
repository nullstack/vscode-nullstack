const vscode = require('vscode');
const path = require('path');
const Utils = require('./utils');
const Defs = {};

Defs.getLine = function(document, line) {
  return document.lineAt(line).text;
}

Defs.isImportLine = function(document, position) {
  for (let i = position; i < document.lineCount; i++) {
    let line = Defs.getLine(document, i).trim();
    if (
      line.startsWith('import ') ||
      line.indexOf('require(') > -1 ||
      line.indexOf('}') > -1
    ) {
      return ((line).match(/[`|'|"]([^]+)[`|'|"]/) || [])[1];
    }
  }
}

Defs.notRenderTag = function(line) {
  const trimLine = line.trim();
  return (
    !trimLine.startsWith('<') ||
    !trimLine[1].match(/^[A-Z]/)
  );
}

Defs.getComponentName = function(line) {
  let symbol = line.substring(line.indexOf('<') + 1);
  return symbol.substring(0, symbol.match(/[/ >]/).index);
}

Defs.getSymbolName = function(document, position) {
  const filename = Defs.isImportLine(document, position.line);
  if (filename) {
    return filename;
  } else {
    const line = Defs.getLine(document, position.line);
    if (Defs.notRenderTag(line)) return null;

    let symbol = Defs.getComponentName(line);
    let renderSym = `render${symbol}`;
    if (document.getText().indexOf(renderSym) === -1) {
      return symbol;
    }
    let idx = [];
    for (let lineId = 0; lineId < document.lineCount; lineId++) {
      const character = Defs.getLine(document, lineId).indexOf(renderSym);
      if (character > -1) {
        idx = [lineId, character];
        break;
      }
    }
    return idx;
  }
}

class NullstackDefinitionProvider {
  provideDefinition(document, position) {
    const definitionPath = Defs.getSymbolName(document, position);
    if (!definitionPath) return null;

    const uri = document.uri;
    let filepath = null;
    let range = [0, 0];
    if (typeof definitionPath === 'string') {
      const root = path.join(document.uri.fsPath, '../');
      filepath = Utils.resolvePath(root, definitionPath);

      if (!filepath) return null;
      if (filepath.endsWith('.njs') || filepath.endsWith('.nts')) {
        range = Utils.findSymPos(document, position, filepath) || range;
      }
    } else {
      filepath = uri.fsPath;
      range = definitionPath;
    }

    return new vscode.Location(
      uri.with({ path: filepath }),
      new vscode.Position(...range)
    );
  }
}

Defs.newDefinition = function(language, definition) {
  return vscode.languages.registerDefinitionProvider(
    { language }, new definition()
  );
}

Defs.providers = [NullstackDefinitionProvider];
Defs.definitions = function() {
  return ['javascript', 'typescriptreact'].map(lang => {
    return Defs.newDefinition(lang, Defs.providers[0])
  });
}

module.exports = Defs;
