const fs = require("fs");
const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";
const url = require("url");
const axios = require("axios");
const zgodovina_ogledov = "./zgodovina_ogledov.json";
const file = require(zgodovina_ogledov);

// global

// maps weekNumber to total watchtime in that week
let week2Watchtime = [];
let day2Watchtime = [];

// get video duration by id
const getVideoDurationById = (id, callback) => {
  // i is used in assignDuration 

  if((typeof callback).toString() != 'function') return; // hacky, find out why it happens
  axios.get(
    `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`)
    .then(response => {
      
      const json = response.data;

      if(json.items[0] == undefined) { // when video is now private, for example
        // console.log(json);
        callback("video not available");
        // console.log(`id: ${id}`);
        return;
      }

      const contentDetails = json.items[0].contentDetails;

      const duration = contentDetails.duration;
      console.log(`duration ${duration}`)
      // Get duration in seconds);
      let durationInSeconds = 0;
      let unit = "S";
      let exponent = 0;

      for (let i = duration.length - 1; i > -1; i--) {
        let current = parseInt(duration.charAt(i)); //
        if (!isNaN(current)) {
          // current is numerical
          switch (unit) {
            case "S":
              if (exponent == 0) {
                durationInSeconds += current; // add seconds
                exponent++;
              } else {
                durationInSeconds += 10 * current;
              }

              break;

            case "M":
              if (exponent == 0) {
                durationInSeconds += current * 60; // add minutes
                exponent++;
              } else {
                durationInSeconds += current * 60 * 10; // add minutes
              }

              break;

            case "H":
              if (exponent == 0) {
                durationInSeconds += current * 60 * 60; // add hours
                exponent++;
              } else {
                durationInSeconds += current * 60 * 60 * 10; // add hours
              }

              break;

            default:
              break;
          }
        } else {
          // we're dealing with a unit marker
          unit = duration.charAt(i);
          exponent = 0;
        }
      }

      // console.log(durationInSeconds);
      callback(durationInSeconds);
    })
    .catch(error => {
      
      callback(error);
      console.log(error);
      
    });
};


const getVideoId = (videoObject) => {

  // for example, when videos are removed
  if(videoObject == undefined) return;

  const videoUrl = videoObject.titleUrl;
  if(videoUrl == undefined) return;

  const queryObject = url.parse(videoUrl, true).query;
  
  console.log(queryObject.v);
  return queryObject.v;
};


// Read from the zgodovina_ogledov.json
const data = JSON.parse(fs.readFileSync("zgodovina_ogledov.json"));

// assign a duration field to a JSON video object zgodovina_ogledov.json 
const assignDuration= (startIndex, callback, size) => { 

  let videosFetched = size; // number of videos to get duration for
  let writeAmount = 150; // number of videos to fetch before updating the file (instead of just videosFetched == 0)

  // assume file represents json file (json objects)
  
  for(let i = startIndex; i > -size + startIndex; i--) {
    let id = getVideoId(file[i]);

    if(file[i] == undefined)
      file[i]["duration"] = "not found with API";

    // add duration field to every video object
    getVideoDurationById(id, (duration) => {
        videosFetched--;
        writeAmount--;

        console.log(duration);
        file[i]["duration"] = duration;
      
      // console.log(`${id}'s duration: ${duration}`);
      console.log(`i: ${i}`);
      // console.log(file[i]);
      
      callback(videosFetched, writeAmount);
    });
  };
}

const weeksToTime = (size) => {
  let weekNumber = 1; // keeps track of the current week - (week is defined from Monday to Sunday -- inclusive)
  let firstDateInWeek = startOfWeek(parseISOString(data[data.length - 1].time)); // first date in current week (String -> Date)

  let weekWatchtime = 0; // current weeks's watchtime
  let firstId;

  for (let index = data.length - 1; index >= -size + data.length; index--) {
    const currentElementDate = parseISOString(data[index].time);
    
    let id = getVideoId(data[index]);
    let duration = data[index].duration;
    
    /*
    console.log(`ìd: ${id}:`);
    console.log(`index of object:  ${index}`);
    console.log(`duration: ${duration}`);
    */
    
    if (withinWeek(firstDateInWeek, currentElementDate)) {

      if(weekWatchtime == 0) firstId = id;

      // add to current week's watchime
      if(!isNaN(duration)) { // some videos are deleted
        weekWatchtime += duration;
      }
      
      // console.log(`weekWatchtime: ${weekWatchtime}`);

    } else {

      // push week object
      week2Watchtime.push({week: `Week nr. ${weekNumber}: ${startOfWeek(firstDateInWeek)} - ${endOfWeek(firstDateInWeek)}`, watchtime: weekWatchtime, firstId: firstId, lastId: getVideoId(data[index+1])});
          
      console.log(`week2Watchtime: ${JSON.stringify(week2Watchtime)}`);
          
      // log week's watchime
      console.log(`Week nr. ${weekNumber} watchime: ${weekWatchtime}`);

      weekNumber++;
      console.log("Week number:" + weekNumber);
      let start = currentElementDate;
      console.log(
        "Week no." + weekNumber + " starts with " + startOfWeek(start)
      );
      firstDateInWeek = start; // currentElementDate determines the new week range

      // reset weekWatchime
      weekWatchtime = 0;
      if(!isNaN(duration)) { // some videos are deleted
        weekWatchtime += duration;
      }
    }
  } 
};

