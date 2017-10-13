console.log('The bot is starting');
var Twit = require('twit');
var keys = require('./keys_test');
var T = new Twit(keys);
var boundary_words = require('./boundary_words');
var screenName = "isaacmruiz";
//var boundary_words = ["nesw", "nneessww", "nnneeessswww", "nnnneeeesssswwww","nnnnneeeeessssswwwww"]; //Test boundary words
var unit = 50;
var tweet_num = 133;
var minMarginSize = 25; //pixels
var scaleFactor;

postTweet();
//setInterval(postTweet, 1000 * 60 * 60);
//setInterval(postTweet, 1000 * 10);
var stream = T.stream('user');

stream.on('tweet', function(data){

	sender = data.user.screen_name;

	//So that bot doesn't send reply on all tweet events where only @bot tweets trigger response
	if(sender != screenName && data.in_reply_to_screen_name == screenName){
		var fs = require('fs');
		var textToFile = JSON.stringify(data, null, 2);
		fs.writeFile("tweetdata.json", textToFile);


		tweetText = data.text

		var requestedBW = getBoundaryFromTweet(tweetText);

		boundWord = requestedBW;

		var polyominoData = getPolyominoData(boundWord);
		var polyWidth = polyominoData[0] - polyominoData[1];
		var polyHeight = polyominoData[2] - polyominoData[3];
		var polyArea = polyominoData[4];
		var isClosed = polyominoData[5];
		var lowestYcoord = polyominoData[3];

		console.log("poly width: " + polyWidth + " poly height: " + polyHeight);

		canvas = renderCanvas(requestedBW, polyWidth, polyHeight, lowestYcoord);

		T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, uploaded);

		function uploaded(err, data, response){
			var id = data.media_id_string;

			var tweet = {
			status: "@" + sender + " Here is the polyomino you requested!"
			+ "\nBoundary word: " + boundWord
			+ "\nBoundary length: " + boundWord.length
			+ "\nArea: " + polyArea
			+ "\n" + hashtags(polyArea),
			media_ids: [id]
			}
			T.post('statuses/update', tweet, tweeted);
		}

		function tweeted(err, data, response){
			console.log('Tweeted');
		}


		console.log("Replied to " + sender + "'s request of " + requestedBW);

		//var reply = "@" + sender + " replying to your message:" + tweetText;
		//T.post('statuses/update', {status: reply});
	}
})

function getBoundaryFromTweet(text){
	var i = 0;
	var bw = "";
	var temp = "";
	for(i in text){
	    temp = "";
	    while(i < text.length && (text[i] == 'n' || text[i] == 's' || text[i] == 'e' || text[i] == 'w')){
	        temp += text[i];
	        ++i
	    }
	    if (temp.length > bw.length){
	        bw = temp;
	    }
	}
	return bw;
}

function postTweet()
{
	boundWord = boundary_words[tweet_num];

	var polyominoData = getPolyominoData(boundWord);
	var polyWidth = polyominoData[0] - polyominoData[1];
	var polyHeight = polyominoData[2] - polyominoData[3];
	var polyArea = polyominoData[4];
	var isClosed = polyominoData[5];
	var lowestYcoord = polyominoData[3];

	canvas = renderCanvas(boundWord, polyWidth, polyHeight, lowestYcoord);

	T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, uploaded);

	function uploaded(err, data, response){
		var id = data.media_id_string;

		var tweet = {
		status: "Fixed simple polyomino number: " + tweet_num
		+ "\nBoundary word: " + boundWord
		+ "\nBoundary length: " + boundWord.length
		+ "\nArea: " + polyArea
		+ "\n" + hashtags(polyArea),
		media_ids: [id]
		}
		T.post('statuses/update', tweet, tweeted);
	}

	function tweeted(err, data, response){
		console.log('Tweeted');
	}
	tweet_num++;
}

