const path = require('path');
const mock = require('mock-fs');
const Utils = require('../src/utils');

describe("fileExists", () => {

  function runFileExists() {
    return Utils.fileExists(path.join(__dirname, 'index.njs'));
  }

  it('returns true if file exists', () => {
    mock({ [__dirname]: { 'index.njs': '' } });
    expect(runFileExists()).toBeTruthy();
  });

  it('returns false if file doesn\'t exists', () => {
    expect(runFileExists()).toBeFalsy();
  });

});

describe("isDirectory", () => {

  function runIsDirectory(url) {
    jest.spyOn(Utils, 'fileExists').mockReturnValue(true);
    return Utils.isDirectory(path.join(__dirname, url));
  }

  it('returns true if is directory', () => {
    mock({ [__dirname]: { 'folder': { 'index.njs': '' }}});
    expect(runIsDirectory('folder')).toBeTruthy();
  });

  it('returns false if isn\'t directory', () => {
    mock({ [__dirname]: { 'index.njs': '' }});
    expect(runIsDirectory('index.njs')).toBeFalsy();
  });

});

describe("resolvePath", () => {

  it('is a shortcut to coreResolvePath with resolve', () => {
    jest.spyOn(Utils, 'coreResolvePath');
    Utils.resolvePath('root', 'url');
    expect(Utils.coreResolvePath).toBeCalled();
    expect(Utils.coreResolvePath).toBeCalledWith(
      expect.any(Function), 'root', 'url'
    );
  });

  function genResolveMock() {
    return jest.fn().mockImplementation(url => {
      url = path.join(url);
      if (Utils.fileExists(url)) return url;
      throw 'MODULE_NOT_FOUND';
    });
  }

  function runResolvePath(url, resolve) {
    return Utils.coreResolvePath(
      resolve || require.resolve,
      __dirname,
      url
    );
  }

  it('returns fullPath of node_module with main', () => {
    const packageDir = {
      'package.json': '{"main": "index.njs"}',
      'index.njs': ''
    };
    mock({ [__dirname]: {
      'node_modules': {
        'package': packageDir,
        '@package': packageDir
      }
    }});
    expect(runResolvePath('package/index.njs')).toBeTruthy();
    expect(runResolvePath('@package/index.njs')).toBeTruthy();
  });

  function runResolvePathIndex(folder, endPath = '') {
    const resolve = genResolveMock();

    const myPath = path.join(__dirname, folder, endPath);
    const fullPath = runResolvePath(folder, resolve);
    expect(fullPath).toBe(myPath);
  }

  it('returns fullPath of folder with index', () => {
    mock({ [__dirname]: {
      'src': {
        'index.js': '',
        'folderJS': { 'index.js': '' },
        'folderNJS': { 'index.njs': '' }
      }
    }});

    runResolvePathIndex('./src', '/index.js');
    runResolvePathIndex('./src/folderJS', '/index.js');
    runResolvePathIndex('./src/folderNJS', '/index.njs');
  });

  it('returns fullPath of njs file if exists', () => {
    mock({ [__dirname]: {
      'src': {
        'Comp.njs': ''
      }
    }});
    const resolve = genResolveMock();
    const fullPath = runResolvePath('./src/Comp', resolve);
    const myPath = path.join(__dirname, './src/Comp.njs');
    expect(fullPath).toBe(myPath);
  });

  it('defaults to fullPath of file or false', () => {
    mock({ [__dirname]: {
      'src': {
        'Comp.scss': ''
      }
    }});
    const resolve = genResolveMock();
    const fullPath = runResolvePath('./src/Comp.scss', resolve);
    const myPath = path.join(__dirname, './src/Comp.scss');
    expect(fullPath).toBe(myPath);

    const falsePath = runResolvePath('./src/NotExist', resolve);
    expect(falsePath).toBeFalsy();
  });

});

afterEach(() => {
  mock.restore();
  jest.restoreAllMocks();
  jest.resetModules();
});
