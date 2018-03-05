var validate_token = (token, callback, succallback, errcallback) => {
    $.ajax({
        url: "https://www.googleapis.com/oauth2/v3/tokeninfo",
        method: "GET",
        data: {
            "access_token": token
        },
        success: function(data){
            if(data.error == "invalid_token"){
                ErrorMes("A permission is required");
                console.error("token is invalid");
            }else{
                callback(token, succallback, errcallback);
            }
        }
    });
};

var getMSOE_config = (token, succallback, errcallback) => {
    var url = window.location.search;
    $.ajax({
        url: "https://www.googleapis.com/drive/v3/files",
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        },
        data: {
            "spaces": "appDataFolder",
            "q": "name='MSOE.config'"
        },
        success: function(data){
            if(data.files.length > 0){
                succallback(token, data.files[0].id);
            }else{
                errcallback(token);
            }
        }
    }); 
};

var getAppProperties = (token, id, callback) => {
    $.ajax({
        url: "https://www.googleapis.com/drive/v3/files/" + id,
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        },
        data: {
            "fields": "appProperties"
        },
        success: function(data){
            if(callback){
                callback(data.appProperties);
            }else{
                UIhandler.imported(JSON.parse(data.appProperties.indexes));
            }
        }
    });
};

var updateMSOE_config = (token, id) => {
    getAppProperties(token, id, function(appProperties){
        var url = window.location.search;
        if(url == ""){
            ErrorMes("You have to save the sheet before export");
            console.error("no index in url");
            return;
        }
        var indexes = JSON.parse(appProperties.indexes);
        if(indexes.includes(url)){
            WarningMes("This sheet has been exported");
            console.warn("this sheet has been exported");
            return;
        }else{
            indexes.push(url);
            url = JSON.stringify(indexes);
        }
        $.ajax({
            url: "https://www.googleapis.com/upload/drive/v3/files/" + id + "?uploadType=multipart",
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "multipart/related; boundary=MxGD"
            },
            data: "--MxGD\nContent-Type: application/json; charset=UTF-8\n\n" +
            JSON.stringify({
                "appProperties": {
                    "indexes": url
                }
            }) + 
            "\n--MxGD\nContent-Type: text/plain\n\nplaceholder\n" +
            "--MxGD--",
            success: function(data){
                SuccessMes("Your sheet is successfully exported");
                console.log("successfully export sheet");
            }
        });
    });
};

var createMSOE_config = (token) => {
    var url = window.location.search;
    if(url == ""){
        ErrorMes("You have to save the sheet before export");
        console.error("no index in url");
        return;
    }
    url = "[\"" + url + "\"]";
    $.ajax({
        url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "multipart/related; boundary=MxGD"
        },
        data: "--MxGD\nContent-Type: application/json; charset=UTF-8\n\n" +
        JSON.stringify({
            "parents": [
                "appDataFolder"
            ],
            "appProperties": {
                "indexes": url
            },
            "name": "MSOE.config"
        }) + 
        "\n--MxGD\nContent-Type: text/plain\n\nplaceholder\n" +
        "--MxGD--",
        success: function(data){
            SuccessMes("Your sheet is successfully exported");
            console.log("successfully export sheet");
        }
    });
};

var _import = () => {
    var token = window.sessionStorage.getItem("drive");
    validate_token(token, getMSOE_config, getAppProperties, () => {
        ErrorMes("You have no exported sheet");
        console.error("no exported data found");
    });
};

var _export = () => {
    var token = window.sessionStorage.getItem("drive");
    validate_token(token, getMSOE_config, updateMSOE_config, createMSOE_config);
};