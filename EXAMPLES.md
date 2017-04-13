-------

{
 "query": {
  "bool": {
   "must": [
     "_DASHBOARD_CONTEXT_"
   ]
  }
 },
 "aggs": {
    "country": {
      "terms": {
        "field": "country_code.keyword"
      },
      "aggs": {
        "status": {
          "terms": {
            "field": "status.keyword"
          }
        }
      }
    }
  }
}

<h1>Bar</h1>
<chart series="country:bar"></chart> 
<h1>Pie</h1>
<chart series="country:pie"></chart> 
<h1 style="color:#9B4F16;">Split</h1>
<chart series="country:bar" split="status"></chart> 
<h1>Horizontal</h1>
<chart series="country:bar" split="status" horizontal></chart> 
<h1>Horizontal stacked</h1>
<chart series="country:bar" split="status" horizontal stack></chart> 
<h1>Lines</h1>
<chart series="country:line" split="status"></chart> 

------

{
 "query": {
  "bool": {
   "must": [
     "_DASHBOARD_CONTEXT_"
   ]
  }
 },
 "aggs": {
    "processes": {
      "terms": {
        "size": 5,
        "field": "system.process.name"
      },
      "aggs": {
        "avg": {
          "avg": {
            "field": "system.process.cpu.total.pct"
          }
        }
      }
    }
  }
}

<h1>Bar</h1>
<chart series="processes:bar"></chart> 

<h1>Avg</h1>
<chart series="processes:bar" values="avg"></chart> 

----------------

{
 "query": {
  "bool": {
   "must": [
     "_DASHBOARD_CONTEXT_"
   ]
  }
 },
 "aggs": {
    "max_over_time":{
      "date_histogram": {
        "field": "@timestamp",
        "interval": "hour"
      },
      "aggs": {
        "max": { 
          "max": {
            "field": "system.cpu.idle.pct"
          }
        }
      }
    },
    "avg_over_time":{
      "date_histogram": {
        "field": "@timestamp",
        "interval": "hour"
      },
      "aggs": {
        "avg": { 
          "avg": {
            "field": "system.cpu.idle.pct"
          }
        }
      }
    },
    "min_over_time":{
      "date_histogram": {
        "field": "@timestamp",
        "interval": "hour"
      },
      "aggs": {
        "min": {
          "min": {
            "field": "system.cpu.idle.pct"
          }
        }
      }
    }
  }
}


<h1>3 series in a row</h1>
<chart series="max_over_time:bar,avg_over_time:line,min_over_time:bar" values="max,avg,min"></chart> 

<h1>3 series in a row inverted</h1>
<chart series="max_over_time:line,avg_over_time:bar,min_over_time:line" values="max,avg,min"></chart> 

<h1>3 series in a row scatter</h1>
<chart series="max_over_time:scatter,avg_over_time:line,min_over_time:scatter" values="max,avg,min"></chart> 