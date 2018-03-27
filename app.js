var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var session = require('express-session');
const compression = require('compression');

let googleHost = 'https://maps.googleapis.com/maps/api/geocode/json?address=';

let apiKeyGoogle = '&key=AIzaSyCHRzuIAtoPNHLj5MyY_KFn0Ls8mBlUyPg';

var metroData = require('./routePlanner/metro.js');
let routePlanner = require('./routePlanner/app.js');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.set('view engine', 'ejs');;
app.set('views', 'views');

app.set('trust proxy', 1)
app.use(session({
  secret: 'previous routes',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(compression());

app.get('/', function (req, res) {
  metroData.init();
  res.render('index.ejs', {session: req.session});
});

app.get('/result/:id', function (req, res) {
  if(req.session.data){
    var check;
    for(let i = 0; i < req.session.data.length; i++){
      if(req.session.data[i].url === req.params.id){
        check = true;
        return res.render('detail.ejs', {route: req.session.data[i].data});
      }
    }
    if(!check){
      res.render('404.ejs', {url: req.url});
    }
  }
});


app.post('/result', function(req, res){
  let inputData = (req.body);
  if(inputData.startAdress != '' && inputData.endAdress != ''){
    if(metroData.metroLines){
      var fisrt = inputData.startAdress;
      var end = inputData.endAdress
      go(fisrt, end)
    }
    else{
      //falback funtion?
    }
    function go(begin, end){
      let firstAdress = begin.split(' ').join('+') + ', Nederland';
      let secondAdress = end.split(' ').join('+') + ', Nederland';
      let firstAdressOutcome = getData(firstAdress);
      let endAdressOutcome = getData(secondAdress);
      Promise.all([firstAdressOutcome, endAdressOutcome]).then(function(data) {
        firstAdressResult = (data[0]).results[0].geometry;
        secondAdressResult = (data[1]).results[0].geometry;
        let endData = routePlanner.init(firstAdressResult, secondAdressResult);
        var sessionData = [];
        if(endData.length > 1){
          var begin = endData[0].firstLi.split(' ').join('_');
          var end = endData[1].lastLi.split(' ').join('_');
        }
        else{
          var begin = endData[0].firstLi.split(' ').join('_');
          var end = endData[0].lastLi.split(' ').join('_');
        }
        var url = begin + '-to-' + end;
        var obj = {
          "url": url,
          "data": endData
        }
        if(req.session.data){
          for(let i = 0; i < req.session.data.length; i++){
            if(req.session.data[i].url !== url){
              sessionData.push(req.session.data[i]);
            }
          }
        }
        sessionData.push(obj);
        req.session.data = sessionData;
        res.render('detail.ejs', {route: endData});
      });
    }
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
      resolve(JSON.parse(body));
    });
  });
}
