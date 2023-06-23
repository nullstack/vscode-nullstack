const Defs = require('../src/definitions');
const vscode = require('vscode');
const { mockDocument } = require('./helpers');

it('definitions() registers list of providers', () => {
  const providers = Defs.definitions();

  expect(vscode.languages.registerDefinitionProvider).toBeCalledTimes(2)

  const languages = ["javascriptreact", "typescriptreact"]
  for (const language of languages) {
    expect(vscode.languages.registerDefinitionProvider)
      .toBeCalledWith({ language }, new Defs.providers[0]());
  }
  expect(providers).toStrictEqual([true, true]);
});

it('getLine() returns text of line', () => {
  const text = 'line1\nline2';
  const { lineAt } = mockDocument({ text });
  const document = { lineAt };

  const line = Defs.getLine(document, 1);
  expect(line).toBe(lineAt(1).text);
});

describe('isImportLine()', () => {
  function testIsImport(line) {
    Defs.getLine = jest.fn().mockReturnValue(line);
    const document = { lineCount: 3 };
    const filename = Defs.isImportLine(document, 1);
    expect(filename).toBe('./Comp');
  }

  const importLineCases = [
    ['quota', '\''],
    ['double-quota', '"'],
    ['template-quota', '`']
  ];
  test.each(importLineCases)(
  'isImportLine() tests and returns between %s', (_, q) => {
    const quota = `import Comp from ${q}./Comp${q}`;
    testIsImport(quota);
  });

  const importStyleCases = [
    ['ES6 import', 'import "./Comp"'],
    ['require()', 'const Comp = require("./Comp")']
  ];
  test.each(importStyleCases)(
  'isImportLine() understands %s style', (_, line) => {
    testIsImport(line);
  });
});

it('notRenderTag() tests if not innerComponent', () => {
  const notRender = Defs.notRenderTag(' <a> link </a> ');
  expect(notRender).toBeTruthy();

  const render = Defs.notRenderTag(' <Comp> ');
  expect(render).toBeFalsy();
});

describe('getComponentName()', () => {
  function testComponentName(afterName) {
    const name = 'Comp';
    const Comp = Defs.getComponentName(` <${name}${afterName}> `);
    expect(Comp).toBe(name);
  }

  it('getComponentName() extracts innerComponent name', () => {
    testComponentName('');
  });

  const componentNameCases = [
    ['name with space', ' '],
    ['name with bar', '/'],
    ['name with space and bar', ' /']
  ];
  test.each(componentNameCases)(
  'getComponentName() extracts %s', (_, afterName) => {
    testComponentName(afterName);
  });
});

describe('getSymbolName()', () => {
  it('getSymbolName() returns filename of imported', () => {
    Defs.getLine = jest.fn().mockReturnValue('import Comp from "./Comp"');

    const documentPosition = [{ lineCount: 3 }, { line: 1 }];
    const filename = Defs.getSymbolName(...documentPosition);
    expect(filename).toBe('./Comp');
  });

  it('getSymbolName() returns innerComponent position', () => {
    const document = {
      getText: () => 'render()\nrenderComp()',
      lineCount: 2
    };
    const renderNames = document.getText().split('\n');
    Defs.getLine = jest.fn()
      .mockReturnValueOnce('<Comp/>')
      .mockReturnValueOnce(renderNames[0])
      .mockReturnValueOnce(renderNames[1]);

    const position = Defs.getSymbolName(document, {});
    expect(position).toStrictEqual([1, 0]);
  });

  it('getSymbolName() returns rendered Component filename', () => {
    const document = {
      getText: () => 'render()'
    };
    Defs.getLine = jest.fn().mockReturnValueOnce('<Comp/>');

    const filename = Defs.getSymbolName(document, {});
    expect(filename).toBe('Comp');
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
});