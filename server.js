'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require(`superagent`);
const pg = require('pg');

require('dotenv').config();

const PORT = process.env.PORT || 3000;

// database setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

const app = express();

let currentLoc = null;



app.use(express.static('./public'));
app.use(cors());

// API ROUTES

// This runs first!!!!!
app.get('/location', (request, response) => {
  console.log(request.query.data, 'lalalalal')
  response.send(lookupLoc(request.query.data));
})

app.get('/weather', (currentLoc, response) => {
  darkskyWeather(currentLoc.query.data.latitude, currentLoc.query.data.longitude)
    .then(weather => {
      response.send(weather);
    })
})

app.get('/events',(getEvent));



function lookupLoc(location){
  const SQL = `SELECT * FROM locations WHERE search_query=$1;`;
  const values = [location];

  return client.query(SQL, values)
    .then(result =>{
      if (result.rowCount > 0){
        // send databack to user
        console.log('hello im a SQL');


      }else{
      // create it
      // insert data
        return serchToLatLong(request.query.data)
          })
      }
    })

}


function Location(request, geoData) {
  this.search_query = request;
  this.formatted_address = geoData.body.results[0].formatted_address;
  this.latitude = Number(geoData.body.results[0].geometry.location.lat);
  this.longitude = Number(geoData.body.results[0].geometry.location.lng);
}

Location.prototype.save = function() {
  const SQL =`INSERT INT0 locations (search_query, formatted_address, latitude,longitude) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING RETURNING id;`;
  const values = Object.values(this);
  return client.query(SQL,values)
}

function EventData(request){
  this.link = request.url
  this.name = request.name.text
  this.event_date = request.start.local
  this.summary = request.summary
}

function Forecast(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

function serchToLatLong(query){
  const url =`https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res => {
      currentLoc = new Location(query, res);
      location.save().then( result => {
        console.log(result.row[0].id, 'moooooooooooo')
        location.id= result.row[0].id;
      })
      return currentLoc;
    })
}

function darkskyWeather(lat, lon){
  const url = `https://api.darksky.net/forecast/${process.env.DARK_SKY}/${lat},${lon}`;
  const weatherSummaries =[];
  return superagent.get(url)
    .then(res => {
      res.body.daily.data.forEach(day => {
        weatherSummaries.push(new Forecast(day));
      });
      return weatherSummaries;
    });
}
function getEvent(request, response){
  const url = `https://www.eventbriteapi.com/v3/events/search?token=${process.env.EVENT_BRIGHT_API}&location.address=${request.query.data.search_query}`;
  return superagent.get(url)
    .then(res =>{
      let events = res.body.events.map(data =>{
        let eventData = new EventData(data)
        return eventData
      })
      response.send(events);
    })
}



app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
