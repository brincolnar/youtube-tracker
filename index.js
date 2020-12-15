const fs = require("fs");
const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";
const url = require("url");
const axios = require("axios");
const zgodovina_ogledov = "./zgodovina_ogledov.json";
const file = require(zgodovina_ogledov);

// global

// maps weekNumber to total watchtime in that week
let week2Watchtime = [];

// get video duration by id
const getVideoDurationById = (id, callback) => {
  // i is used in assignDuration 

  if((typeof callback).toString() != 'function') return; // hacky, find out why it happens
  axios.get(
    `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`)
    .then(response => {
      // console.log(response.data);
      const json = response.data;

      if(json.items[0] == undefined) { // when video is now private, for example
        console.log(json);
        console.log(`id: ${id}`);
        return;
      }

      const contentDetails = json.items[0].contentDetails;

      const duration = contentDetails.duration;

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
      console.log(`callback on error: ${callback} callback type: ${typeof callback}`);
      console.log(error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      // console.log(error.config);
    });
};

// simulation of getVideoDurationById, when I exceed API quota
const getVideoDurationByIdSym = (id, callback) => {

  if((typeof callback).toString() != 'function') return; // hacky, find out why it happens

  // simulating the request (waiting for response)
  setTimeout(() => {
    callback(1); // callback with arbitrary number
  },
  1000);
};

const getVideoId = (videoObject) => {

  // for example, when videos are removed
  if(videoObject == undefined) return;

  const videoUrl = videoObject.titleUrl;
  if(videoUrl == undefined) return;

  console.log(`videoUrl: ${videoUrl}`);

  const queryObject = url.parse(videoUrl, true).query;
  
  console.log(queryObject.v);
  return queryObject.v;
};


// Read from the zgodovina_ogledov.json
const data = JSON.parse(fs.readFileSync("zgodovina_ogledov.json"));

// assign a duration field to a JSON video object zgodovina_ogledov.json 
const assignDuration= () => {

  for(let i = file.length - 1; i > -10 + file.length - 1; i--) {
    let id = getVideoId(file[i]);
    console.log(`id: ${id}`);

    if(file[i] != undefined)
      file[i]["duration"] = "not found with API";

    // add duration field to every video object
    getVideoDurationById(id, (duration) => {
      file[i]["duration"] = `${duration}`;
      
      // console.log(`${id}'s duration: ${duration}`);
      // console.log(`i: ${i}`);
      // console.log(file[i]);
      
      // save changes to file
        fs.writeFile(zgodovina_ogledov, JSON.stringify(file), function writeJSON(err) {
          if (err) return console.log(err);
          console.log('writing to ' + zgodovina_ogledov);
        });

    });
  };
}

const getVideosLatestWeek = () => {
  let weekNumber = 1; // keeps track of the current week - (week is defined from Monday to Sunday -- inclusive)
  let firstDateInWeek = startOfWeek(parseISOString(data[data.length - 1].time)); // first date in current week (String -> Date)

  let weekWatchtime = 0; // current weeks's watchtime

  for (let index = data.length - 1; index > -10 + data.length; index--) {
    const currentElementDate = parseISOString(data[index].time);
    let id = getVideoId(data[index]);
    
    /*
    if (withinWeek(firstDateInWeek, currentElementDate)) {
      // check if currentElementDate is in week
      // add to the weeks watch time
    */
    getVideoDurationById(id, (duration) => {

        console.log(`ìd: ${id}:`);
        console.log(`duration: ${duration}`);

        if (withinWeek(firstDateInWeek, currentElementDate)) {

          // add to current week's watchime
          weekWatchtime += duration;
          console.log(`weekWatchtime: ${weekWatchtime}`);

        } else {

          // push week object
          week2Watchtime.push({week: `Week nr. ${weekNumber}: ${startOfWeek(firstDateInWeek)} - ${endOfWeek(firstDateInWeek)}`, watchtime: weekWatchtime});
          
          console.log(`week2Watchtime: ${JSON.stringify(week2Watchtime)}`);
          
          // log week's watchime
          console.log(`Week nr. ${weekNumber} watchime: ${weekWatchtime}`);
          
          // reset week's watchime
          weekWatchtime = 0;
    
          weekNumber++;
          console.log("Week number:" + weekNumber);
          let start = currentElementDate;
          console.log(
            "Week no." + weekNumber + " starts with " + startOfWeek(start)
          );
          firstDateInWeek = start; // currentElementDate determines the new week range
    
          // reset weekWatchime
          weekWatchtime = 0;
        }
      });
      
    /*
    } else {

      // push week object
      week2Watchtime.push({week: `Week nr. ${weekNumber}: ${firstDateInWeek} - ${endOfWeek(firstDateInWeek)}`, watchtime: weekWatchtime});

      // log week's watchime
      console.log(`Week nr. ${weekNumber} watchime: ${weekWatchtime}`);
      
      // reset week's watchime
      weekWatchtime = 0;

      weekNumber++;
      console.log("Week number:" + weekNumber);
      let start = currentElementDate;
      console.log(
        "Week no." + weekNumber + " starts with " + startOfWeek(start)
      );
      firstDateInWeek = start; // currentElementDate determines the new week range

      // reset weekWatchime
      weekWatchtime = 0;
    }
  }
  */

  // console.log(withinWeek(startOfWeek(new Date("Mon Apr 13 2020 11:45:29")), new Date("Tue Apr 14 2020"))); 
  } 
};

const parseISOString = (s) => {
  let b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
};

const withinWeek = (firstDateInWeek, current) => {
  // testing whether current (date) is in the week that was started with firstDateInWeek date

  let firstDay = startOfWeek(firstDateInWeek); // create Date objects
  let lastDay = endOfWeek(firstDateInWeek);

  /* console.log(
    "In week from " + firstDay.toString() + " to " + lastDay.toString() + "."
  );*/

  // withing if between Monday at 0:00:00 and Sunday 23:59:59
  let within =
    firstDay.getTime() <= current.getTime() &&
    current.getTime() <= lastDay.getTime()
      ? true
      : false;

  return within;
};

// gets the date that corresponds to the end of the week
const endOfWeek = (date) => {
  let diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  let end = new Date(date.setDate(diff + 6));

  end.setHours(23);
  end.setMinutes(59);
  end.setSeconds(59);

  return end;
};

// gets the date that corresponds to the start of the week
const startOfWeek = (date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
  let start = new Date(date.setDate(diff));

  start.setHours(0);
  start.setMinutes(0);
  start.setSeconds(0);

  return start;
};
// for quickly testing
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

// console.log("TtdBAA3hCxY's duration: ");

// getVideoDurationByIdXml("TtdBAA3hCxY");

// getVideoDurationByIdAxios("TtdBAA3hCxY");
// getVideosLatestWeek();
/*
console.log(file[file.length - 1]);
getVideoId(file[file.length - 1]);
*/
assignDuration();