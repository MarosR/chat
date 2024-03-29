// Setup basic express server
var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
// var io = require('../..')(server);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

// usernames which are currently connected to the chat
var usernames = {};
var numUsers = 0;

function getImgSrc(url) {
	return '<img src="'+url+'" height="200" width="200">';	
};	

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
  	var mem = '';
  	if(data==='/mem list' || data==='/mem') {
  		data = fs.readdirSync(__dirname + '/public/memy')
  		var memList = '';
  		data.forEach(function(file) {
			memList+=file+"<br>";
		});
  		
  		socket.emit('new message', {
  			username: '',
  			message: memList
  		});
  		return;
  	} else if (data.indexOf('/mem ') == 0) {
  		data = data.substr(5);
  		if(fs.existsSync(__dirname + '/public/memy/'+data+'.jpg')) {
  			mem = 'http://kamilkurek.org/memy/'+data+'.jpg';
  		} else if(fs.existsSync(__dirname + '/public/memy/'+data+'.png')) {
  			mem = 'http://kamilkurek.org/memy/'+data+'.png';
  		} else if(fs.existsSync(__dirname + '/public/memy/'+data+'.gif')) {
  			mem = 'http://kamilkurek.org/memy/'+data+'.gif';
		}
  		if(mem=='') {
  			socket.emit('new message', {
  			username: '',
  			message: 'takiego mema nie ma'
  			});
  			return;
  		}
  	} else if (data.indexOf('/')==0) {
  		socket.emit('new message', {
  			username: '',
  			message: 'eee, ni ma takiej komendy'
  		});
  		return;
  	}

  	if(mem!='') {
  		data = getImgSrc(mem);
  	}
  	//if     (data==='/nyan' ) { data=getImgSrc('http://media.giphy.com/media/zEO5eq3ZsEwbS/giphy.gif'); }
	//else if(data==='/kobra') { data=getImgSrc('http://i.ytimg.com/vi/Lm2BgHsOoLs/maxresdefault.jpg'); }

    // we tell the client to execute 'new message'
    io.sockets.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    // remove the username from global usernames list
    if (addedUser) {
      delete usernames[socket.username];
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});