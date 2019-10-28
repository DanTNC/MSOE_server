/* global MSOE io WarningMes preview_mode edit_mode */
var socket = io();
var sheetchange = (data, index)=>{// data: action, index: index of sheet
    socket.emit("modify", data, index);
};
var suscribe = (index, update, callback)=>{// index: index of sheet, update: if need to update
    socket.emit("sync", index, update, callback);
};
var sync_undo = ()=>{
    socket.emit("undo");
};
var sync_redo = ()=>{
    socket.emit("redo");
};
var clear_temp = ()=>{
    socket.emit("cleartemp");
};

socket.on("forceupdate", ()=>{
    UIhandler.forceupdate(()=>{window.location.reload();});
});

socket.on("real_time", (Act)=>{
    //MSOE.sync(Act); taken out for now, actived after multiple cursor completion
});

socket.on("update", (actions, callback)=>{
    console.log("update the sheet with:\n", actions);
    if(actions.length != 0){
        MSOE.unsave(true);
        WarningMes("Some unsaved modifications are found.");
    }else{
        MSOE.unsave(false);
    }
    MSOE.loading(true);
    preview_mode();
    for (let Act of actions){
        MSOE.sync(Act);
    }
    edit_mode();
    MSOE.loading(false);
    callback();
});

socket.on("undo", ()=>{MSOE.undo();});

socket.on("redo", ()=>{MSOE.redo();});

//TODO: check key to prevent unauthorized user from editing