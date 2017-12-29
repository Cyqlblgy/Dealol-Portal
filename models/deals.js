var Deal = require('./deal');

//Public
module.exports = Deals;

function Deals(){
  this.resultDeals = [];
  this.totalNumber = 0;

  this.addDeals = function(source,data){
    if(source == 'Walmart' && data != null && data.items != null){
      for(var i=0;i<data.items.length;i++){
        var value = data.items[i];
        this.resultDeals.push(new Deal(value.name,value.itemId,value.salePrice,value.productUrl,value.customerRating,
                    value.numReviews,value.thumbnailImage,'Walmart'
                  ));
        this.totalNumber += 1;
      }
    }
    else if(source == 'Amazon' && data != null){
      for(var i=0;i<data.length;i++){
        var value = data[i];
        if(value.ItemAttributes[0].ListPrice != null && value.ItemAttributes[0].ListPrice[0].Amount != null){
          var imageURL = null;
          if(value.SmallImage != null && value.SmallImage[0].URL != null){
            imageURL = value.SmallImage[0].URL[0];
          }
          this.resultDeals.push(new Deal(value.ItemAttributes[0].Title[0],value.ASIN[0],(value.ItemAttributes[0].ListPrice[0].Amount[0])/100.00,
                      value.DetailPageURL[0],null,0,imageURL,'Amazon'
                    ));
          this.totalNumber += 1;
        }
      }
    }
  }

  this.getAllDeals = function(){
    return this.resultDeals;
  }
}
