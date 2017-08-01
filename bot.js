console.log('The bot is starting');
var Twit = require('twit');
var keys = require('./keys');
var T = new Twit(keys);
	
var Canvas = require('canvas'), Image = Canvas.Image, canvas = new Canvas(200, 200), ctx = canvas.getContext('2d');

/*
function enumerate_boundary_words(n, k)
{
        function neighbors(p)
	{
                return [(p[0], p[1]+1), (p[0]+1, p[1]), (p[0]-1, p[1]), (p[0], p[1]-1)]
	}

        function dir(p1, p2)
	{
                return (p2[0]-p1[0], p2[1]-p1[1])
	}

        path = [(0, 0)]
        function recurse()
	{
                if (len(path) > n)
                        return;
                if (len(path) == n)
				{
                        if (!((0, 0) in neighbors(path[-1])))
                                return;
                        // Convert to a boundary word and yield it
		
                        word = (map(lambda i: vec2dir[dir(path[i], path[i+1])], xrange(len(path)-1)) +
                                [vec2dir[dir(path[-1], (0, 0))]])
                        if is_polyomino(word) and min(path) == (0, 0):
                                yield word
                }
				head = path[-1]
                for new in [(head[0], head[1]+1), (head[0]+1, head[1]), (head[0]-1, head[1]), (head[0], head[1]-1)]:
                        if not (new in path): # Check for self-intersection
                                path.append(new)
                                for w in recurse():
                                        yield w
                                path.pop()
        for w in recurse():
                yield w
	}
} 
*/

var tweet_num = 1;
postTweet();
setInterval(postTweet, 1000 * 30);
function postTweet(){

	function boundary_word_to_path(ctx, W)
	{
		ctx.strokeStyle = 'rgba(0,0,0,10)';
		ctx.beginPath();
		var x = 80
		var y = 80
		ctx.lineTo(x, y);
		for (var i = 0; i < W.length; ++i)
		{
			if (W[i] == 'U')
				y -= 30;
			else if (W[i] == 'R')
				x += 30;
			else if (W[i] == 'L')
				x -= 30;
			else
				y += 30;
			ctx.lineTo(x, y);
		}			
		ctx.stroke();
	}

	boundary_word_to_path(ctx, "RDRRDRDLDLULDLULURUU")

	T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, uploaded);

		function uploaded(err, data, response)
		{
			var id = data.media_id_string;

			var tweet =
			{
			status: 'Tweet number ' + tweet_num,
			media_ids: [id]
			}
			T.post('statuses/update', tweet, tweeted);
		}

		function tweeted(err, data, response){
		console.log('Tweeted');
		}
	tweet_num++;
}
