// index.js rewritten for client side (browser)

// read file 
const jsonInput = document.getElementById('jsonDrop');
let data = null;

// global graph data
let context = null;
let myChart = null;

// global data
let fromDate = null;
let toDate = null;
let unit = 'Day'; // by deafult
let lastDateInFile = null;

/** MAIN **/
// unit pick
const unitInput = document.getElementById('unit');

unitInput.addEventListener('change', e => {
  unit = e.target.value;
});

// date from pick
const fromInput = document.getElementById('from');

fromInput.addEventListener('change', e => {
  fromDate = changeDateFormat(e.target.value);
  console.log(fromDate);
});

// date to pick
const toInput = document.getElementById('to');

toInput.addEventListener('change', e => {
  toDate = changeDateFormat(e.target.value);
  console.log(toDate);
});

const changeDateFormat = date => {
  let separatedDate = date.split('-');
  
  let newDate = new Date();

  newDate.setDate(separatedDate[2]);
  newDate.setMonth(--separatedDate[1]);
  newDate.setFullYear(separatedDate[0]);

  newDate.setHours(0);
  newDate.setMinutes(0);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);

  return newDate;
}

// file upload
jsonInput.addEventListener("change", () => {
  const file = jsonInput.files[0];
  const blob = new Blob([file], { type: "application/json" });
  const fr = new FileReader();

  fr.addEventListener("load", e => {

    data = JSON.parse(fr.result);
    console.log("data: ");
    console.log(data);

    analyzeData(); // processes the JSON file
  });

  fr.readAsText(blob);

}, false);

// graph button
const graphDataBtn = document.getElementById('graphDataBtn');

graphDataBtn.addEventListener('click', () => {

  // destroy previous graph instances
  if(myChart != null) myChart.destroy();

  let file = document.getElementById('jsonDrop');

  if(!(fromDate == null || toDate == null || file.value == '')) {
    document.getElementById('chartTitle').style.display = 'block';
  }

  if(fromDate == null || toDate == null) {
    alert('Choose from and to dates!');
    return;
  }
  
  if(file.value == '') {
    alert('Choose an actual JSON file!');
    return;
  }

  graphFromTo(fromDate, toDate, unit); // graph
  // graphDays("5/12/2020", 8);
  // graphWeeks(fromDate, toDate)
})

const apiKey = "AIzaSyAG6cMYtyuVzQeuq_f1U94gtuBbWpx3d4k";

// wrapper function
const analyzeData = () => {

  // actual data analysis
  weeksToTime(data.length - 1, data.length - 1);
  console.log('week2Watchtime:');
  console.log(week2Watchtime);

  daysToTime(data.length - 1, data.length - 1);
  console.log('day2Watchtime:');
  console.log(day2Watchtime);


}

