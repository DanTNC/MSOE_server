/**
 * @func: a function initializing display
 * @sucfunc: a function initializing the sheet (MSOE object) when the loading is successful
 * @index: index of the sheet data (ID)
 * @key: key of the sheet data (password)
 * */
var server_load = (func, sucfunc, index, key) => {
    $.ajax({
        url: "/load",
        method: "POST",
        data: {
            index: index,
            key: key,
        },
        success: sucfunc,
        error: function() {
            console.log("Ajax error when POST /load");
            func();
        }
    });
};
/**
 * @data: sheet data to be saved
 * @func: a function executed when the saving is successful
 * */
var server_save = (data, func) => {
    $.ajax({
        url: "/save",
        method: "POST",
        data: data,
        success: func,
        error: function() {
            console.log("Ajax error when POST /save");
        }
    });
};
/**
 * @callback: a function executed after a good response is received
 * */
var server_getCID = (callback) => {
    $.ajax({
        url: "/CID",
        method: "POST",
        success: function(data) {
            callback(data.CID);
        },
        error: function() {
            console.log("Ajax error when POST /CID");
        }
    });
};
/**
 * @callback: a function executed after a good response is received
 * */
var server_feedback = (values, callback) => {
    $.ajax({
        url: "/feedback",
        method: "POST",
        data: values,
        success: function(data) {
            callback(data.status);
        },
        error: function() {
            console.log("Ajax error when POST /feedback");
        }
    });
};