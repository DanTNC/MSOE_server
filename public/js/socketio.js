var socket = io();
var sheetchange = (data, index)=>{// data: action, index: index of sheet
    socket.emit("modify", data, index);
};
var suscribe = (index)=>{// index: index of sheet
    socket.emit("sync", index);
};
var sync_undo = ()=>{
    socket.emit("undo");
};
var sync_redo = ()=>{
    socket.emit("redo");
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

socket.on("undo", ()=>{MSOE.undo();});

socket.on("redo", ()=>{MSOE.redo();});

//TODO: check key to prevent unauthorized user from editing