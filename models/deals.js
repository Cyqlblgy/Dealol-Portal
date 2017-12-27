var Deal = require('./deal');
var deals = [];

//Public
module.exports = Deals;

function Deals(){
}

Deals.prototype.addDeals = function(source,data){
  if(source == 'Walmart'){
    data.items.forEach(function(value){
      deals.push(new Deal(value.name,value.itemId,value.salePrice,
                  value.longDescription,value.productUrl,value.customerRating,
                  value.numReviews
                ));
    });
  }
  else if(source == 'Amazon'){
    //TODO
  }
}

Deals.prototype.getAllDeals = function(){
  return deals;
}
