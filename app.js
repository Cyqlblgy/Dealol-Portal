var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var url = require('url');
var https = require('https');
var Deals = require('./models/deals');
var ItemSearchResult = require('./models/itemSearchResult');
var amazon = require('amazon-product-api');

//Connect to mongoose, TODO: add db if necessary
// mongoose.connect('mongodb://localhost/server',{ useMongoClient: true });
// var db = mongoose.connection;

//Var initialization
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000);
app.set('host', process.env.HOST || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
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

function performRequest(endpoint, method, data, success, error) {
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
  req.on('error', function(err) {
      error(err);
  });
  req.end();
}

function performSearchDeals(keywords, page, brandName, price, categoryID, res, error){
  var resultDeals = new Deals();
  var isAmazonReady = false,
      isWalmartReady = false;
  //Walmart Search
  var baseEndPoint = '/v1/search?apiKey=' + walmartApiKey;
  baseEndPoint += '&query=' + encodeURIComponent(keywords);
  //start
  baseEndPoint += '&start=' + page;
  var endPage = parseInt(page)
  endPage += 1
  baseEndPoint += '&end=' + endPage;
  baseEndPoint += '&sort=relevance';

  if(brandName){
    baseEndPoint += '&facet=on&facet.filter=brand:' + encodeURIComponent(brandName);
    if(price>0){
      baseEndPoint += '&facet.range=price:[' + parseInt(price*0.8) + '%20TO%20' + parseInt(price*1.2) + ']';
    }
  }

  if(categoryID){
    baseEndPoint += '&categoryId=' + categoryID;
  }

  console.log(baseEndPoint);
  performRequest(baseEndPoint, 'GET', null,
  function(data){
    console.log(JSON.stringify(data, null, 4));
    resultDeals.addDeals('Walmart',data);
    isWalmartReady = true;
    if(isAmazonReady && isWalmartReady){
      res(resultDeals);
    }
  },
  function(err){
    var result = JSON.stringify(err);
    console.log(result);
    console.log(err);
    error('something went wrong with Walmart API: ' + result + ' err: '+ err);
  });

  //Amazon Search
  client.itemSearch({
    keywords: keywords,
    itemPage: page,
    availability: 'Available',
    condition: 'New',
    maximumPrice: parseInt(price*150).toString(),
    minimumPrice: parseInt(price*80).toString(),
    responseGroup: 'ItemAttributes,Images,OfferSummary'
  },function(err, results, response) {
    if (err) {
      var result = JSON.stringify(err);
      console.log(result);
      if(err[0].Error != null && err[0].Error[0].Code != null
        && err[0].Error[0].Code[0] == 'AWS.ECommerceService.NoExactMatches'){
        isAmazonReady = true;
        if(isAmazonReady && isWalmartReady){
             res(resultDeals);
        }
        return;
      }
      error('something went wrong with Amazon API: ' + result + ' err: '+ err);
    } else {
      if(response[0] != null &&
      response[0].TotalResults != null){
        resultDeals.amazonTotal = parseInt(response[0].TotalResults[0]);
      }
      resultDeals.addDeals('Amazon',results);
      isAmazonReady = true;
      if(isAmazonReady && isWalmartReady){
           res(resultDeals);
      }
    }
  });
}

app.get('/deal',function(req, res){
  var queryData = url.parse(req.url, true).query;
  console.log(queryData);
  if(queryData.source != null &&
     queryData.id != null){
    if(queryData.source === 'Walmart'){
      //Walmart Search
      var baseEndPoint = '/v1/items/'+queryData.id+'?apiKey=' + walmartApiKey;
      console.log(baseEndPoint);
      performRequest(baseEndPoint, 'GET', null,
      function(data){
        console.log(JSON.stringify(data));
        console.log('Name :' + data.name + ' model:' + data.modelNumber + ' categoryID: ' + data.categoryNode + ' price: ' + data.salePrice);
        var keywords = data.name;
        // if(data.modelNumber != null){
        //   keywords += ' ' + data.modelNumber;
        // }
        res.send(new ItemSearchResult(keywords,data.brandName,data.salePrice,data.categoryNode))
      },
      function(err){
        var result = JSON.stringify(err);
        console.log(result);
        res.status(500);
        res.send('something went wrong with Walmart lookup API: ' +
        result + ' err: '+ err);
      });
    }
    // else if(queryData.source =='Amazon'){
    //   //Amazon Search
    //   client.itemLookup({
    //     idType: 'ASIN',
    //     itemId: queryData.id
    //   }).then(function(results){
    //     var value = results[0];
    //     var keywords = value.ItemAttributes[0].Title[0];
    //     // if(value.ItemAttributes[0].Model != null){
    //     //   keywords += ' ' + value.ItemAttributes[0].Model[0];
    //     // }
    //     console.log('Name :' + value.ItemAttributes[0].Title[0] + ' model:' + value.ItemAttributes[0].Model[0]);
    //     var brandName;
    //     if(value.ItemAttributes[0].Manufacturer != null){
    //       brandName = value.ItemAttributes[0].Manufacturer[0];
    //     }
    //     var price = 0.00;
    //     if(value.ItemAttributes[0].ListPrice != null && value.ItemAttributes[0].ListPrice[0].Amount != null){
    //       price = (value.ItemAttributes[0].ListPrice[0].Amount[0])/100.00;
    //     }
    //     res.send(new ItemSearchResult(keywords,brandName,price))
    //   }).catch(function(err){
    //     var result = JSON.stringify(err);
    //     console.log(result);
    //     res.status(500);
    //     res.send('something went wrong with Amazon lookup API: ' + ' err: '+ err);
    //   });
    //  }
  }
  else{
    res.status(400);
    res.send('source and id are required');
  }
});

app.get('/deals/search',function(req, res){
  var queryData = url.parse(req.url, true).query;
  console.log(queryData);
  if(queryData.keywords != null && queryData.page != null){
    performSearchDeals(queryData.keywords, queryData.page,
      queryData.brandName,
      queryData.price,
      queryData.categoryID,
      function(resultDeals){
      res.send(resultDeals);
    }, function(error){
      res.status(500);
      res.send(error);
    });
  }
  else{
    res.status(400);
    res.send('keywords and page is required');
  }
});
