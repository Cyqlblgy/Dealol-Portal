var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url = require('url');
var https = require('https');

//Var initialization
var host = 'api.walmartlabs.com';
var apiKey = 'qfnzsf9wyvhcr4szm7se78sb';

//Connect to mongoose, TODO: add db if necessary
// mongoose.connect('mongodb://localhost/server',{ useMongoClient: true });
// var db = mongoose.connection;

function performRequest(endpoint, method, data, success) {
  var dataString = JSON.stringify(data);
  var headers = {};

  if (method == 'GET') {
    headers = {
      'Content-Type': 'application/json'
    };
  }
  else {
    headers = {
      'Content-Type': 'application/json',
      'Content-Length': dataString.length
    };
  }
  var options = {
    host: host,
    path: endpoint,
    method: method,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf-8');
    var responseString = '';
    res.on('data', function(data) {
      responseString += data;
    });
    res.on('end', function() {
      var responseObject = JSON.parse(responseString);
      success(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

function rebuildResponse(source,data,targetObject){
  if(source == 'Walmart'){
    targetObject = {"Walmart":data};
  }
  return targetObject;
}

app.get('/api/deals/search',function(req, res){
  var baseEndPoint = '/v1/search?apiKey=' + apiKey;
  var queryData = url.parse(req.url, true).query;
  console.log(queryData);
  if(queryData.productName != null){
      baseEndPoint += '&query=' + queryData.productName;
    //categoryId
    if(queryData.categoryId != null){
      baseEndPoint += '&categoryId=' + queryData.categoryId;
    }
    //sort
    if(queryData.sort != null){
      baseEndPoint += '&sort=' + queryData.sort;
    }
    //start
    if(queryData.start != null){
      baseEndPoint += '&start=' + queryData.start;
    }
    //order
    if(queryData.order != null){
      baseEndPoint += '&order=' + queryData.order;
    }
    //numItems
    if(queryData.numItems != null){
      baseEndPoint += '&numItems=' + queryData.numItems;
    }
    console.log(baseEndPoint);
    performRequest(baseEndPoint, 'GET', null,
    function(data) {
      res.send(rebuildResponse('Walmart',data));
    });
  }
  else{
    res.status(400);
    res.send('productName is required');
  }
});



app.listen(3000);
