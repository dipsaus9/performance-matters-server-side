let fetch = require('node-fetch');
let calculationHelper = require('./calcHelper.js');
const sparqlQuery = `SELECT ?item ?itemLabel ?coords ?nstation ?lijn ?lijnLabel
WHERE
{
?item wdt:P31 wd:Q928830.
?item wdt:P625 ?coords .
?item p:P197 ?nstation .
?nstation pq:P81 ?lijn .
SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
FILTER(?lijn IN ( wd:Q2466115, wd:Q2163442, wd:Q606629, wd:Q2183200, wd:Q2466111))
}`;
const metroData = {
  init: function(){
    this.getData().then(metroData.mapData.init);
  },
  getData: function(){
    const endpointUrl = 'https://query.wikidata.org/sparql';
    const fullUrl = endpointUrl + '?query=' + encodeURIComponent( sparqlQuery );
    const headers = { 'Accept': 'application/sparql-results+json' };
    return fetch( fullUrl, { headers } ).then(response => response.json());
  },
  mapData: {
    init: function(data) {
      const self = metroData.mapData;
      const allMetroStations = self.groupData(self.createGEOJSON(data));
      const allLines = self.createLineObject(allMetroStations);
      metroData.metroLines = allLines;
      metroData.metroStations = allMetroStations;
      return true;
    },
    createGEOJSON: function(data){
      let newData = data.results.bindings.map(function(el){
        let oldPoint = el.coords.value;
        let point = oldPoint.split('Point(');
        point = point[1].split(')');
        let xCord = point[0].split(' ');
        let yCord = xCord[1];
        xCord = xCord[0];
        let lijnLabel;
        switch (el.lijnLabel.value) {
          case 'metro/fast tram line 51':
            lijnLabel = 51;
            break;
          case 'Geinlijn':
            lijnLabel = 54;
            break;
          case 'Gaasperplaslijn':
            lijnLabel = 53;
            break;
          case 'Noord/Zuidlijn':
            lijnLabel = 52  ;
            break;
          case 'Ringlijn':
            lijnLabel = 50  ;
            break;
        }
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [xCord, yCord],
          },
          properties: {
            lijnlabel: lijnLabel,
            metroHalte: el.itemLabel.value,
          }
        };
      });
      return newData;
    },
    groupData: function(data){
      let groupBy = function(xs, key){
        return xs.reduce(function(rv, x) {
          (rv[x.properties[key]] = rv[x.properties[key]] || []).push(x);
          return rv;
        }, {});
      };
      let allMetroStation = groupBy(data, 'metroHalte');
      let newArray = [];
      for (var key in allMetroStation) {
        var arr = [];
        allMetroStation[key].forEach(function(item){
          //hier later wat anders op verzinnen, niet volledige support
          if(!arr.includes(item.properties.lijnlabel)){
            arr.push(item.properties.lijnlabel);
          }
        });
        var object = {
          metroHalte: key,
          metroLijnen: arr,
          location: allMetroStation[key][0]
        };
        newArray.push(object);
      }
      return newArray;
    },
    filterOnLine: function (data, lijnNr){
      return data.filter(function(item){
        return item.metroLijnen.includes(lijnNr);
      });
    },
    createLineObject: function(data){
      const self = metroData.mapData;
      const lijn51 = self.orderLines(self.filterOnLine(data, 51), 51);
      const lijn50 = self.orderLines(self.filterOnLine(data, 50), 50);
      const lijn52 = self.orderLines(self.filterOnLine(data, 52), 52);
      const lijn53 = self.orderLines(self.filterOnLine(data, 53), 53);
      const lijn54 = self.orderLines(self.filterOnLine(data, 54), 54);
      const allLines = {
        line51: lijn51,
        line52: lijn52,
        line53: lijn53,
        line50: lijn50,
        line54: lijn54
      };
      return allLines;
    },
    orderLines: function(data, nr){
      let currentData = data;
      let lengthOfData = data.length;
      let newArray = [];
      let firstStop = '';
      switch (nr) {
        case 52:
          firstStop = 'Noord metro station';
          break;
        case 51:
          firstStop = 'Westwijk';
          break;
        case 54:
          firstStop = 'Amsterdam Centraal';
          break;
        case 50:
          firstStop = 'Gein';
          break;
        case 53:
          firstStop = 'Amsterdam Centraal';
          break;
      }

      //get first stop out of data to filter the data
      for(let i = 0; i < currentData.length; i++){
        if(currentData[i].metroHalte == firstStop){
          newArray.push(currentData[i]);
          currentData.splice(i, 1);
          break;
        }
      }

      function loopFunction(){
        function actualLoop(){
          let arrayTest = [];
          let firstStationPoints = newArray[newArray.length - 1].location.geometry.coordinates;
          for(let i = 0; i < currentData.length; i++){
            let distanceNr = calculationHelper.distanceTwoPoints(currentData[i], firstStationPoints[1], firstStationPoints[0], currentData[i].location.geometry.coordinates[1] , currentData[i].location.geometry.coordinates[0]);
            let obj = {
              index: i,
              object: currentData[i],
              distance: distanceNr.distance
            };
            arrayTest.push(obj);
          }
          let lowestDistance = calculationHelper.getLowestNumber(arrayTest);
          lowestDistance = lowestDistance.object.metroHalte;
          let lowestDistanceNr;
          for(let i = 0; i < currentData.length; i++){
            if(lowestDistance == currentData[i].metroHalte){
              lowestDistanceNr = i;
              break;
            }
          }
          newArray.push(currentData[lowestDistanceNr]);
          currentData.splice(lowestDistanceNr, 1);
        }
        if(lengthOfData !== newArray.length){
          actualLoop();
          loopFunction();
        }
      }
      //loop trough data, check distance with next stop so we can filter it
      loopFunction();
      return newArray;
    }
  },
  metroLines: [],
  metroStations: [],
};

module.exports = metroData;
