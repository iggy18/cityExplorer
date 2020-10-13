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

function Weather(forcast, time) {
    this.forcast = forcast.weather.description;
    this.time = time.vaild_date;
    this.city = city;
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
        let weather = require('./data/weather.json')
        weather.data.forEach(pass => {
            let city = request.query.city;
            let results = new Weather(pass, city);
            dataArr.push(results);
        });
        response.send(dataArr);
    } catch (error) {
        response.status(500).send('sorry, you broke the weather.');
    }
}


app.listen(PORT, () => {
    console.log(`this works on port ${PORT}`);
});
