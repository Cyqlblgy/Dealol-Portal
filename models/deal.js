var itemName = '';
var itemId = 0;
var itemPrice = '';
var itemURL = '';
var customerRate = '';
var numberOfReviews = 0;
var source = '';

//Public
module.exports = Deal;

function Deal(itemName, itemId, itemPrice,
itemURL,customerRate,numberOfReviews,source){
  this.itemName = itemName;
  this.itemId = itemId;
  this.itemPrice = itemPrice;
  this.itemURL = itemURL;
  this.customerRate = customerRate;
  this.numberOfReviews = numberOfReviews;
  this.source = source;
}

Deal.prototype.itemName = function(){
  return this.itemName;
}

Deal.prototype.itemId = function(){
  return this.itemId;
}

Deal.prototype.itemPrice = function(){
  return this.itemPrice;
}

Deal.prototype.itemLongDescription = function(){
  return this.itemLongDescription;
}

Deal.prototype.itemURL = function(){
  return this.itemURL;
}

Deal.prototype.customerRate = function(){
  return this.customerRate;
}

Deal.prototype.numberOfReviews = function(){
  return this.numberOfReviews;
}