function getPolyominoData(W){
	var xMax = 0;
	var yMax = 0;
	var xMin = 0;
	var yMin = 0;
	var xPrev = 0;
	var yPrev = 0;
	var x = 0;
	var y = 0;
	var det = 0;
	var closed = false;

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

		det += (xPrev * y - x * yPrev);

		if(x > xMax)
			xMax = x;
		if(x < xMin)
			xMin = x;
		if(y > yMax)
			yMax = y;
		if(y < yMin)
			yMin = y;

		xPrev = x;
		yPrev = y;
	}

	if  (x == 0 && y == 0)
		closed = true;

	var polyArea = Math.abs(det)/2;
	return [xMax, xMin, yMax, yMin, polyArea, closed];
}

function boundary_word_to_path(ctx, W)
{
	function setColor()
	{
		var randNum = (Math.trunc(Math.random()*1000) % 12) + 1;
		switch(randNum)
		{
			case 1:
				return "#FF0000"; //red

			case 2:
				return "#FFA500"; //orange

			case 3:
				return "#FFFF00"; //yellow

			case 4:
				return "#7FFF00"; //chartreuse green

			case 5:
				return "#008000"; //green

			case 6:
				return "#00FF7F"; //spring green

			case 7:
				return "#00FFFF"; //cyan

			case 8:
				return "#00CED1";  //dark turquoise

			case 9:
				return "#0000FF"; //blue

			case 10:
				return "#9400D3"; //violet

			case 11:
				return "#FF00FF"; //magenta

			default:
				return "#FF1493"; //rose
		}
	}

	ctx.strokeStyle = 'rgba(0,0,0,1)';
	ctx.beginPath();
	var x = xInit;
	var y = yInit;

	ctx.lineTo(x, y);
	for (var i = 0; i < W.length; ++i)
	{
		if (W[i] == 'n')
			y -= unit * scaleFactor;
			//y -= unit;
		else if (W[i] == 'e')
			x += unit * scaleFactor;
			//x += unit;
		else if (W[i] == 'w')
			x -= unit * scaleFactor;
			//x -= unit;
		else
			y += unit * scaleFactor;
			//y += unit;
		ctx.lineTo(x, y);
	}
	ctx.lineWidth = 10 * scaleFactor;
	ctx.lineCap = "square";
	ctx.stroke();
	ctx.fillStyle=setColor();
	ctx.fill();
}

function renderCanvas(bw, polyWidth, polyHeight, yMin){
	var canvasHeight = 5;
	var canvasWidth =  2 * canvasHeight

	var Canvas = require('canvas');
	var	Image = Canvas.Image;
	var canvas = new Canvas(canvasWidth * unit, canvasHeight * unit);
	var	ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'rgba(255, 255, 255, 0.99)';

	ctx.fillRect(0,0, canvas.width, canvas.height);


	//Scale polyomino up to fit fixed window
	if(polyHeight >= polyWidth / 2)
		 scaleFactor = (canvas.height - 2 * minMarginSize)/(polyHeight * unit);

	else
		scaleFactor = (canvas.width - 2 * minMarginSize)/(polyWidth * unit);

	////Scale to change thickness of line in resizeable canvas setup
	xInit = (canvas.width - (polyWidth * scaleFactor * unit)) / 2
	yInit = (canvas.height - (polyHeight * scaleFactor * unit)) / 2 - (yMin * scaleFactor * unit);
	boundary_word_to_path(ctx, bw)
	return canvas;
}

function hashtags(polyArea)
{
	var areaHashtag;
	switch(polyArea)
	{
		case 1:
			areaHashtag = "#monomino";
			break;
		case 2:
			areaHashtag = "#domino";
			break;
		case 3:
			areaHashtag = "#tromino";
			break;
		case 4:
			areaHashtag = "#tetromino";
			break;
		case 5:
			areaHashtag = "#pentomino";
			break;
		case 6:
			areaHashtag = "#hexomino";
			break;
		case 7:
			areaHashtag = "#heptomino";
			break;
		case 8:
			areaHashtag = "#octomino";
			break;
		case 9:
			areaHashtag = "#nonomino";
			break;

		case 10:
			areaHashtag = "#decomino";
			break;

		case 11:
			areaHashtag = "#undecomino";
			break;
		case 12:
			areaHashtag = "#dodecomino";
			break;

		default:
			areaHashtag = ("#" + polyArea + "omino");
			break;
	}
	return (areaHashtag + " #geometry #polyomino");
}
