var moment = require('moment');
var chrono = require('chrono-node');
var request = require('request');
var Promise = require('bluebird');
var cheerio = require('cheerio');
var etl = require('etl');
var fs = require('fs');
var path = require('path');

Promise.promisifyAll(request,{multiArgs:true});
Promise.promisifyAll(fs);

// Figure out the date requested (default = yesterday)
var date = moment(chrono.parseDate(process.argv[2] || 'yesterday')).format('YYYYMMDD');

if (date === 'Invalid date')
  throw new Error(date);

console.log('Syncing',date);

// Start the pipeline
etl.toStream(function() {
    var self = this;

    // Create the directory if it doesnt already exist
    var dir = fs.mkdirAsync(path.join(__dirname,'files',date)).catch(Object);

    // Fetch the front page
    var res = request.getAsync('http://ruv.is/sarpur/calendar/ruv/'+date).spread(res => res);

    return Promise.join(res,dir, (res) => {
       var $ = cheerio.load(res.body);
        $('span.field-content').each(function() {
          var link = $(this).find('a').slice(0,1);
          // Push any content-links downstream
          if (link.text())
            self.push({link:link.attr('href'),text:link.text()});
        });
    });
  })

  // Open each link to parse the corresponding video url
  .pipe(etl.map(function(d) {
    return request.getAsync({url: 'http://ruv.is'+d.link})
      .spread(res => {
        var m = /source src=\"([^"]*\.mp4)\"/.exec(res.body);
        d.video = m && m[1];
        return d;
      });
  },{concurrency: 5}))

  // Download each video
  .pipe(etl.map(function(d) {
    console.log('Fetching',d.text);
    return request.get({url: d.video, encoding: null})
      .pipe(etl.toFile(path.join(__dirname,'files',date,d.text+'.mp4')))
      .promise()
      .then( () => console.log('done',d.text));
  },{concurrency: 3}))
  .promise()
  .then( () => console.log('all done'),e => console.log(e,e.stack));