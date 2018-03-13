//Public
module.exports = itemSearchResult;

function itemSearchResult(keywords,brandName,price,categoryID){
  this.keywords = keywords;
  this.brandName = brandName;
  this.price = price;
  this.categoryID = categoryID;
}
