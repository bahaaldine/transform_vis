import _ from 'lodash';

module.exports = function (server) {
  require('./server/routes/functions.js')(server);

  var functions = require('./server/lib/load_functions')('plugins');

  function addFunction(func) {
    _.assign(functions, processFunctionDefinition(func));
  }

  function getFunction(name) {
    if (!functions[name]) throw new Error ('No such function: ' + name);
    return functions[name];
  }

  server.plugins.transform = {
    functions: functions,
    addFunction: addFunction,
    getFunction: getFunction
  };
};
 