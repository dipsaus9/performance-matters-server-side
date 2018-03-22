const metroData = require('./metro.js');
let calculationHelper = require('./calcHelper.js');
let firstAdressResult;
let secondAdressResult;

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
module.exports = routePlanner;
