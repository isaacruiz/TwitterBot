
(function(){
console.log('The bot is starting');
var Twit = require('twit');
var keys = require('./keys_test');
//var keys = require('./keys');
var T = new Twit(keys);
var boundary_words = require('./boundary_words');
var screenName = "isaacmruiz";
//var screenName = "PolyominoBot";

var unit = 50; //no pixels per unit length
var tweet_num;
var minMarginSize = 25; //pixels
var scaleFactor;
var fs = require('fs');
try{
	tweet_num = fs.readFileSync("tweet_num.txt", "utf8");
}
catch(err){
	tweet_num = 0;
}

postTweet();
//setInterval(postTweet, 1000 * 60 * 60);
setInterval(postTweet, 1000 * 30);
var stream = T.stream('user');

stream.on('tweet', function(data){

	sender = data.user.screen_name;
	tweetId = data.id;

	//So that bot doesn't send reply on all tweet events. Only @screenName (bot twitter handle)
	//tweets trigger response
	if(sender != screenName && data.in_reply_to_screen_name == screenName){

		var textToFile = JSON.stringify(data, null, 2);
		fs.writeFile("tweetdata.json", textToFile, (err) => {
			if (err) throw err;
		});

		if(data.extended_tweet == null)
			tweetText = data.text;

		else {
			tweetText = data.extended_tweet.full_text;
		}
		var reqBW = getBoundaryFromTweet(tweetText.toLowerCase());

		var polyominoData = getPolyominoData(reqBW);
		var polyWidth = polyominoData[0] - polyominoData[1];
		var polyHeight = polyominoData[2] - polyominoData[3];
		var polyArea = polyominoData[4];
		var lowestXcoord = polyominoData[1];
		var lowestYcoord = polyominoData[3];

		var isClockwise = clockwise(reqBW);
		var isIntersecting = collision(reqBW);
		var isClosed = polyominoData[5];
		var isValidBoundary = isClockwise && !isIntersecting && isClosed;
		var tiling = tiles(reqBW);

		if(isIntersecting){
			console.log("There is a collision");
		}
		else {
			console.log("There was no collision");
		}

		if(isClockwise){
			console.log("The bw is clockwise");
		}
		else {
			console.log("The bw is not clockwise");
		}

		if(isClosed){
			console.log("The bw is closed");
		}
		else {
			console.log("The bw is not closed");
		}

		if(tiling){
			console.log("It tiles!");
		}
		else {
			console.log("It does not tile");
		}

		console.log("poly width: " + polyWidth + " poly height: " + polyHeight);
		canvas = renderCanvas(reqBW, polyWidth, polyHeight, lowestXcoord, lowestYcoord);
		T.post('media/upload', {media_data: canvas.toBuffer().toString('base64')}, uploaded);

		function uploaded(err, data, response){
			if(err){
				console.log(err);
				console.log("Failed to upload image")
			}
			else{
				var id = data.media_id_string;
				var replyText;
				var til;
				if(tiling)
					til = "Yes!!";
				else
					til = "No"

				if(isValidBoundary){

					if(reqBW.length < 140){
						replyText = "@" + sender + " Here you go!"
						+ "\nBoundary: " + reqBW
						+ "\nArea: " + polyArea
						+"\nTiles by translation: " + til
						+ "\n" + hashtags(polyArea, true);
					}
					else{
						replyText = "@" + sender + " Here you go!"
						+ "\nBoundary: Ahh! Too long for me to repost!"
						+ "\nArea: " + polyArea
						+"\nTiles by translation: " + til
						+ "\n" + hashtags(polyArea, true);
					}

					if(tiling)
						replyText += " #ItTiles"
				}

				else if(reqBW.length < 4){
					replyText = "@" + sender + " Sorry! I didn't see a boundary word in your tweet";
				}
				else if(isClosed && !isIntersecting && !isClockwise){
					replyText = "@" + sender + " I like polyomino boundary words that are read in clockwise orientation. Please try correcting and resending your request :)";
				}
				else if(isIntersecting && isClosed){
					if(reqBW.length < 140){
						replyText = "@" + sender + " Whoa! \"" + reqBW + "\" self intersects! Watch what you're doing! #notaPolyomino"
					}
					else {
						replyText = "@" + sender + " Whoa! The requested boundary word self intersects! Watch what you're doing! #notaPolyomino"
					}
				}
				else{
					switch(Math.floor(Math.random()*5)){
						case 0:
							replyText = "Sorry @" + sender + ", the polyomino you requested is not a closed path!";
							break;

						case 1:
							replyText = "@" + sender + " Have you tried checking wikipedia for the definition of a polyomino? The boundary word I saw was not valid! https://en.wikipedia.org/wiki/Polyomino";
							break;

						case 2:
							replyText = "@" + sender + " Oops! something is wrong with your reqested polyomino.  Please try again."
							break;

						case 3:
							replyText = "@" + sender + " Hmm, something is wrong with the boundary word. Please make sure it's a closed,  path!";
							break;

						case 4:
							replyText = "@" + sender + " You might have mistyped the boundary! Try tweeting at me again!"
							break;


					}
				}
				if(isValidBoundary){
					console.log("reply to tweet id: " + tweetId);
					var tweet = {
						status: replyText,
						media_ids: [id],
				//		in_reply_to_status_id: tweetId,
				//		auto_populate_reply_metadata: true
					}
				}
				else{
					var tweet = {
						status: replyText,
				//		in_reply_to_status_id: tweetId,
				//		auto_populate_reply_metadata: true
					}
				}
				function sendReply(){
					T.post('statuses/update', tweet, tweeted)
					console.log("Attempted to reply to sender " + sender + "'s tweet of " + tweetText);
				}
				setTimeout(sendReply, 10000);
			}
		}

		function tweeted(err, data, response){
			if(err){
				console.log(err)
				console.log("Error! Failed to reply to tweet")
				var e = JSON.stringify(err, null, 2);
				var d = JSON.stringify(data, null, 2);
				var r = JSON.stringify(response, null, 2);
				fs.writeFile("err_data.json", d);
				fs.writeFile("err_response.json", r);
				fs.writeFile("err.json", e);
			}
			else {
				console.log("Replied to user " + sender + "'s request of boundary word " + reqBW);
			}
		}
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
	var lowestXcoord = polyominoData[1];
	var lowestYcoord = polyominoData[3];
	var til;
	var tiling = tiles(boundWord);
	if(tiling)
		til = "Yes!!";
	else
		til = "No"

	canvas = renderCanvas(boundWord, polyWidth, polyHeight, lowestXcoord, lowestYcoord);

	T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, uploaded);

	function uploaded(err, data, response){

		if(err){
			console.log("Failed to upload image");
		}
		var id = data.media_id_string;

		var statusText = "Fixed simple polyomino no: " + tweet_num
		+ "\nBoundary: " + boundWord
		+ "\nArea: " + polyArea
		+"\nTiles by translation: " + til
		+ "\n" + hashtags(polyArea, false);

		if(tiling)
			statusText += " #ItTiles";

		var tweet = {
		status: statusText,
		media_ids: [id]
		}

		T.post('statuses/update', tweet, tweeted);
	}

	function tweeted(err, data, response){
		if(err){
			console.log("Failed to post tweet")
			console.log(err);
		}
		else
			console.log('Tweeted polyomino ' + tweet_num);
	}
	tweet_num++;
	fs.writeFile('tweet_num.txt', tweet_num, (err) => {
		if (err) throw err;
	})
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

function boundary_word_to_path(ctx, W, xInit, yInit)
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

function renderCanvas(bw, polyWidth, polyHeight, xMin, yMin){
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
	xInit = (canvas.width - (polyWidth * scaleFactor * unit)) / 2 - (xMin * scaleFactor * unit);
	yInit = (canvas.height - (polyHeight * scaleFactor * unit)) / 2 - (yMin * scaleFactor * unit);
	boundary_word_to_path(ctx, bw, xInit, yInit)
	return canvas;
}

function hashtags(polyArea, userReq)
{
	var areaHashtag;
	var htString;
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
	if (userReq){
		htString = areaHashtag + " #geometry #UserRequest";
	}
	else {
		htString = areaHashtag + " #geometry #polyomino";
	}
	return htString;
}

function circularWord(bw)
{
	var up, down, left, right;
	up = down = left = right = 0;
	for (var i = 0; i < bw.length; i++)
	{
		switch (bw.charAt(i))
		{
			case 'n':
				up++;
				break;

			case 's':
				down++;
				break;

			case 'w':
				left++;
				break;
			case 'e':
				right++;
				break;
		}
	}
	if (left == right && up == down)
		return true;

	else
		return false;
}

function getCoordinates(bw){

	var arr = [];

	//Initialize coordinate array
	var x = 0;
	var y = 0;

	for (i = 0; i <bw.length; i++)
	{
		var c = {};
		switch (bw.charAt(i))
		{
		case 'n':
			y--;
			break;

		case 's':
			y++;
			break;

		case 'w':
			x--;
			break;

		case 'e':
			x++;
			break;
		}
		c.x = x;
		c.y = y;

		arr.push(c);
	}
	function compare(a,b) {
		if (a.x < b.x)
			return -1;

		if (a.x > b.x)
			return 1;

		if (a.x == b.x){
			if (a.y < b.y)
				return -1;

			if (a.y > b.y)
				return 1;
			return 0;
		}
	}
	arr.sort(compare);
	return arr;
}

function collision(bw)
{
	var arr = getCoordinates(bw);

	for (var i = 0; i < bw.length - 1; i++)
	{
		if (arr[i].y == arr[i + 1].y && arr[i].x == arr[i + 1].x)
				return true;
	}
	return false;
}

function clockwise(bw)
{

	var current;
	var next;
	var cw = 0;
	var ccw = 0;

	for (var i = 0; i < bw.length; i++)
	{
		current = bw.charAt(i);

		if (i == bw.length - 1)
			next = bw.charAt(0);

		else
			next = bw.charAt(i + 1);

		switch (current)
		{
			case 'n':
				if (next == 'e')
					cw++;
				if (next == 'w')
					ccw++;
				break;

			case 's':
				if (next == 'w')
					cw++;
				if (next == 'e')
					ccw++;
				break;

			case 'w':
				if (next == 'n')
					cw++;
				if (next == 's')
					ccw++;
				break;

			case 'e':
				if (next == 's')
					cw++;
				if (next == 'n')
					ccw++;
				break;
		}
	}

	if (cw > ccw)
		return true;

	else
		return false;
}

function reverseComplement(s)
{
	var rc = "";

	for (var i = s.length - 1; i >= 0; i--)
	{
		switch (s.charAt(i))
		{
			case 'n':
				rc += 's';
				break;

			case 's':
				rc += 'n';
				break;

			case 'w':
				rc += 'e';
				break;

			case 'e':
				rc += 'w';
				break;
		}
	}
	return rc;
}

function tiles(bw){
	if (!clockwise(bw) || collision(bw) || !circularWord(bw))
		return false;
	//for every possible six locations
	//iterate over all possible choices of 6 position
	var str = bw + bw;
	var posA = 0;
	var posB;
	var posC;
	//Length of factors
	var lenA = 1;
	var lenB = 1;
	//Strings of factors
	var A;
	var B;
	var C;
    var i;
	//Iterate over all possible positions of factorizations A B and C
	for (posA = 0; posA < bw.length / 2; posA++)
	{
		for (lenA = 1; lenA < bw.length / 2; lenA++)
		{
			A = str.substring(posA, lenA + posA);
            i = posA + bw.length / 2;

			if (reverseComplement(A) == str.substring(posA + bw.length / 2, lenA + i ))
			{

				for (lenB = 1; lenA + lenB <= bw.length / 2; lenB++)
				{
					posB = posA + lenA;
					B = str.substring(posB, lenB + posB);
                    i = posB + bw.length / 2
					if (reverseComplement(B) == str.substring(posB + bw.length / 2, lenB + i))
					{
						if (lenA + lenB == bw.length)
							return true;
						else {

							posC = posB + lenB;
							C = str.substring(posC, bw.length / 2 - (lenB + lenA) + posC);

                            i = posC + bw.length / 2;
							if (reverseComplement(C) == str.substring(posC + bw.length / 2, bw.length / 2 - (lenB + lenA) + i))
								return true;

						}
					}
				}
			}
		}
	}
	return false;
}
})();
