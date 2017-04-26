import uiModules from 'ui/modules'

uiModules
	.get('app/transform')
	.service('transformApiService', ['$http', '$q', 'chrome', function ($http, $q, chrome) {


		const getFunctions = () => {
			return $http.get(chrome.addBasePath('/api/transform/functions'));
		}

		const getDependency = function(name) {
			let url = chrome.addBasePath('/api/transform/dependency');

			url += '?name=' + name;
			return $http.get(url);
		}

		return {
			getFunctions: getFunctions,
			getDependency: getDependency
		}
	}]);
