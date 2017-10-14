var socket = io();
var sheetchange = (data)=>{
    socket.emit("modify",data);
};

socket.on("real_time", (Act)=>{
    MSOE.redo(Act);
});