var path = require('path');
var express = require('express');
var helmet = require('helmet');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var mongoose;
if (process.argv.length > 2 && process.argv[2] == 'test') {
  mongoose = require('./db/dbconnect')(true);
} else {
  mongoose = require('./db/dbconnect')(false);
}
var Sheet = require('./db/Sheet')(mongoose);
var Temp = require('./db/Temp')(mongoose);
var Feedback = require('./db/Feedback')(mongoose);
var index = require('./routes/index');
var load = require('./routes/load')(Sheet);
var save = require('./routes/save')(Sheet);
var auth = require('./routes/auth');
var manual = require('./routes/manual');
var manual_keyboard = require('./routes/manual_keyboard');
var mocha_test = require('./routes/mocha_test');
var getCID = require('./routes/CID');
var tempload = require('./db/tempload');
var tempsave = require('./db/tempsave');
var feedback = require('./routes/feedback')(Feedback);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(helmet());

app.use('/', index);
app.use('/manual', manual);
app.use('/manual_keyboard', manual_keyboard);
app.use('/mocha_test', mocha_test);
app.use('/load', load);
app.use('/save', save);
app.use('/auth', auth);
app.use('/CID', getCID);
app.use('/feedback', feedback);

app.use(express.static(path.resolve(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

var port = process.env.PORT || 8080;
var host = process.env.host || "http://127.0.0.1";

http.listen(port, function () {
  console.log('Example app listening on '+host+':'+port);
  console.log('Example sheet on '+host+':'+port+'/?!WPR21F2BZT!FTBT+6SPTLB7BNCYJEYZ');
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
        tempload(Temp, index, function(temp_data){
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
          tempsave(Temp, index, sheet_data[index], function(){
            delete socket_count[index];
            delete sheet_data[index];
          });
        }
      });
      socket.on('cleartemp', function() {
          tempsave(Temp, index, [], function() {
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