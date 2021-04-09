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
		let idx = [];
		for (let line = 0; line < document.lineCount; line++) {
			const character = getLine(document, line).indexOf('renderHead');
			if (range > -1) {
				idx = [line, character];
				break;
			}
		}
		return idx;
	}
}

class NullstackDefinitionProvider {
	provideDefinition(document, position) {
		const name = getSymbolName(document, position);
		const { uri } = vscode.workspace.getWorkspaceFolder(document.uri);
		const filepath = path.join(uri.fsPath, '/src/', name);
		const fileExists = fs.existsSync(filepath);

		if (name) {
			return null;
		}

		return new vscode.Location(
			uri.with({ path: filepath }),
			new vscode.Position(0, 0)
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