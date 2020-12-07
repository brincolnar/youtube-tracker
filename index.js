const https = require("https");
const fs = require("fs");
const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";
const url = require("url");
const axios = require("axios");

// get video duration by id
const getVideoDurationById = (id) => {
  https.get(
    `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`,
    (res) => {
      res.on("data", (data) => {
        const json = JSON.parse(data);

        const contentDetails = json.items[0].contentDetails;
        // console.log(contentDetails);

        const duration = contentDetails.duration;
        // console.log(duration);

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

        console.log(durationInSeconds + "s");
      });
    }
  );
};

// get video duration by id (using axios)
let test;
const getVideoDurationByIdAxios = (id) => {
  axios
    .get(
      `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`
    )
    .then((response) => {
      console.log(response.data);
      const json = response.data;

      const contentDetails = json.items[0].contentDetails;

      const duration = contentDetails.duration;

      test = duration;

      return test;
    })
    .catch((error) => console.log(error));
};
const getVideoId = (videoObject) => {
  const videoUrl = videoObject.titleUrl;

  const queryObject = url.parse(videoUrl, true).query;
  console.log(queryObject.v);
};
// Read from the zgodovina_ogledov.json
const data = JSON.parse(fs.readFileSync("zgodovina_ogledov.json"));

const getVideosLatestWeek = () => {
  let weekNumber = 1; // keeps track of the current week - (week is defined from Monday to Sunday -- inclusive)
  let firstDateInWeek = startOfWeek(parseISOString(data[data.length - 1].time)); // first date in current week (String -> Date)

  // maps weekNumber to total watchtime in that week
  let week2Watchtime = [];

  const weekWatchtime = 0; // current weeks's watchtime

  for (let index = data.length - 2; index > -100 + data.length; index--) {
    const currentElementDate = parseISOString(data[index].time);
    //console.log("currentElementDate " + currentElementDate.toString());

    if (withinWeek(firstDateInWeek, currentElementDate)) {
      // check if currentElementDate is in week
      // add to the weeks watch time
      // getVideoId(data[index]);
      // weekWatchtime += getVideoDurationById(getVideoId(data[index]));
    } else {
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

  // console.log(withinWeek(startOfWeek(new Date("Mon Apr 13 2020 11:45:29")), new Date("Tue Apr 14 2020")));
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

console.log("TtdBAA3hCxY's duration: ");

getVideoDurationByIdAxios("TtdBAA3hCxY");
getVideosLatestWeek();

// with asynchronous code do take watchime from return in the then() section
// of the returned promise then add it to totalWatchime
