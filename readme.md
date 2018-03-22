# Routeplanner subway Amsterdam
A routeplanner of the subway in Amsterdam (dutch). You can find your route by filling in the input fields. You can search an adress by name, zipcode or location coordinates. This app uses the Google Location API to find the nearest location of your results. This project is made on a node express server.

![Example of routeplanner](https://raw.githubusercontent.com/dipsaus9/performance-matters-server-side/master/example_routePlanner.png)

## Usage
The routeplanner uses the Google location API. You can enter the apikey in the app.js file. You can create one for free. One free API key can use up to 1000 request a day.

This project uses npm packages. To use this project run:

`npm install`

and

`node app.js`

This process will start a server on port `1337`.
The app.js file will serve a server using the express module.

## To Do
* Progressive enhancement with Javascript
* Browserify

## Project
This project is searching between all subway stations in Amsterdam. It compares all stations and their lines to create a route. This will be then transported to a ejs file (views folder). The server will serve all files from the index.ejs. Alls results will come in the detail.ejs file.

## License
MIT © Dipsaus9
