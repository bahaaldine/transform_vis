var _ = require('lodash');
var glob = require('glob');
var path = require('path');

module.exports = (directory) => {
  function getTuple(directory, name) {
    var func = require('../' + directory + '/' + name);
    return [name, require('../' + directory + '/' + name)];
  }

  var functions = _.map(glob.sync(path.resolve(__dirname, '../' + directory + '/*.js')), function (file) {
    var name = file.substring(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
    return getTuple(directory, name);
  });

  return functions;
};
