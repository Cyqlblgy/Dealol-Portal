var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url = require('url');
var https = require('https');
var Deals = require('./models/deals');
var restify = require('restify');

//Var initialization
var host = 'api.walmartlabs.com';
var apiKey = 'qfnzsf9wyvhcr4szm7se78sb';

//Connect to mongoose, TODO: add db if necessary
// mongoose.connect('mongodb://localhost/server',{ useMongoClient: true });
// var db = mongoose.connection;

var ip_addr = '172.30.207.161';
var port    =  '8080';

var server = restify.createServer({
    name : "dealol"
});

server.listen(port ,ip_addr, function(error){
    console.log('%s listening at %s ', server.name , server.url);
});

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

server.get('/api/deals/search',function(req, res){
  var baseEndPoint = '/v1/search?apiKey=' + apiKey;
  var queryData = url.parse(req.url, true).query;
  var resultDeals = new Deals();
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
      resultDeals.addDeals('Walmart',data);
      res.send(resultDeals.getAllDeals());
    });
  }
  else{
    res.status(400);
    res.send('productName is required');
  }
});
