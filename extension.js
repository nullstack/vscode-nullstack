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
			line.indexOf("/") + 1,
			line.lastIndexOf("'")
		);
		return (
			filename.indexOf('.') > -1
				? filename
				: filename + '.njs'
		);
	} else {
		if (!line.trim().startsWith('<')) return null;
		let symbol = line.substring(line.indexOf('<') + 1);
		symbol = symbol.substring(0, symbol.match(/[/ ]/).index);
		let renderSym = `render${symbol}`;
		if (document.getText().indexOf(renderSym) === -1) {
			return symbol + '.njs';
		}
		let idx = [];
		for (let line = 0; line < document.lineCount; line++) {
			const character = getLine(document, line).indexOf(renderSym);
			if (character > -1) {
				idx = [line, character];
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

		let uri = null;
		let filepath = null;
		let range = [0, 0];
		if (typeof definitionPath === 'string') {
			uri = vscode.workspace.getWorkspaceFolder(document.uri).uri;
			filepath = path.join(uri.fsPath, '/src/', definitionPath);

			const fileExists = fs.existsSync(filepath);
			if (!fileExists) return null;
		} else {
			if (definitionPath.length === 0) return null;
			uri = document.uri;
			filepath = uri.fsPath;
			range = definitionPath;
		}

		return new vscode.Location(
			uri.with({ path: filepath }),
			new vscode.Position(...range)
		);
	}
}

function activate(context) {
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(
		{ language: "javascript" }, new NullstackDefinitionProvider()
	));
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}