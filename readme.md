# Routeplanner subway Amsterdam
A routeplanner of the subway in Amsterdam (dutch). You can find your route by filling in the input fields. You can search an adress by name, zipcode or location coordinates. This app uses the Google Location API to find the nearest location of your results. This project is made on a node express server.

![Example of routeplanner](https://raw.githubusercontent.com/dipsaus9/performance-matters-server-side/master/example_routePlanner.png)

## Usage
The routeplanner uses the Google location API. You can enter the apikey in the app.js file. You can create one for free. One free API key can use up to 1000 request a day.

This project uses npm packages. To use this project run:

```
npm install
```

and

```
node app.js
```

This process will start a server on port `1337`.
The app.js file will serve a server using the express module.

## To Do
- [x] Progressive enhancement with Javascript
- [x] Browserify
- [x] Serviceworker
- [ ] Google maps

## Project
This project is searching between all subway stations in Amsterdam. It compares all stations and their lines to create a route. This will be then transported to a ejs file (views folder). The server will serve all files from the index.ejs. Alls results will come in the detail.ejs file.

## Performance
I tested this project on multiple ways to increase the performance of the page. I tested and used the following principles in order. I tested this by doing a audit (chrome) and checking the first view and load time by throttling the network to 2G. I tried all tests at least 5 times and I took the average numbers. I also tested this on all page but I´ll descirbe just the homepage now.

1. #Serviceworker
2. #Gzipping all files
3. #CSS minfiy
4. #Load CSS async
5. #Font display

### Performance before testing
Performance of the audit:
| Performance   | Progressive Web App | Accesibilty | Best Practices | SEO |  
| ------------- | ------------------- | ----------- | -------------- | --- |
| 79            | 45                  | 100         | 94             | 89  |

Performance of the first view:
| Load  | DomContentLoaded | Finish | First View |
| ----- | ---------------- | ------ | ---------- |
| 772,s | 264ms            | 757ms  | 310ms      |

### Gzipping all files
By using a npm module called `compression` I created a Gzip of all my files. This increases the performance a little bit but it wasn't noticable.

## License
MIT © Dipsaus9
