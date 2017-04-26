module.exports = {
    deps: {
      echarts: require('echarts')
    },
    func: function($scope, $element, attrs, responseService, pluginService) {
    const buildSeries = (series, split, values, stack, horizontal) =>    {
      let chartSeries = {
        legend: _.map( series, (serie) => { return { name : serie.name } } ),
        xAxis: {
          type: 'category',
          data: _.flatten(_.map( series, (serie) => { 
            return _.map(serie.data, data => {
              try {
                return new Date(data.key).toISOString();
              } catch (e) {
                return data.key
              }
            }); 
          })),
          axisLine: {
            lineStyle: {
              color: 'rgb(180,180,180)'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: 'rgb(180,180,180)'
            }
          }
        },
        series: _.map( series, (serie, index) => {
          return {
            name: serie.name,
            type: serie.type,
            data: _.map(serie.data, data => {
              if ( values && values.length > 0 ) {
                switch(serie.type) {
                  case 'pie': 
                    return { name: data.key, value: data[values[index]].value };
                    break;
                  default: 
                    return data[values[index]].value;
                    break;
                }
              }
              switch(serie.type) {
                case 'pie': 
                  return { name: data.key, value: data.doc_count };
                  break;
                default: 
                  return data.doc_count;
                  break;
              }
            })
          }
        })
      };

      if ( horizontal ) {
        const buffer = chartSeries.xAxis;
        chartSeries.xAxis = chartSeries.yAxis;
        chartSeries.yAxis = buffer;
      }

      if ( split ) {
        var splitBuckets = {};
        if ( series.length > 1 ) throw 'Only one series per chart is allowed with split';
        _.map(series, serie => { 
          _.forEach( serie.data, data => {
            _.map(data[split].buckets, (bucket, index) => {
              splitBuckets[bucket.key] = splitBuckets[bucket.key] || {};
              splitBuckets[bucket.key].name = splitBuckets[bucket.key].name || bucket.key;
              splitBuckets[bucket.key].type = splitBuckets[bucket.key].type || serie.type;
              if ( stack ) {
                splitBuckets[bucket.key].stack = split;
              }
              splitBuckets[bucket.key].data = splitBuckets[bucket.key].data || [];
              if ( values && values.length > 0 ) {
                switch(serie.type) {
                  case 'pie': 
                    splitBuckets[bucket.key].data.push({ name: bucket.key, value: bucket[values[index]].value} );
                    break;
                  default: 
                    splitBuckets[bucket.key].data.push(bucket[values[index]].value);  
                    break;
                }
              }
              switch(serie.type) {
                case 'pie': 
                  splitBuckets[bucket.key].data.push({ name: bucket.key, value: bucket.doc_count });
                  break;
                default: 
                  splitBuckets[bucket.key].data.push(bucket.doc_count);
                  break;
              }
            });
          });
        });

        chartSeries.legend = _.keys(splitBuckets);
        chartSeries.series = _.map( splitBuckets, (bucket) => {
          return {
            name: bucket.name,
            type: bucket.type,
            stack: bucket.stack,
            data: bucket.data
          }
        })
      }

      return chartSeries;
    };

    const getHorizontalBarData = (series = [], split, values = null, stack = null, horizontal = false) => {

      const chartSeries = buildSeries(series, split, values, stack, horizontal);

      let options = {
        tooltip : {
          trigger: 'axis',
          axisPointer : {            
            type : 'shadow'        
          }
        },
        legend: {
          data: chartSeries.legend
        },
        xAxis: chartSeries.xAxis,
        yAxis: chartSeries.yAxis,
        series: chartSeries.series
      }

      return options;
    };

    $scope.$watch(attrs.series, series => {

      if ( angular.isDefined(series) ) {
        $element.css({ 
          width: 1000,
          height: 500 
        });

        var echarts = pluginService.getDependency('echarts');

        var myChart = echarts.init($element[0]);

        let horizontal = ( typeof attrs.horizontal != 'undefined' );
        let stack = ( typeof attrs.stack != 'undefined' );

        const split = attrs.split;
        
        var values;
        if ( attrs.values ) {
          values = attrs.values.split(',');
        }
        
        series = series.split(',');
        if ( series.length == 0 ) throw 'missing series expression';

        const chartSeries = _.map( series, (serie) => {
          const tuple = serie.split(':');
          if ( tuple.length < 2 ) throw'invalid serie expression';

          return {
            name: tuple[0],
            type: tuple[1],
            data: responseService.getResponse().aggregations[tuple[0]].buckets
          };
        });
        myChart.setOption(getHorizontalBarData(chartSeries, attrs.split, values, stack, horizontal));
      }
    }, true);
  }
}