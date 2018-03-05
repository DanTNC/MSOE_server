$(document).ready(function(){
    var getQuery = (key) => {
        return window.location.hash.match(new RegExp(key + "=([^&]*)&"))[1];
    };
    var token = getQuery("access_token");
    window.sessionStorage.setItem("drive",token);
    var back = window.sessionStorage.getItem("back");
    if(back != undefined){
        window.location = window.location.origin + back;
    }else{
        window.location = window.location.origin;
    }
});