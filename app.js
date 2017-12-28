var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url = require('url');
var https = require('https');
var Deals = require('./models/deals');
var amazon = require('amazon-product-api');

//Var initialization
var host = 'api.walmartlabs.com';
var apiKey = 'qfnzsf9wyvhcr4szm7se78sb';
var amazonAccessKey = 'AKIAIYZUZQH63IE52UEA';
var amazonSecretKey = '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';
var amazonTag = 'dealol-20';

//Connect to mongoose, TODO: add db if necessary
// mongoose.connect('mongodb://localhost/server',{ useMongoClient: true });
// var db = mongoose.connection;

app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || '0.0.0.0');

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('host') + ':' + app.get('port'));
});

var client = amazon.createClient({
  awsId: amazonAccessKey,
  awsSecret: amazonSecretKey,
  awsTag: amazonTag
})

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

app.get('/deals/search',function(req, res){
  var queryData = url.parse(req.url, true).query;
  var resultDeals = new Deals();
  console.log(queryData);
  var isAmazonReady = false,
      isWalmartReady = false;
  //Walmart API
  if(queryData.productName != null){

    //Walmart Search
    var baseEndPoint = '/v1/search?apiKey=' + apiKey;
    baseEndPoint += '&query=' + queryData.productName;
    //start
    if(queryData.start != null){
      baseEndPoint += '&start=' + queryData.start;
      baseEndPoint += '&end=' + queryData.start+1;
    }
    performRequest(baseEndPoint, 'GET', null,
    function(data) {
      resultDeals.addDeals('Walmart',data);
      isWalmartReady = true;
      if(isAmazonReady && isWalmartReady){
        var returnResult = {};
        returnResult.result = resultDeals.getAllDeals();
        returnResult.totalNumber = resultDeals.getAllDeals().length;
        res.send(returnResult);
      }
    });

    //Amazon Search
    client.itemSearch({
      keywords: queryData.productName,
      itemPage: queryData.start,
      availability: 'Available',
      responseGroup: 'ItemAttributes'
    }).then(function(results){
      console.log(JSON.stringify(results, null, 4));
      resultDeals.addDeals('Amazon',results);
      isAmazonReady = true;
      if(isAmazonReady && isWalmartReady){
        var returnResult = {};
        returnResult.result = resultDeals.getAllDeals();
        returnResult.totalNumber = resultDeals.getAllDeals().length;
        res.send(returnResult);
      }
    }).catch(function(err){
      var result = JSON.stringify(err);
      console.log(result);
      console.log(err);
      res.status(500);
      res.send('something went wrong with Amazon API: ' + result + ' err: '+ err);
    });
  }
  else{
    res.status(400);
    res.send('productName is required');
  }
});