// each day is asigned time watched Youtube videos 
const daysToTime = (size) => {
  let durations = [];
  let dayNumber = 1; // keeps track of the current day
  let day = parseISOString(data[data.length - 1].time); // first date in current week (String -> Date)
  console.log("first day: " + day);
  let dailyWatchtime = 0; // current day's watchtime

  for (let index = data.length - 1; index >= -size + data.length; index--) {
    const current = parseISOString(data[index].time);
    let duration = data[index]["duration"]; // should be a number

    if (withinDay(day, current)) {

      // add to current day's watchime
      if(!isNaN(duration)) { // some videos are deleted
        dailyWatchtime += duration;
        durations.push(duration);
      }
      
      
    } else {
      // log all durations for this day
      console.log(`new day begins with ${current}`);
      console.log(`day: ${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()} durations: ${durations}`);
      durations = [];
      // push week object
      day2Watchtime.push({day: `${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`, watchtime: dailyWatchtime, lastId: getVideoId(data[index+1])});
          
      console.log(`day2Watchtime: ${JSON.stringify(day2Watchtime)}`);

      dayNumber++;
      console.log("Day number:" + dayNumber);

      day = current;

      // reset weekWatchime
      dailyWatchtime = 0;
      if(!isNaN(duration)) { // some videos are deleted
        dailyWatchtime += duration;
        durations.push(duration);
      }
    }
  } 
};

const parseISOString = (s) => {
  let b = s.split(/\D+/);

  // returns day of month/month/year
  return new Date(Date.UTC(b[0], --b[1], b[2]));
};

const withinWeek = (firstDateInWeek, current) => {
  // testing whether current (date) is in the week that was started with firstDateInWeek date

  let firstDay = startOfWeek(firstDateInWeek); // startOfWeek probably redundant
  let lastDay = endOfWeek(firstDateInWeek);


  let within =
    firstDay.getTime() <= current.getTime() &&
    current.getTime() <= lastDay.getTime()
      ? true
      : false;

  return within;
};

const withinDay = (day, pendingDay) => {
  // testing whether day == pendingDay
  //console.log(day.getDate() == pendingDay.getDate() && day.getMonth() == pendingDay.getMonth() && day.getFullYear() == pendingDay.getFullYear());

  return day.getDate() == pendingDay.getDate() && day.getMonth() == pendingDay.getMonth() && day.getFullYear() == pendingDay.getFullYear();
};

// gets the date that corresponds to the end of the week
const endOfWeek = (date) => {
  let diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  let end = new Date(date.setDate(diff + 6));

  /*
  end.setHours(23);
  end.setMinutes(59);
  end.setSeconds(59);
  */
  return end;
};

// gets the date that corresponds to the start of the week
const startOfWeek = (date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  let start = new Date(date.setDate(diff));

  /*
  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);
  */
  return start;
};


// for quickly testing
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};


// This method gets the durations and writes them as fields to JSON objects

assignDuration(1, (videosFetched, writeAmount) => { // first argument - index of first video to assign duration to

  console.log(`videosFetched: ${videosFetched}`);
  
  if(videosFetched == 0 || writeAmount == 0) { // all objects fetched or enough objects for updating the file were fetched

    if(videosFetched == 0) {
      console.log("Finished fetching all durations...");
    } else {
      console.log(`${writeAmount} videos fetched. Updating to file...`); // writeAmount == 0
    }
    

    // save changes to file
    fs.writeFile(zgodovina_ogledov, JSON.stringify(file), function writeJSON(err) {
      if (err) 
        return console.log(err);
      console.log('writing to ' + zgodovina_ogledov);
    });
  }
}, 2);

// now we have fetched duration of video objetcts, we can build {week, duration} objects

/*
weeksToTime(1000);
daysToTime(1000);
console.log(week2Watchtime);
console.log(day2Watchtime);
*/

// console.log(data[1]);