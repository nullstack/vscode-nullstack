function cbClass() {
  return class {
    args = {};
    constructor(...args) { this.args = args; }
  }
};

module.exports = {
  languages: {
    registerDefinitionProvider: jest.fn().mockReturnValue(true)
  },
  Location: cbClass(),
  Position: cbClass()
};