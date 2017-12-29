//Public
module.exports = Deal;

function Deal(itemName, itemId, itemPrice,
itemURL,customerRate,numberOfReviews,itemImage,source){
  this.itemName = itemName;
  this.itemId = itemId;
  this.itemPrice = itemPrice;
  this.itemURL = itemURL;
  this.customerRate = customerRate;
  this.numberOfReviews = numberOfReviews;
  this.itemImage = itemImage;
  this.source = source;
}
