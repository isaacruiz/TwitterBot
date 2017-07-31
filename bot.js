console.log('The bot is starting');
var Twit = require('twit');
var keys = require('./keys');
var T = new Twit(keys);


var exec = require('child_process').exec;
var fs = require('fs');
var i = 1;
postTweet();
setInterval(postTweet, 1000 * 60 * 60);
function postTweet()
{
  var cmd = 'processing-java --sketch=%cd%\\test_image --run';
  exec(cmd, processing);

    function processing()
    {
    var filename = 'test_image/output.png';
    var b64content = fs.readFileSync(filename, { encoding: 'base64' });
    T.post('media/upload', { media_data: b64content }, uploaded);

    function uploaded(err, data, response)
    {
      var id = data.media_id_string;

      var tweet =
      {
        status: 'Tweet number ' + i,
        media_ids: [id]
      }
      T.post('statuses/update', tweet, tweeted);
    }

    function tweeted(err, data, response){
      console.log('Tweeted');
    }
  }
  i++;
}
