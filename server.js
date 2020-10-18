'use strict';

require('dotenv').config(); //npm i dotenv
const superagent = require('superagent'); //npm i superagent allows to make request to api

const express = require('express'); //npm i express
const app = express();
const cors = require('cors'); // npm i cors
const pg = require('pg');

const GEO_API_KEY = process.env.GEO_API_KEY; //keys are in the env
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;
const MOVIE_DATABASE_KEY = process.env.MOVIE_DATABASE_KEY;

//1 assign port 
const PORT = process.env.PORT;
//set up a database
const client = new pg.Client(process.env.DATABASE_URL);

app.get('/add,', (request, response) => { // DATABASE STUFF
    const latitude = request.query.latitude;
    const longitude = request.query.longitude;

    //insert into people = add something to the people table
    // (FIRST ,LAST) val (1,2) = update first name and last name with those values from client query
    let SQL = 'INSERT INTO city_explorer (latitude, longitude) VALUES ($1, $2) RETURNING *;';

    let location = [latitude, longitude];
    client.query(SQL, location)
        .then(results => {
            response.status(200).json(results);
        })
        .catch(err => {
            console.error('db error:', err);
        })
});

app.get('/', (request, response) => {
    response.send('home page');
});

app.use(cors()); // if you dont use this you'll get a coors error.

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.get('/movies', handleMovies);


// this builds an object with the data coming in.
function Location(geoData, city) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
}

// this builds weather object with data coming in
function Weather(forecast) {
    this.forecast = forecast.weather.description;
    this.time = forecast.valid_date;
}

function Trails(trail) {
    this.name = trail.name;
    this.location = trail.location;
    this.length = trail.length;
    this.stars = trail.stars;
    this.star_votes = trail.starVotes
    this.summary = trail.summary;
    this.trail_url = trail.url;
    this.conditions = trail.conditions;
    this.condition_date = trail.conditionDate.split(' ')[0];
    this.condition_time = trail.conditionDate.split(' ')[1];
}

function Movie(movies) {
    this.title = movies.original_title;
    this.overview = movies.overview;
    this.average_votes = movies.vote_average;
    this.total_votes = movies.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${movies.poster_path}`;
    this.popularity = movies.popularity;
    this.released_on = movies.release_date;
}

function handleMovies(request, response) {
    try {
        const city = request.query.search_query;
        // console.log("request", request.query.search_query);
        const url = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_DATABASE_KEY}&language=en-US&query=${city}&page=1&include_adult=false`;

        superagent.get(url)
            .then(data => {
                let movieStuff = data.body.results;
                console.log('moviestuff', movieStuff); // data is coming in/ body is the body/ movie is whatever I want it to be
                let title = movieStuff.map(pass => { // map goes through each item in the constructor function.
                    return new Movie(pass); //and returns new object
                });
                response.send(title); //sends movie as response
            })
            .catch(err =>{
                console.error('return', err)});
    } catch (error) {
        response.status(500).send(`sorry, can't find that movie`);
    }
}

function handleLocation(request, response) {
    try {
        const city = request.query.city;
        console.log("city", city);
        const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_API_KEY}&q=${city}&format=json&limit=1`
        let search_query = [request.query.city]; //PG wants request in square brackets
        let SQL = 'SELECT * FROM location WHERE search_query = $1;';  //checks table to see if anything is there. 
        client.query(SQL, search_query)
            .then(data => {
                if (data.rows.length > 0) {
                    response.status(200).send(data.rows[0]);
                } else {
                    superagent.get(url) //hey super agent go to this url
                        .then(data => {         // and get this data
                            const geoData = data.body[0];
                            const locationData = new Location(geoData, city);
                            let SQL = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';    //saving the local record information in the database
                            let saveValue = [locationData.search_query, locationData.formatted_query, locationData.latitude, locationData.longitude] //locationdata is an object, and search_query... is properties of that object
                            client.query(SQL, saveValue)
                                .then(() => {
                                    response.json(locationData);
                                })
                        })
                        .catch(err => {
                            console.error('return', err)
                        });
                }
            })
    } catch (error) {
        response.status(500).send('sorry, you broke this location.');
    }
}

function handleWeather(request, response) {
    try {
        const latitude = request.query.latitude;
        const longitude = request.query.longitude;

        const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}&format=json`;

        superagent.get(url)
            .then(data => {

                let forcast = data.body.data
                let dataArr = forcast.map(pass => {
                    return new Weather(pass);
                });
                response.send(dataArr);
            });
    } catch (error) {
        response.status(500).send('sorry, you broke the weather.');
    }
}

function handleTrails(request, response) {
    try {
        const latitude = request.query.latitude;
        const longitude = request.query.longitude;
        const url = `https://hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${TRAIL_API_KEY}&maxDistance=200`
        superagent.get(url)
            .then(data => {
                const path = data.body.trails;
                let walkingPaths = path.map(trail => new Trails(trail));
                response.send(walkingPaths);
            });
    } catch (error) {
        response.status(500).send(`if you can't find your way here you should stay off the trails`);
    }
};


app.get('*', (request, response) => {
    response.status(404).send('we got nothing. you really messed up this time');
})

client.connect() //connect client to database
    .then(() => {
        app.listen(PORT, () => { // start server after I've connected
            console.log(`server works on ${PORT}`); //message if works
        });
    })
    .catch(err => {
        console.error('connection error:', err); //message if error
    });

