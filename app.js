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

var sheet_data = {};
var socket_count = {};

io.on("connection", function(socket){
  console.log('connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('sync', function(index){
    sheet_data[index] = sheet_data[index] || [];
    socket.emit("update", sheet_data[index]);
    socket_count[index] = (socket_count[index] || 0) + 1;
    socket.join(index, function(){
      let rooms = Object.keys(socket.rooms);
      console.log(rooms);
      socket.on('disconnect', function(){
        console.log('user leave from '+index);
        socket_count[index]--;
        if(socket_count[index] == 0){
          console.log("save "+JSON.stringify(sheet_data[index]));//TODO: save changed sheet in tmp database
          socket_count[index] == undefined;
          sheet_data[index] == undefined;
        }
      });
    });//TODO: check if tmp database has unsaved sheet and ask if load
  });
  socket.on('modify',function(data, index){
    if(Object.keys(socket.rooms).indexOf(index) < 0){
      console.log("not suscribe to "+index);
      return;
    }
    socket.broadcast.to(index).emit('real_time', data);
    sheet_data[index].push(data);
    console.log(sheet_data[index]);
  });
});