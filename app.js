var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var app = express();
var http = require('http').Server(app)
var io = require('socket.io')(http);

var index = require('./routes/index');
var load = require('./routes/load');
var save = require('./routes/save');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(helmet());

app.use('/', index);
app.use('/load', load);
app.use('/save', save);

app.use(express.static(path.resolve(__dirname, 'public')));

var port = process.env.PORT || 8080;

http.listen(port, function () {
  console.log('Example app listening on http://msoe-fad11204.c9users.io:'+port);
});

io.on("connection", function(socket){
  var actions = [];
  console.log('connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('modify',function(data){
    io.emit('real_time', data);
    actions.push(data);
    console.log(actions);
  });
});