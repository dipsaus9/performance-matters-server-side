(function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
var key = require('./routePlanner/apiKeyGoogle.js');

const googleLocation = {
  load: function (){
    var timeout = null;
    let inputElements = document.querySelectorAll('input[type="text"]');
    inputElements.forEach(function(el){
      el.addEventListener('keyup', function(input){
        let self = googleLocation;
        let classNameElement = input.target.classList[0];
        var result = input.target.value;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          if(result){
            result = result.split(' ').join('+') + ', Nederland';
            googleLocation.getData(result).then(self.suggestion.bind(null, classNameElement));
          }
          else{
            switch (classNameElement) {
              case 'start':
                self.firstLocation = '';
                break;
              case 'end':
                self.secondLocation = '';
                break;
            }
            let classNameSearch = '.results.' + classNameElement;
            let searchResults = document.querySelector(classNameSearch);
            searchResults.innerHTML = '';
          }
        }, 300);
      });
    });
    // let submitButton = document.querySelector('form');
    // submitButton.addEventListener('submit', function(el){
    //   var self = googleLocation;
    //   el.preventDefault();
    //   if(self.firstLocation == ''){
    //     if(!document.querySelector('input.start').value){
    //       console.log('eerste input is leeg');
    //     }
    //     else{
    //       self.firstLocation = document.querySelector('input.start').value;
    //     }
    //   }
    //   else if(self.secondLocation == ''){
    //     if(!document.querySelector('input.end').value){
    //       console.log('tweede input is leeg');
    //     }
    //     else{
    //       self.secondLocation = document.querySelector('input.end').value;
    //     }
    //   }
    //   else{
    //     //er zijn 2 adressen bekend. lets go calculate some shit.
    //     routePlanner.init(self.firstLocation, self.secondLocation);
    //   }
    // });
  },
  getData: function(result){
    let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + result + key;
    var promiseObj = new Promise(function(resolve, reject){
      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.send();
      request.responseType = 'json';
      request.onload = function(){
        if (request.status == 200) {
          resolve(request.response);
        }
        else{
          reject(Error(request.statusText));
        }
      };
      request.onerror = function() {
        reject(Error('Network Error'));
      };
    });
    return promiseObj;
  },
  suggestion: function(className, data){
    var self = googleLocation;
    let results = data.results;
    let classNameSearch = '.results.' + className;
    let searchResults = document.querySelector(classNameSearch);
    searchResults.innerHTML = '';
    results.forEach(function(el){
      let a = document.createElement('a');
      let text = document.createTextNode(el.formatted_address);
      a.appendChild(text);
      a.className = className;
      a.href = '#';
      a.addEventListener('click', self.suggestionClicked);
      searchResults.appendChild(a);
    });
  },
  firstLocation: '',
  secondLocation: '',
  suggestionClicked: function(el){
    el.preventDefault();
    let self = googleLocation;
    let className = el.target.classList[0];
    let inputField = document.querySelector(('input.' + className));
    let resultField = document.querySelector(('.results.' + className));
    let textValue = el.target.text;
    resultField.innerHTML = '';
    inputField.value= textValue;
    switch (className) {
      case 'start':
        self.firstLocation = textValue;
        document.querySelector('input.end').focus();
        break;
      case 'end':
        self.secondLocation = textValue;
        document.querySelector('input[type="submit"]').focus();
        break;
    }
  }
};
window.addEventListener('DOMContentLoaded', function(){
  googleLocation.load();
});

},{"./routePlanner/apiKeyGoogle.js":2}],2:[function(require,module,exports){
let apiKeyGoogle = '&key=AIzaSyCHRzuIAtoPNHLj5MyY_KFn0Ls8mBlUyPg';
module.exports = apiKeyGoogle; 

},{}]},{},[1]);
