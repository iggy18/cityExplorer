'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

//assign port 
const PORT = process.env.PORT || 3000;

function Location(city, where) {
    this.search_query = city;
    this.formatted_query = where[0].display_name;
    this.latitude = where[0].lat;
    this.longitude = where[0].lon;
  }

function handleLocation(request, response) {
    try {
      const where = require('./data/location.json');
      const city = request.query.city; 
      const locationData = new Location(city, where);
      response.json(locationData);
    } catch {
      response.status(500).send('sorry, you broke this.');
    }
  }

app.get('/location', (request, response) => { 
 handleLocation();
});

 app.get('/weather', (request, response) => {
    handleWeather();
 });

