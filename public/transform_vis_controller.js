const {SaferEval} = require('safer-eval')
import _ from 'lodash';
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';
import uiModules from 'ui/modules';
import chrome from 'ui/chrome';
const deserialize = require('serialize-to-js').deserialize;
const Mustache = require('mustache')
const module = uiModules.get('kibana/transform_vis', ['kibana']);

require('plugins/transform_vis/common/api');
require('plugins/transform_vis/directives/refresh_hack');

module.controller('TransformVisController', function ($scope, $sce, Private, timefilter, es, config, indexPatterns, responseService, transformApiService, pluginService) {

	transformApiService.getFunctions().then( response => {
    _.forEach( response.data, fn => {
      const safer = new SaferEval();
      var code = "{d: new Date('1970-01-01'), b: new Buffer('data')}"
      var res = safer.runInContext(code)
			pluginService.setPlugin(fn.name, saferEval(fn.func), saferEval(fn.deps));
		});
	});

  const queryFilter = Private(require('ui/filter_bar/query_filter'));
  const dashboardContext = Private(require('plugins/timelion/services/dashboard_context'));
   
  $scope.options = chrome.getInjected('transformVisOptions');

  $scope.applyHTML = function() {
    if ($scope.options.allow_unsafe) {
		 	return $sce.trustAsHtml($scope.vis.display);
		} else {
			return $scope.vis.display;
		}
  }
   
  $scope.refreshConfig = function() {

	indexPatterns.get($scope.vis.params.outputs.indexpattern).then( function (indexPattern) {
		$scope.vis.indexPattern = indexPattern;
	}).then($scope.search);

    }
     
    $scope.setDisplay = function(text) {
	    $scope.vis.display = text;
    }

    $scope.search = function() {

	var context = dashboardContext();
	var index = $scope.vis.params.outputs.indexpattern;

	// This is part of what should be a wider config validation
	if (!(typeof index === 'string' || index instanceof String)) {
		$scope.setDisplay("<center><i>No Index Pattern</i></center>");
		return;
        }    

	if ($scope.vis.indexPattern.timeFieldName) {
	 const timefilterdsl = { range:{} };
	 timefilterdsl.range[$scope.vis.indexPattern.timeFieldName] = { gte: timefilter.time.from, lte: timefilter.time.to };
	 context.bool.must.push(timefilterdsl);
	}
	
  var body = JSON.parse( $scope.vis.params.outputs.querydsl.replace("\"_DASHBOARD_CONTEXT_\"",JSON.stringify(context)) );

	es.search({
		index: index,
		body: body
	}, function (error, response) {
		if (error) {
		 $scope.setDisplay("Error (See Console)");
		 console.log("Elasticsearch Query Error", error);
		} else {
			responseService.setResponse(response);
		  var bindme = {};
		  bindme.context = context;
		  bindme.response = response;
		  bindme.error = error;
	          if ($scope.options.allow_unsafe) {
			try {
			  bindme.meta = eval($scope.vis.params.outputs.meta);
			} catch(jserr) {
			  bindme.jserr = jserr;
			  $scope.setDisplay("Error (See Console)");
		 	  console.log("Javascript Compilation Error", jserr);
			  return; // Abort!
			}
	   	  } 
		  var formula = $scope.vis.params.outputs.formula;
                  $scope.setDisplay(Mustache.render(formula, bindme));
		}
	});
    
    };


    $scope.$watchCollection('vis.params.outputs', $scope.refreshConfig);

     // When the expression updates
    $scope.$watchMulti(['vis.params.expression', 'vis.params.interval'], $scope.search);

    // When the time filter changes
    $scope.$listen(timefilter, 'fetch', $scope.search);

    // When a filter is added to the filter bar?
    $scope.$listen(queryFilter, 'fetch', $scope.search);

    // When auto refresh happens
    $scope.$on('courier:searchRefresh', $scope.search);

    // From the hack directive
    $scope.$on('fetch', $scope.search);

    $scope.$on('renderComplete', event => {
      event.stopPropagation();
      $element.trigger('renderComplete');
    });

});

module.controller('TransformVisEditorController', function ($scope, indexPatterns) {

    $scope.options = chrome.getInjected('transformVisOptions');

    indexPatterns.getIds().then( function(list) {
	    $scope.indexPatternOptions = list;
    });;

   $scope.$watch('vis.params.outputs.indexpattern', function() {
	    indexPatterns.get($scope.vis.params.outputs.indexpattern).then( function (indexPattern) {
		$scope.savedVis.searchSource.set('index', indexPattern); 
		$scope.vis.indexPattern = indexPattern;
	    });;
    });

});

module.service('responseService', function() {
  this.response = {};

  const setResponse = (response) => {
    this.response = response; 
  }

  const getResponse = () => {
    return this.response;
  }

  return {
    setResponse: setResponse,
    getResponse: getResponse
  }
});

module.service('pluginService', ['transformApiService', '$q', function(transformApiService, $q) {
  this.pluginsList = {};

  const setPlugin = (name, fn, deps) => {
    this.pluginsList[name] = this.pluginsList[name] || {};
    this.pluginsList[name].fn = fn; 
    this.pluginsList[name].deps = deps; 
  }

  const getPlugin = (name) => {
    return this.pluginsList[name];
  }

  const getPlugins = () => {
    return this.pluginsList;
  }

  const getDependency = (name, dep) => {
    console.log(this.getPlugin(name).deps.dep)
    return this.getPlugin(name).deps.dep;
  }

  return {
    setPlugin: setPlugin,
    getPlugin: getPlugin,
    getPlugins: getPlugins,
    getDependency: getDependency
  }
}])

module.directive('compile', ['$compile', '$sce', ($compile, $sce) => {
  const option = _.pick( chrome.getInjected('transformVisOptions'), 'allow_unsafe');
  return function(scope, element, attrs) {
    scope.$watch(
      (scope) => {
        return scope.$eval(attrs.compile);
      },
      (value) => {
        if ( option.allow_unsafe ) element.html($sce.trustAsHtml(value));
        element.html(value);
        $compile(element.contents())(scope);
      }
    );
  };
}]);

module.directive('load', [ 'pluginService', 'responseService', (pluginService, responseService) => {
  return {
    restrict: 'A',
  	scope: {
  		plugin: '@'
  	},
    link: function($scope, $element, attrs) {

      $scope.$watch('plugin', plugin => {

        const fn = pluginService.getPlugin(plugin);

        fn($scope, $element, attrs, responseService, pluginService);

    	}, true);
    }
  };
}]);