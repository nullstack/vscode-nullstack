const Defs = require('../src/definitions');
const path = require('path');
const mock = require('mock-fs');
const Utils = require('../src/utils');
const { mockDocument } = require('./helpers');

describe('Definitions', () => {
  const Provider = (new Defs.providers[0]()).provideDefinition;
  function testGoTo(text, expected = null, lineCount = 1, position) {
    position = position || { line: 0, character: 0 };
    let document = mockDocument({ text, lineCount });
    let Location = Provider(document, position);
    expect(Location).toEqual(expected);
  }

  test('no goTo if no definitionPath/filepath', () => {
    testGoTo('<a></a>');
    testGoTo('import Comp from "./null/null.njs"');
  });

  const nullImport = `import nullstack from 'nullstack';`;

  test('goTo Location if importLine', () => {
    const classHome = `class Home extends Nullstack {}`;
    mock({ [__dirname]: {
      'src': {
        'Application.scss': '',
        'utils': {
          'index.njs': classHome,
          'Home.njs': classHome
        },
        'node_modules': { 'package': { 'index.njs': classHome } }
      }
    }});

    const text = `${nullImport}
      import './Application.scss';
      import Home from './utils/Home';
      import Home from './utils';
      const {
        Home
      } = require(\`@package\`);
    `;

    function spyResolve(endPath) {
      jest.spyOn(Utils, 'resolvePath')
        .mockImplementation((root, dPath) => {
          dPath = dPath.match(/^[@a-zA-Z]/)
            ? 'node_modules/package/index.njs'
            : endPath;
          let url = path.join(root, dPath);
          return Utils.fileExists(url)
            ? url
            : null;
        });
    }

    const goToPath = (url) => path.join(__dirname, 'src', url);
    function runGoTo(gPath, pos, symChar) {
      symChar = typeof symChar === 'number' ? symChar : 6;
      spyResolve(gPath);
      testGoTo(text,
        { args: [goToPath(gPath), { args: [0, symChar] }] }, 7, pos
      );
    }

    runGoTo('Application.scss', { line: 1, character: 11 }, 0);
    runGoTo('utils/Home.njs', { line: 2, character: 8 });
    runGoTo('utils/index.njs', { line: 3, character: 8 });
    runGoTo('node_modules/package/index.njs', { line: 4, character: 3 });
  });

  test('goTo Location if innerComponent', () => {
    const text = `${nullImport}\n
class Application extends Nullstack {
  renderHead() {
    return <head></head>
  }
  render() {
    return (
      <>
        <Head/>
        <Head />
        <Head>
          test
        </Head>
      </>
    )
  }
}
export default Application;
    `;

    const compPath = path.join(__dirname, 'src/Application.njs');
    function runGoTo(pos) {
      testGoTo(text,
        { args: [compPath, { args: [3, 2] }] }, 11, pos
      );
    }
    runGoTo({ line: 9, character: 10 });
    runGoTo({ line: 10, character: 10 });
    runGoTo({ line: 11, character: 10 });
  });

});

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
  mock.restore();
});