/** FUNCTIONS FOR WORKING WITH VIDEOS **/
// get video duration by id
const getVideoDurationById = (id, callback) => {
  // i is used in assignDuration 

  if ((typeof callback).toString() != 'function') return; // hacky, find out why it happens
  axios.get(
    `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${apiKey}`)
    .then(response => {

      const json = response.data;

      if (json.items[0] == undefined) { // when video is now private, for example
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
  if (videoObject == undefined) return;

  const videoUrl = videoObject.titleUrl;


  if (videoUrl == undefined) return;

  let url = new URL(videoUrl);

  return url.searchParams.get("v");
};

// assign a duration field to a JSON video object zgodovina_ogledov.json 
const assignDuration = (startIndex, callback, size) => {

  let videosFetched = size; // number of videos to get duration for

  // assume data represents json file (json objects)
  for (let i = startIndex; i > -size + startIndex; i--) {
    let id = getVideoId(data[i]);

    if (data[i] == undefined)
      data[i]["duration"] = "not found with API";

    // add duration field to every video object
    getVideoDurationById(id, (duration) => {
      videosFetched--;

      console.log(duration);
      data[i]["duration"] = duration;

      console.log(`${id}'s duration: ${duration}`);
      console.log(`i: ${i}`);

      callback(videosFetched);
    });
  };
}

/** FUNCTIONS FOR WORKING WITH DATE,TIME **/
// String --> Date 
const parseISOString = (s) => {
  let b = s.split(/\D+/);

  // returns day of month/month/year
  return new Date(Date.UTC(b[0], --b[1], ++b[2]));
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

  return start;
};


const withinDay = (day, pendingDay) => {
  // testing whether day == pendingDay
  //console.log(day.getDate() == pendingDay.getDate() && day.getMonth() == pendingDay.getMonth() && day.getFullYear() == pendingDay.getFullYear());

  return day.getDate() == pendingDay.getDate() && day.getMonth() == pendingDay.getMonth() && day.getFullYear() == pendingDay.getFullYear();
};

// for quickly testing
Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

/** FUNCTIONS FOR ANALYZING WATCHIME **/

// maps weeks to total watchtime in that week
let week2Watchtime = [];

// maps days to total watchtime in that day
let day2Watchtime = [];

// by weeks
const weeksToTime = (size, startFrom) => {
  let weekNumber = 1; // keeps track of the current week
  let firstDateInWeek = startOfWeek(parseISOString(data[startFrom].time)); // first date in current week (String -> Date)

  let weekWatchtime = 0; // current weeks's watchtime
  let firstId;

  for (let index = startFrom; index >= -size + startFrom; index--) {
    const currentElementDate = parseISOString(data[index].time);

    let id = getVideoId(data[index]);
    let duration = data[index].duration;


    if (withinWeek(firstDateInWeek, currentElementDate) && index != 0) {

      if (weekWatchtime == 0) firstId = id;

      // add to current week's watchime
      if (!isNaN(duration)) { // some videos are deleted
        weekWatchtime += duration;
      }

      // console.log(`weekWatchtime: ${weekWatchtime}`);

    } else {

      // for when index = 0
      if (!isNaN(duration)) { // some videos are deleted
        weekWatchtime += duration;
      }

      let lastId = null;

      if (index != 0) {
        lastId = getVideoId(data[index + 1]);
      } else {
        lastId = getVideoId(data[index]);
      }
      
      let month = new Array();
      month[0] = "January";
      month[1] = "February";
      month[2] = "March";
      month[3] = "April";
      month[4] = "May";
      month[5] = "June";
      month[6] = "July";
      month[7] = "August";
      month[8] = "September";
      month[9] = "October";
      month[10] = "November";
      month[11] = "December";

      let week = new Array();
      week[0] = "Sunday";
      week[1] = "Monday";
      week[2] = "Tuesday";
      week[3] = "Wednesday";
      week[4] = "Thursday";
      week[5] = "Friday";
      week[6] = "Saturday";

      let dayOfWeekStart = week[startOfWeek(firstDateInWeek).getDay()];
      let monthStart = month[startOfWeek(firstDateInWeek).getMonth()];
      let monthDateStart = startOfWeek(firstDateInWeek).getDate();

      let dayOfWeekEnd = week[endOfWeek(firstDateInWeek).getDay()];
      let monthEnd = month[endOfWeek(firstDateInWeek).getMonth()];
      let monthDateEnd = endOfWeek(firstDateInWeek).getDate();

      // push week object
      week2Watchtime.push({ week: `${dayOfWeekStart} ${monthStart} ${monthDateStart} -> ${dayOfWeekEnd} ${monthEnd} ${monthDateEnd}`,
       watchtime: weekWatchtime, 
       firstId: firstId, 
       lastId: lastId, 
       startOfWeek: startOfWeek(firstDateInWeek),
       endOfWeek: endOfWeek(firstDateInWeek)  
      });

      firstId = getVideoId(data[index]);
      // console.log(`week2Watchtime: ${JSON.stringify(week2Watchtime)}`);

      // log week's watchime
      // console.log(`Week nr. ${weekNumber} watchime: ${weekWatchtime}`);

      weekNumber++;
      // console.log("Week number:" + weekNumber);
      let start = currentElementDate;
      // console.log("Week no." + weekNumber + " starts with " + startOfWeek(start));

      firstDateInWeek = start; // currentElementDate determines the new week range
      // reset weekWatchime
      weekWatchtime = 0;
      if (!isNaN(duration)) { // some videos are deleted
        weekWatchtime += duration;
      }
    }
  }
};

// by days
const daysToTime = (size, startFrom) => {
  let durations = [];
  let dayNumber = 1; // keeps track of the current day
  let day = parseISOString(data[startFrom].time); // first date in current week (String -> Date)
  // console.log(day);
  let dailyWatchtime = 0; // current day's watchtime

  for (let index = startFrom; index >= -size + startFrom; index--) {
    const current = parseISOString(data[index].time);
    let duration = data[index]["duration"]; // should be a number

    if (withinDay(day, current) && index != 0) {

      // add to current day's watchime
      if (!isNaN(duration)) { // some videos are deleted
        dailyWatchtime += duration;
        durations.push(duration);
      }


    } else {
      if (index == 0) {
        console.log("index is 0!!:  ");
        console.log("current: ");
        console.log(current);
      }
      // for when index = 0
      if (!isNaN(duration)) { // some videos are deleted
        dailyWatchtime += duration;
        durations.push(duration);
      }

      // log all durations for this day
      // console.log(`new day begins with ${current}`);
      // console.log(`day: ${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()} durations: ${durations}`);
      durations = [];

      let lastId = null;

      if (index != 0) {
        lastId = getVideoId(data[index + 1]);
      } else {
        lastId = getVideoId(data[index]);
      }

      // push week object
      day2Watchtime.push({ day: `${day.getDate()}/${day.getMonth() + 1}/${day.getFullYear()}`, watchtime: dailyWatchtime, lastId: lastId });

      dayNumber++;
      // console.log("Day number:" + dayNumber);

      day = current;

      // reset weekWatchime
      dailyWatchtime = 0;

      if (index != 0) {
        if (!isNaN(duration)) { // some videos are deleted
          dailyWatchtime += duration;
          durations.push(duration);
        }
      }

    }
  }
};

/** GRAPHING **/

// display data in the browser using ChartJS
const graph = (graphLabels, graphData) => {
  console.log("data:  ");
  console.log(graphData);
  graphData.push(0);

  console.log("labels:  ");
  console.log(graphLabels);

  let ctx = document.getElementById('myChart').getContext('2d');
  console.log(ctx)
  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: graphLabels,
      datasets: [
        {
          label: "Watchime (hrs)",
          backgroundColor: 'rgba(255, 57, 43, 0.45)',
          borderColor: 'rgba(250, 0, 0)',
          borderWidth: '1',
          data: graphData
        }
      ]
    },
    options: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Youtube watchime (hrs)'
      }
    }
  });
};

