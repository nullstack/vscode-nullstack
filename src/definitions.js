const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function getLine(document, line) {
  return document.lineAt(line).text;
}

function isImportLine(line) {
  if (
    line.startsWith('import ') ||
    line.indexOf('require(') > -1
  ) {
    return ((line).match(/[`|'|"]([^]+)[`|'|"]/) || [])[1];
  }
}

function notRenderTag(line) {
  const trimLine = line.trim();
  return (
    !trimLine.startsWith('<') ||
    !trimLine[1].match(/^[A-Z]/)
  );
}

function getComponentName(line) {
  let symbol = line.substring(line.indexOf('<') + 1);
  return symbol.substring(0, symbol.match(/[/ ]/).index);
}

function getSymbolName(document, position) {
  const line = getLine(document, position.line);
  const filename = isImportLine(line);
  if (filename) {
    return (
      filename.substring(filename.lastIndexOf('.')).indexOf('/') < 0
        ? filename
        : filename + '.njs'
    );
  } else {
    if (notRenderTag(line)) return null;

    let symbol = getComponentName(line);
    let renderSym = `render${symbol}`;
    if (document.getText().indexOf(renderSym) === -1) {
      return symbol + '.njs';
    }
    let idx = [];
    for (let lineId = 0; lineId < document.lineCount; lineId++) {
      const character = getLine(document, lineId).indexOf(renderSym);
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
    const definitionPath = getSymbolName(document, position);
    if (!definitionPath) return null;

    const uri = document.uri;
    let filepath = null;
    let range = [0, 0];
    if (typeof definitionPath === 'string') {
      filepath = path.join(document.uri.fsPath, '../', definitionPath);

      if (!fs.existsSync(filepath)) return null;
    } else {
      if (definitionPath.length === 0) return null;
      filepath = uri.fsPath;
      range = definitionPath;
    }

    return new vscode.Location(
      uri.with({ path: filepath }),
      new vscode.Position(...range)
    );
  }
}

function newDefinition(definition) {
  return vscode.languages.registerDefinitionProvider(
    { language: "javascript" }, new definition()
  );
}

const definitions = newDefinition(NullstackDefinitionProvider);

module.exports = definitions;
