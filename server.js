'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

//1 assign port 
const PORT = process.env.PORT || 3000;

app.get('/', (request, response) => {
    response.send('home page');
});

app.use(cors()); // if you dont use this youll get a coors error.

app.get('/location', handleLocation);
app.get('/weather', handleWeather);

// this builds an object with the data coming in from the jason file.
function Location(where, city) {
    this.search_query = city;
    this.formatted_query = where[0].display_name;
    this.latitude = where[0].lat;
    this.longitude = where[0].lon;
}

function Weather(forecast) {
    this.forecast = forecast.weather.description;
    this.time = forecast.valid_date;
}


function handleLocation(request, response) {
    try {
        const where = require('./data/location.json');
        const city = request.query.city;
        const locationData = new Location(where, city);
        response.json(locationData);
    } catch (error) {
        response.status(500).send('sorry, you broke this location.');
    }
}

function handleWeather(request, response) {
    try {
        let dataArr = [];
        let weather = require('./data/weather.json');
        weather.data.forEach(pass => {
            let results = new Weather(pass);
            dataArr.push(results);
        });
        response.send(dataArr);
    } catch (error) {
        response.status(500).send('sorry, you broke the weather.');
    }
}

app.get('*', (req, res) => {
    response.status(404).send('we got nothing. you really messed up this time');
})

app.listen(PORT, () => {
    console.log(`this works on port ${PORT}`);
});
