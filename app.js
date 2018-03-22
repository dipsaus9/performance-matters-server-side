var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
let googleHost = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
let apiKeyGoogle = '&key=AIzaSyCHRzuIAtoPNHLj5MyY_KFn0Ls8mBlUyPg';
let firstAdressResult;
let secondAdressResult;
let fetch = require('node-fetch');

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


app.use(express.static('public'));
app.use(bodyParser());

app.set('view engine', 'ejs');;
app.set('views', 'views');

app.get('/', function (req, res) {
  metroData.init();
  res.render('index.ejs', {movies: 'hallo'});
});
app.post('/result', function(req, res){
  let inputData = (req.body);
  if(inputData.startAdress != '' && inputData.endAdress != ''){
    let firstAdress = inputData.startAdress.split(' ').join('+') + ', Nederland';
    let secondAdress = inputData.endAdress.split(' ').join('+') + ', Nederland';
    let firstAdressOutcome = getData(firstAdress);
    let endAdressOutcome = getData(secondAdress);
    Promise.all([firstAdressOutcome, endAdressOutcome]).then(function(data) {
      firstAdressResult = (JSON.parse(data[0])).results[0].geometry;
      secondAdressResult = (JSON.parse(data[1])).results[0].geometry;
      let test = routePlanner.init(firstAdressResult, secondAdressResult);
      res.render('detail.ejs', {route: test});
    });
  }
});

app.use(function(req, res, next){
  res.status(404);
  res.render('404.ejs', {url: req.url});
  return;
});

var server = app.listen(1337, function () {
   console.log('server is running on port 1337')
});


