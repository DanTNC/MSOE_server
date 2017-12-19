var socket = io();
var sheetchange = (data, index)=>{
    socket.emit("modify",data, index);
};
var suscribe = (index)=>{
    socket.emit("sync",index);
};

socket.on("real_time", (Act)=>{
    //MSOE.sync(Act); taken out for now, actived after actions completed
});

//TODO: check key to prevent unauthorized user from editing