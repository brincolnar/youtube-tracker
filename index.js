const https = require("https");
const fs = require("fs");
const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";

// get video duration by id
const getVideoDurationById = (id) => {
  https.get(
    `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`,
    (res) => {
      res.on("data", (data) => {
        const json = JSON.parse(data);

        const contentDetails = json.items[0].contentDetails;
        console.log(contentDetails);

        const duration = contentDetails.duration;
        console.log(duration);

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

// getVideoDurationById("OssNdRqJ-KA");

// Read from the zgodovina_ogledov.json
const totalTime = 0; // in seconds
const data = JSON.parse(fs.readFileSync("zgodovina_ogledov.json"));

const getVideosLatestWeek = () => {
  let latestDate = data[0];
  // console.log(parseISOString(latestDate.time).getDay());

  // get videos from this week
  /*
  data.forEach(element => {
    // console.log(element.time.substring(0, 10));
    // getVideoDurationById();
  });
  */

  let weekNumber = 1; // keeps track of the current week - (week is defined from Monday to Sunday -- inclusive)
  let firstDateInWeek = parseISOString(data[data.length - 1].time); // first date in current week (String -> Date)
  console.log("Week no." + "1 starts with " + firstDateInWeek);
  // console.log("firstDateInWeek: " + firstDateInWeek);

  // let daysLater = 0;
  // let testDate = firstDateInWeek.addDays(daysLater);

  // withinWeek(new Date("December 31 2020"), new Date("Jan 1 2021")); // testing method
  
  for (let index = data.length-2; index > -950 + data.length; index--) { 

    const currentElementDate = parseISOString(data[index].time);

    if(withinWeek(firstDateInWeek, currentElementDate)) { // check if currentElementDate is in week
      // add to the weeks watch time
    } else {
      weekNumber++;
      let start = startOfWeek(currentElementDate);
      console.log("Week no." + weekNumber + " starts with " + start);
      firstDateInWeek = startOfWeek(currentElementDate); // currentElementDate determines the new week range
    }
  }
};

const parseISOString = (s) => {
  let b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
};

// TO-DO: check if within works as expected
const withinWeek = (firstDateInWeek, current) => {
  // testing whether current (date) is in the week that was started with firstDateInWeek date

  let firstDay = startOfWeek(firstDateInWeek); // create Date objects
  let lastDay = endOfWeek(firstDateInWeek);

 //  console.log(current.toString());
  /*console.log(
    "In week from " + firstDay.toString() + " to " + lastDay.toString() + "."
  );*/

  let within =
    firstDay.getTime() <= current.getTime() &&
    current.getTime() <= lastDay.getTime()
      ? true
      : false;
    
  return within;
};

// gets the date that corresponds to the end of the week
const endOfWeek = (date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

  return new Date(date.setDate(diff + 6));
};

// gets the date that corresponds to the start of the week
const startOfWeek = (date) => {
  var diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);

  return new Date(date.setDate(diff));
};
// for quickly testing
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

getVideosLatestWeek();
