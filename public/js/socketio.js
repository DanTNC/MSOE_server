var socket = io();
var sheetchange = (data, index)=>{
    socket.emit("modify", data, index);
};
var suscribe = (index)=>{
    socket.emit("sync", index);
};

socket.on("real_time", (Act)=>{
    //MSOE.sync(Act); taken out for now, actived after actions completed
});

socket.on("update", (actions)=>{
    console.log("update the sheet with:\n", actions);
    //TODO: tell user the sheet's loading
    preview_mode();
    for (let Act of actions){
        //MSOE.sync(Act); taken out for now, actived after actions completed
    }
    edit_mode();
});

//TODO: check key to prevent unauthorized user from editing