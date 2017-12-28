var Deal = require('./deal');
var deals = [];

//Public
module.exports = Deals;

function Deals(){
}

Deals.prototype.addDeals = function(source,data){
  if(source == 'Walmart'){
    data.items.forEach(function(value){
      deals.push(new Deal(value.name,value.itemId,value.salePrice,value.productUrl,value.customerRating,
                  value.numReviews,'Walmart'
                ));
    });
  }
  else if(source == 'Amazon'){
    data.forEach(function(value){
      if(value.ItemAttributes[0].ListPrice != null && value.ItemAttributes[0].ListPrice[0].Amount != null){
        deals.push(new Deal(value.ItemAttributes[0].Title[0],value.ASIN[0],(value.ItemAttributes[0].ListPrice[0].Amount[0])/100.00,
                    value.DetailPageURL[0],null,0,'Amazon'
                  ));
      }
    });
  }
}

Deals.prototype.getAllDeals = function(){
  return deals;
}
