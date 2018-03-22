const calculationHelper = {
  getLowestNumber: function(object){
    var lowestNr = Number.POSITIVE_INFINITY;
    var lowestOb = [];
    object.forEach(function(item){
      if(lowestNr > item.distance){
        lowestOb = [];
        lowestOb.push(item);
        lowestNr = item.distance;
      }
    });
    return lowestOb[0];
  },
  distanceTwoPoints: function(object, lat1, lon1, lat2, lon2){
    let earthRadiusKm = 6371;
    let dLat = this.degreesToRadians(lat2-lat1);
    let dLon = this.degreesToRadians(lon2-lon1);
    lat1 = this.degreesToRadians(lat1);
    lat2 = this.degreesToRadians(lat2);
    let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return {
      distance: (earthRadiusKm * c),
      object: object
    };
  },
  degreesToRadians: function(degree){
    return degree * Math.PI / 180;
  }
}
module.exports = calculationHelper; 
