const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";
const https = require("https");

const getVideoByKeyword = (keyword) => {
  // youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=The%20Weekend&key=AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k

  const req = https.get(
    "https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=The%20Weekend&key=[YOUR_API_KEY]",
    (res) => {
      console.log(`statusCode: ${res.statusCode}`);

      res.on("data", (data) => {
        process.stdout.write(data);
      });
    }
  );
};

getVideoByKeyword("");
