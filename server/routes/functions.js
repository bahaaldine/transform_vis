var _ = require('lodash');
var serialize = require('serialize-to-js').serialize;

var echart = require('echarts');

module.exports = function (server) {
  server.route({
    method: 'GET',
    path: '/api/transform/functions',
    handler: function (request, reply) {
      var opts = { reference: true };

      var functionArray = _.map(server.plugins.transform.functions, fn => { 
        return {
          name: fn[0],
          deps: serialize(fn[1].deps, opts),
          func: serialize(fn[1].func, opts)
        }
      });
      reply(_.sortBy(functionArray, 'name'));
    }
  });

  server.route({
    method: 'GET',
    path: '/api/transform/dependency',
    handler: function (request, reply) {
      Function.prototype.toJSON = function() { return ""+this }
      reply({ serialized: JSON.stringify(require(request.query.name))});
    }
  });
};
