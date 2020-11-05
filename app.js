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
var auth = require('./routes/auth');
var manual = require('./routes/manual');
var getCID = require('./routes/CID');
var tempload = require('./db/tempload');
var tempsave = require('./db/tempsave');
var feedback = require('./routes/feedback');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(helmet());

app.use('/', index);
app.use('/manual', manual);
app.use('/load', load);
app.use('/save', save);
app.use('/auth', auth);
app.use('/CID', getCID);
app.use('/feedback', feedback);

app.use(express.static(path.resolve(__dirname, 'public')));

var port = process.env.PORT || 8080;

http.listen(port, function () {
  console.log('Example app listening on http://127.0.0.1:'+port);
  console.log('Example sheet on http://127.0.0.1:'+port+'/?!WPR21F2BZT!FTBT+6SPTLB7BNCYJEYZ');
});

var sheet_data = {};
var socket_count = {};

io.on("connection", function(socket){
  console.log('connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  socket.on('sync', function(index, update, callback){
    socket_count[index] = (socket_count[index] || 0) + 1;
    if(socket_count[index] == 1){//first save or connect
      if(update){//first connect (load temp data)
        tempload(index, function(temp_data){
          sheet_data[index] = temp_data;
          socket.emit("update", sheet_data[index], callback);
        });
      }else{//first save
        sheet_data[index] = [];
      }
    }else{//sync with already connected others
      if(update){//update with other guys
        sheet_data[index] = sheet_data[index] || [];
        socket.emit("update", sheet_data[index], callback);
      }else{//save temp data
        sheet_data[index] = [];
      }
    }
    
    socket.join(index, function(){
      let rooms = Object.keys(socket.rooms);
      console.log(rooms);
      socket.on('disconnect', function(){
        console.log('user leave from '+index);
        socket_count[index]--;
        if(socket_count[index] == 0){
          console.log("save "+JSON.stringify(sheet_data[index]));
          tempsave(index, sheet_data[index], function(){
            delete socket_count[index];
            delete sheet_data[index];
          });
        }
      });
      socket.on('cleartemp', function() {
          tempsave(index, [], function() {
              sheet_data[index] = [];
              io.in(index).emit('forceupdate');
          });
      });
    });
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