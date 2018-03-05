var auth = () => {
    server_getCID(function(CID){
        window.sessionStorage.setItem("back", window.location.search);
        var params = {
            'client_id': CID,
            'redirect_uri': window.location.origin + '/auth',
            'response_type': 'token',
            'scope': 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.metadata',
            'include_granted_scopes': 'true'
        };
        var formatted = "";
        for (let key in params){
            formatted += key + "=" + params[key] + "&";
        }
        window.location.assign("https://accounts.google.com/o/oauth2/v2/auth?" + formatted);
    });
};