// graphs [size] days starting from [startDay]
const graphFromTo = (dateFrom, dateTo, unit) => {

  // everything to 0 for easier comparison
  dateFrom.setHours(0);
  dateFrom.setMinutes(0);
  dateFrom.setSeconds(0);
  dateFrom.setMilliseconds(0);

  console.log('dateFrom:  ');
  console.log(dateFrom);
  console.log(dateFrom.getTime());

  dateTo.setHours(0);
  dateTo.setMinutes(0);
  dateTo.setSeconds(0);
  dateTo.setMilliseconds(0);

  console.log('dateTo:  ');
  console.log(dateTo);

  if(dateFrom == null || dateTo == null) {
    alert('Choose from and to dates!!');
  }

  // check date range
  if(dateFrom.getTime() > dateTo.getTime()) {
    alert('fromDate must be before or equal to toDate!!');
    return;
  }

  let count = 0;

  // count number of days to graph, call graphDays(start, count)
  day2Watchtime.forEach((day, index) => {

    let separatedDate = day.day.split('/');
    let date = new Date();
  
    date.setDate(separatedDate[0]);
    date.setMonth(--separatedDate[1]);
    date.setFullYear(separatedDate[2]);
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    if(index == 0) {
      lastDateInFile = date;
    }

    if(dateFrom.getTime() <= date.getTime() && date.getTime() <= dateTo.getTime()) {
      count++;
      console.log('date within range: ');
      console.log(date);
    }
  });

  if(dateFrom.getTime() < lastDateInFile) { // we are limited to dates in file
    dateFrom = lastDateInFile; 
  }

  let dayOfMonth = dateFrom.getDate();
  let month = dateFrom.getMonth();
  let year = dateFrom.getFullYear();

  month++;

  let startDay = dayOfMonth + '/' + month + '/' + year;

  switch(unit) {
    case 'Day':
      console.log(`graphing ${count} days from ${startDay}`);
      graphDays(startDay, count);
      break;
    case 'Week':
      console.log(`graphing by weeks from ${fromDate} to ${toDate}`);
      graphWeeks(dateFrom, toDate);
      break;
    default:
      return;
  }
}

// graphs [size] days starting from [startDay]
const graphDays = (startDay, size) => {
  console.log('startDay: ')
  console.log(startDay);

  // create labels, data
  let labels = [];
  let graphData = [];

  let startDayIndex;
  day2Watchtime.forEach((day, index) => {

    if (day.day == startDay) {
      startDay = day;
      startDayIndex = index;
    }

    if (index >= startDayIndex && index < startDayIndex + size) {

      labels.push(day.day);
      graphData.push(Math.floor(day.watchtime / (60*60))); // in mins
    }
  });

  graph(labels, graphData);

}
  // graphs weeks starting from [startDay]'s week to [endDay]'s week 
const graphWeeks = (startDay, endDay) => {

  // create labels, data
  let labels = [];
  let graphData = [];

  let startWeekIndex;
  week2Watchtime.forEach((week, index) => {

    week.startOfWeek.setHours(0);
    week.startOfWeek.setMinutes(0);
    week.startOfWeek.setSeconds(0);
    week.startOfWeek.setMilliseconds(0);

    week.endOfWeek.setHours(0);
    week.endOfWeek.setMinutes(0);
    week.endOfWeek.setSeconds(0);
    week.endOfWeek.setMilliseconds(0);

    if(week.endOfWeek.getTime() <= endDay.getTime() && week.startOfWeek.getTime() >= startDay.getTime()) {
      labels.push(week.week);
      graphData.push(Math.floor(week.watchtime/(60*60)));
    }
  });

  console.log(labels);
  console.log(graphData);

  // graphWeeks will get called before graph
  // call graph(labels, data)
  graph(labels, graphData);
}

/* TO-DO */
// graphWeeks function (similar to graphDays)
// connect HTML to JS (picking from/to date, unit)
// design front end in XD or Figma
// code the front end: style
// optional: drag & drop
// optional: alert when chosen dates are out of bound for file history