//dipsuas epicness
function getData(url){
  return new Promise(function(resolve, reject) {
    request((googleHost + url + apiKeyGoogle), function (error, response, body) {
      if (error) return reject(error);
      resolve(body);
    });
  });
}
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
const routePlanner = {
  init: function(startLocation, endLocation){
    const startLocationGeo = startLocation;
    const endLocationGeo = endLocation;
    var self = this;
    const subwayStations = metroData.metroStations;
    let firstSubway = [];
    let secondSubway = [];
    subwayStations.forEach(function(el){
      let curr = calculationHelper.distanceTwoPoints(el, startLocation.location.lat, startLocation.location.lng, el.location.geometry.coordinates[1], el.location.geometry.coordinates[0]);
      firstSubway.push(curr);
    });
    subwayStations.forEach(function(el){
      let curr = calculationHelper.distanceTwoPoints(el, endLocation.location.lat, endLocation.location.lng, el.location.geometry.coordinates[1], el.location.geometry.coordinates[0]);
      secondSubway.push(curr);
    });
    firstSubway = calculationHelper.getLowestNumber(firstSubway);
    secondSubway = calculationHelper.getLowestNumber(secondSubway);
    let result = this.findRoute(firstSubway, secondSubway);
    return result;
  },
  findRoute: function(firstStation, secondStation){
    var self = routePlanner;
    self.beginStationName = firstStation.object.metroHalte;
    self.endStationName = secondStation.object.metroHalte;
    let directRouteVar = false;
    if(self.beginStationName == self.endStationName){
      //begin is same as end, find something funny here
    }
    else{
      //start planning
      let firstStationLines = firstStation.object.metroLijnen;
      let secondStationLines = secondStation.object.metroLijnen;
      //check if it is a directRoute
      let firstStationStop = [];
      let endStations = [];
      let endStationStop = [];
      firstStationLines.forEach(function(el){
        let firstLine = el;
        secondStationLines.forEach(function(line){
          if(firstLine == line){
            var lineConvert = 'line' + line;
            var activeMetroLine = metroData.metroLines[lineConvert];
            directRouteVar = true;
            endStations.push(self.routeBetweenTwoPoints(activeMetroLine, firstLine, firstStation.object.metroHalte, secondStation.object.metroHalte));
          }
        });
      });
      if(!directRouteVar){
        let tussenStop = [];
        let tussenLines = [];
        firstStationLines.forEach(function(el){
          let firstLine = el;
          let testLine = 'line' + firstLine;
          let activeMetroLine = metroData.metroLines[testLine];
          activeMetroLine.forEach(function(item){
            let thisLine = item.metroLijnen;
            thisLine.forEach(function(line){
              let currLine = line;
              secondStationLines.forEach(function(endLine){
                if(endLine === currLine){
                  if(!tussenLines.includes(endLine)){
                    tussenLines.push(endLine);
                  }
                  tussenStop.push(item);
                }
              });
            });
          });
        });
        firstStationLines.forEach(function(fLine){
          let beginLine = fLine;
          tussenStop.forEach(function(sLine){
            let tLine = sLine.metroLijnen;
            let sLineCurr = sLine;
            tLine.forEach(function(line){
              if(line === beginLine){
                var lineConvert = 'line' + line;
                firstStationStop.push(self.routeBetweenTwoPoints(metroData.metroLines[lineConvert], beginLine, firstStation.object.metroHalte, sLineCurr.metroHalte));
              }
            });
          });
        });
        secondStationLines.forEach(function(fLine){
          let beginLine = fLine;
          tussenStop.forEach(function(sLine){
            let tLine = sLine.metroLijnen;
            let sLineCurr = sLine;
            tLine.forEach(function(line){
              if(line === beginLine){
                var lineConvert = 'line' + line;
                endStationStop.push(self.routeBetweenTwoPoints(metroData.metroLines[lineConvert], beginLine, sLineCurr.metroHalte, secondStation.object.metroHalte));
              }
            });
          });
        });
      }
      let newEndstation = [];
      let withStopStations = [];
      if(!directRouteVar){
        endStationStop.forEach(function(item){
          let station = item.obj[0];
          firstStationStop.forEach(function(el){
            if((el.obj[el.obj.length - 1]) == station){
              let currData = {
                begin: el,
                end: item,
                stops: (el.obj.length + item.obj.length)
              };
              withStopStations.push(currData);
            }
          });
        });
        let length = 10000;
        withStopStations.forEach(function(item){
          if(item.stops < length){
            newEndstation = [];
            length = item.stops;
            newEndstation.push(item);
          }
        });
      }
      else{
        if(endStations.length > 0){
          let length = 1000;
          for(let i = 0; i < endStations.length; i++){
            if(endStations[i].obj.length < length){
              newEndstation = [];
              length = endStations[i].obj.length;
              newEndstation.push(endStations[i]);
            }
          }
        }
      }
      // self.placeRoute(newEndstation, directRouteVar);
      let newData = [];
      if(directRouteVar){
        let data = newEndstation;
        let arr = data[0].obj;
        let newArr = [];
        for(let i = 1; i < (arr.length - 1); i++){
          newArr.push(arr[i].metroHalte);
        }
        let obj = {
          fromTo: [data[0].obj[0], data[0].obj[data[0].obj.length - 1]],
          line: data[0].line,
          firstLi: data[0].obj[0].metroHalte,
          lastLi: data[0].obj[data[0].obj.length - 1].metroHalte,
          betweenStops: newArr,
        };
        newData.push(obj);
      }
      else{
        let data = newEndstation;
        let arr1 = data[0].begin.obj;
        let newArr1 = [];
        for(let i = 1; i < (arr1.length - 1); i++){
          newArr1.push(arr1[i].metroHalte);
        }
        let objBegin = {
          fromTo: [data[0].begin.obj[0], data[0].begin.obj[data[0].begin.obj.length - 1]],
          line: data[0].begin.line,
          firstLi: data[0].begin.obj[0].metroHalte,
          lastLi: data[0].begin.obj[data[0].begin.obj.length - 1].metroHalte,
          betweenStops: newArr1,
        };
        newData.push(objBegin);
        let arr2 = data[0].end.obj;
        let newArr2 = [];
        for(let i = 1; i < (arr2.length - 1); i++){
          newArr2.push(arr2[i].metroHalte);
        }
        let objEnd = {
          fromTo: [data[0].end.obj[0], data[0].end.obj[data[0].end.obj.length - 1]],
          line: data[0].end.line,
          firstLi: data[0].end.obj[0].metroHalte,
          lastLi: data[0].end.obj[data[0].end.obj.length - 1].metroHalte,
          betweenStops: newArr2,
        };
        newData.push(objEnd);
      }
      return newData;
    }
  },
  routeBetweenTwoPoints: function(line, lineNr, beginStation, endStation){
    let activeMetroLine = line;
    let stationsPassing = [];
    let beginStationNameCurr = beginStation;
    let endStationNameCurr = endStation;
    let indexAfter = Number.POSITIVE_INFINITY;
    // console.log(line, lineNr, beginStation, endStation);
    for(let i = 0; i < activeMetroLine.length; i++){
      if(activeMetroLine[i].metroHalte == beginStationNameCurr){
        indexAfter = i;
      }
      if(i >= indexAfter){
        stationsPassing.push(activeMetroLine[i]);
        if(activeMetroLine[i].metroHalte == endStationNameCurr){
          break;
        }
      }
    }
    let firstWay = false;
    stationsPassing.forEach(function(station){
      if(station.metroHalte == endStationNameCurr){
        firstWay = true;
      }
    });
    if(!firstWay){
      stationsPassing = [];
      indexAfter = Number.NEGATIVE_INFINITY;
      for(let i = activeMetroLine.length; i > 0; i--){
        if(activeMetroLine[i - 1].metroHalte == beginStationNameCurr){
          indexAfter = i;
        }
        if(i <= indexAfter){
          stationsPassing.push(activeMetroLine[i - 1]);
          if(activeMetroLine[i - 1].metroHalte == endStationNameCurr){
            break;
          }
        }
      }
    }
    let directRouteObj = {
      line: lineNr,
      obj: stationsPassing
    };
    return directRouteObj;
  },
  beginStationName: '',
  endStationName: '',
}
