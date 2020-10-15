'use strict';

require('dotenv').config(); //npm i dotenv
const superagent = require('superagent'); //npm i superagent allows to make request to api

const express = require('express'); //npm i express
const app = express();
const cors = require('cors'); // npm i cors
const pg = require('pg');
const GEO_API_KEY = process.env.GEO_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;

//1 assign port 
const PORT = process.env.PORT;

app.get('/', (request, response) => {
    response.send('home page');
});

app.use(cors()); // if you dont use this you'll get a coors error.

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);

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


function handleLocation(request, response) {
    try {
        const city = request.query.city;
        const url = `https://us1.locationiq.com/v1/search.php?key=${GEO_API_KEY}&q=${city}&format=json&limit=1`
        // sudo https://baseurl${api key} & query input/query(city) & fileType & numberOf
        superagent.get(url) //hey super agent go to this url
            .then(data => {         // and get this data
                const geoData = data.body[0];
                const locationData = new Location(geoData, city);
                response.json(locationData);
            });
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

app.listen(PORT, () => {
    console.log(`this works on port ${PORT}`);
});
