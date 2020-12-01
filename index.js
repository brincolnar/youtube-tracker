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
        let unit = 'S';
        let exponent = 0;

        for(let i = duration.length-1; i > -1; i--) {

          let current = parseInt(duration.charAt(i)); // 
          if(!isNaN(current)) { // current is numerical
            switch (unit) {
              case 'S':

                if(exponent == 0) {
                  durationInSeconds += current; // add seconds
                  exponent++;
                } else {
                  durationInSeconds += 10*current;
                }
                
                break;

              case 'M':

                if(exponent == 0) {
                  durationInSeconds += current * 60; // add minutes
                  exponent++;
                } else {
                  durationInSeconds += current * 60 * 10; // add minutes
                }
                
                break;

              case 'H':

                if(exponent == 0) {
                  durationInSeconds += current * 60 * 60; // add hours
                  exponent++;
                } else {
                  durationInSeconds += current * 60 * 60 * 10; // add hours
                }

                break;

              default:
                break;
            }
          } else { // we're dealing with a unit marker
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

  let weekNumber = 1; // keeps track of the current week - week is from Monday to Sunday
  let current = parseISOString(data[data.length-1].time);
  console.log(withinWeek(current));
  /*
  for (let index = data.length; index > -1; index--) {
    const element = data[index];
    // console.log(element);
  }
  */
}

const parseISOString = s => {
  let b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

const withinWeek = (current) => {
  let first = current.getDate() - current.getDay() + 1;
  let last = first + 6;
  console.log(current.toISOString());

  let firstDay = new Date(current.setDate(first));
  console.log(firstDay);

  let lastDay = new Date(current.setDate(last));
  console.log(lastDay);

  console.log(new Date(current.setDate(current.getDate())));
  let within = (firstDay.getTime() <= current.getTime() && current.getTime() <= lastDay.getTime()) ? true : false;
  return within;
}

getVideosLatestWeek();