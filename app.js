var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url = require('url');
var https = require('https');
var Deals = require('./models/deals');
var amazon = require('amazon-product-api');

//Connect to mongoose, TODO: add db if necessary
// mongoose.connect('mongodb://localhost/server',{ useMongoClient: true });
// var db = mongoose.connection;

//Var initialization
app.set('port', process.env.PORT || 3000);
app.set('host', process.env.HOST || '0.0.0.0');
var walmartHost = process.env.WalmartHost || 'api.walmartlabs.com';
var walmartApiKey = process.env.WalmartApiKey || 'qfnzsf9wyvhcr4szm7se78sb';

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('host') + ':' + app.get('port'));
});

var client = amazon.createClient({
  awsId: process.env.AmazonAccessKey || 'AKIAIYZUZQH63IE52UEA',
  awsSecret: process.env.AmazonSecretKey || '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',
  awsTag: process.env.AmazonTag || 'dealol-20'
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
    host: walmartHost,
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
    var baseEndPoint = '/v1/search?apiKey=' + walmartApiKey;
    baseEndPoint += '&query=' + queryData.productName;
    //start
    if(queryData.start != null){
      baseEndPoint += '&start=' + queryData.start;
      baseEndPoint += '&end=' + queryData.start+1;
    }
    performRequest(baseEndPoint, 'GET', null,
    function(data) {
      console.log('Walmart before ' + resultDeals.getAllDeals().length);
      resultDeals.addDeals('Walmart',data);
      console.log('Walmart after ' + resultDeals.getAllDeals().length);
      isWalmartReady = true;
      if(isAmazonReady && isWalmartReady){
        res.send(resultDeals);
      }
    });

    //Amazon Search
    client.itemSearch({
      keywords: queryData.productName,
      itemPage: queryData.start,
      availability: 'Available',
      responseGroup: 'ItemAttributes,Images'
    }).then(function(results){
      console.log(JSON.stringify(results, null, 4));
      console.log('Amazon before ' + resultDeals.getAllDeals().length);
      resultDeals.addDeals('Amazon',results);
      console.log('Amazon before ' + resultDeals.getAllDeals().length);
      isAmazonReady = true;
      if(isAmazonReady && isWalmartReady){
        res.send(resultDeals);
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
