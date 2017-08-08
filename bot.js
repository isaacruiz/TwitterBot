console.log('The bot is starting');
var Twit = require('twit');
var keys = require('./keys');
var T = new Twit(keys);
var boundary_words = require('./boundary_words');
	
var Canvas = require('canvas'), Image = Canvas.Image, canvas = new Canvas(300, 300), ctx = canvas.getContext('2d');

var tweet_num = 4;
postTweet();
setInterval(postTweet, 1000 * 60 * 15);

function postTweet()
{
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,canvas.width,canvas.height);
	var unit = 30;
	var canvasSize = 10;
	var boundary_box = bounding_box(boundary_words[tweet_num]);
	var polyWidth = boundary_box[0] - boundary_box[1];
	var polyHeight = boundary_box[2] - boundary_box[3];
	var xInit = Math.trunc((canvasSize - polyWidth)/2);
	var yInit =  Math.trunc((canvasSize - polyHeight)/2 - boundary_box[3]);
	boundary_word_to_path(ctx, boundary_words[tweet_num])
	function bounding_box(W)
	{
		var xMax = 0;
		var yMax = 0;
		var xMin = 0;
		var yMin = 0;
		var x = 0;
		var y = 0;
		
		for(var i = 0; i < W.length; ++i)
		{
			if (W[i] == 'n')
				y--;
			else if (W[i] == 'e')
				x++;
			else if (W[i] == 'w')
				x--;
			else
				y++;
				
			if(x > xMax)
				xMax = x;
			if(x < xMin)
				xMin = x;
			if(y > yMax)
				yMax = y;
			if(y < yMin)
				yMin = y;
		}
		return [xMax, xMin, yMax, yMin];
	}
	function boundary_word_to_path(ctx, W)
	{
		
		ctx.strokeStyle = 'rgba(0,0,0,10)';
		ctx.beginPath();
		var x = xInit * unit;
		var y = yInit * unit;
		
		ctx.lineTo(x, y);
		for (var i = 0; i < W.length; ++i)
		{
			if (W[i] == 'n')
				y -= unit;
			else if (W[i] == 'e')
				x += unit;
			else if (W[i] == 'w')
				x -= unit;
			else
				y += unit;
			ctx.lineTo(x, y);
		}			
		ctx.stroke();
	}

	T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, uploaded);

	function uploaded(err, data, response)
	{
		var id = data.media_id_string;

		var tweet =
		{
		status: "Polyomino Number: " + tweet_num + "\nBoundary Word: " + boundary_words[tweet_num - 1] + "\nBoundary Length: " + boundary_words[tweet_num - 1].length,
		media_ids: [id]
		}
		T.post('statuses/update', tweet, tweeted);
	}

	function tweeted(err, data, response)
	{
		console.log('Tweeted');
	}
	tweet_num++;
}