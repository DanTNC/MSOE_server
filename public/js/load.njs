#!/usr/local/bin/node

var querystring = require('querystring');
var param = querystring.parse(process.env.QUERY_STRING);
var fs = require('fs');
var MongoDB = require('mongodb').MongoClient;

var data = fs.readFileSync('mongo.json', 'utf-8');
var account = JSON.parse(data);

console.log('Content-type: text/plain; charset=utf-8\n');

if(param.index.length != 10)
{
  console.log("!!");
  return;
}

if(param.key.length != 15)
{
  console.log("!!");
  return;
}


MongoDB.connect("mongodb://"+account.id+":"+account.pwd+"@localhost/wp2016_groupJ", function(err, db)
{
  if(!err)
  {
    db.collection('MSOE', function(err, collection)
    {
      collection.findOne({ index: param.index}, function(err, data)
      {
        if(data) {
          if( data.key.localeCompare(param.key) != 0)
          {
            console.log("");
          }
          else {
            console.log(data.ttlstr+"!"+data.tmpstr+"!"+data.abcstr);
          }
        }
        else
          console.log("");
      });
    });
  }
  db.close();
});


