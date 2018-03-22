var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
let googleHost = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

let apiKeyGoogle = '';

var metroData = require('./routePlanner/metro.js');
let routePlanner = require('./routePlanner/app.js');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.set('view engine', 'ejs');;
app.set('views', 'views');

app.get('/', function (req, res) {
  metroData.init();
  res.render('index.ejs', {start: ''});
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
