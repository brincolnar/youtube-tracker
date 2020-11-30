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

getVideoDurationById("OssNdRqJ-KA");

// Read from the zgodovina_ogledov.json
const totalTime = 0; // in seconds
const data = JSON.parse(fs.readFileSync("zgodovina_ogledov.json"));

data.forEach(element => {
  // console.log(element);
  // getVideoDurationById();
});