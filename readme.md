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
- [ ] Use HTTP2 on all servers

## Project
This project is searching between all subway stations in Amsterdam. It compares all stations and their lines to create a route. This will be then transported to a ejs file (views folder). The server will serve all files from the index.ejs. Alls results will come in the detail.ejs file.

## Performance
I tested this project on multiple ways to increase the performance of the page. I tested and used the following principles in order. I tested this by doing a audit (chrome) and checking the first view and load time by throttling the network to 2G. I tried all tests at least 5 times and I took the average numbers. I also tested this on all page but I´ll descirbe just the homepage now.

1. [#Gzipping all files](#Gzipping all files)
2. [#Serviceworker](#Serviceworker)
3. [#Load CSS async](#Load CSS async)
4. [#Font display](#Font display)


### Performance before testing
#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 79      | 45 | 100 | 100      | 94 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 772ms      | 264ms | 757ms | 310ms      |

### Gzipping all files
By using a npm module called `compression` I created a Gzip of all my files. This increases the performance a little bit but it wasn't noticable.
#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 79      | 45 | 100 | 100      | 94 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 742ms      | 224ms | 760ms | 320ms      |

These numbers are almost equal, so There wasn't a real differnece here.

### Serviceworker
By using a serviceworker that saves all pages where the user has already been to, I increased the page. These statistics are on the second load of the page (it needs to be saved into the serviceWorker first).

#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 83      | 64 | 100 | 94      | 89 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 354ms      | 234ms | 1.27ms | 322ms      |

There is a huge differnce on the load time here. This is because a serviceworker can serve my files a lot faster here. In the background it will fetch all the files so the finish time is a bit longer here, but he user won't notice this.
I also got a meeage on my best Practices I didn't load all of my content over HTTP2. Thats because the serviceworker has a different http setting. Thats because I'm on local host right now and I could solve this problem on my server.

### Load CSS async
By loading CSS async (if supported) you can load more file at once. This should increase the first view.
I used this code to create this:

``` html
<link rel="preload" href="/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/css/main.css"></noscript>
```

#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 92      | 64 | 100 | 94      | 89 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 340ms      | 245ms | 1.87ms | 310ms      |

Here we can see an increase in the performance and in the loading time aswell.

### Font display
By using `font-display: swap` we tell the browser to always use the browser font, and when the custom font is being loaded use that font. This results in a really fast first view.

#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 92      | 64 | 100 | 94      | 89 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 340ms      | 245ms | 1.87ms | 290ms      |


### Last percentage
To really optimalize the app I added some small adjustments that increased the perfomance and speed of the page. I won't describe them in detail.

* Minify CSS
* Add manifest.json
* Add meta tags for the colors off the pages

## Final result

#### Audit Test
| Performance | Progressive Web App | Accesibilty | Best Practices | SEO |
| ------------- |:-------------:| -----:| :-------------:| -----:|
| 92      | 91 | 100 | 94      | 89 |

#### Network Throttling
| Load | DomContentLoaded | Finish | First View |
| ------------- |:-------------:| -----:| :-------------:|
| 335ms      | 237ms | 1.87ms | 291ms      |

## License
MIT © Dipsaus9
