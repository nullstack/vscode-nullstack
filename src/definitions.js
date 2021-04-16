const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

function getLine(document, line) {
  return document.lineAt(line).text;
}

function getSymbolName(document, position) {
  const line = getLine(document, position.line);
  if (line.startsWith('import ')) {
    let filename = line.substring(
      line.indexOf("from ") + 6,
      line.replace(';', '').length - 1
    );
    return (
      filename.substring(filename.lastIndexOf('.')).indexOf('/') < 0
        ? filename
        : filename + '.njs'
    );
  } else {
    const trimLine = line.trim();
    if (
      !trimLine.startsWith('<') ||
      !trimLine[1].match(/^[A-Z]/)
    ) return null;
    let symbol = line.substring(line.indexOf('<') + 1);
    symbol = symbol.substring(0, symbol.match(/[/ ]/).index);
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
