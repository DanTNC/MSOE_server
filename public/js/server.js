server_load = (func, sucfunc, index, key) => {
    $.ajax({
        url: "/load",
        method: "POST",
        async: false,
        data: {
            index: index,
            key: key,
        },
        success: sucfunc
        ,
        error: function() {
            console.log("Ajax error when POST /load");
            func();
        }
    });
};

server_save = (data, func) => {
    $.ajax({
        url: "/save",
        method: "POST",
        async: false,
        data: data,
        success: func,
        error: function() {
            console.log("Ajax error when POST /save");
        }
    });
};