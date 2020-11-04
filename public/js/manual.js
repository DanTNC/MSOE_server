/* global $ */

var manual = new function(){
    var font_size = ["0.9vw", "0.7vw"];
    this.manual_font = (index) => { //toggle manual font size
        $(".font").removeClass("active");
        $("#font_" + index).addClass("active");
        $(".manual").css("font-size", font_size[index]);
    };
    var lan_files = {};
    this.lan_file_set = (file_set, update) => { //set language corresponding files
        if(update){
            for (let key in file_set){
                lan_files[key] = file_set[key];
            }
        }else{
            lan_files = file_set;
        }
    };
    this.manual_language = (lan) => { //change manual language
        if(lan_files[lan].json){
            $.getJSON(lan_files[lan].json, function(json){
                $(".manual .mCSB_container:eq(0) .content.item").remove();
                var man_json = json.manual;
                for (let item of man_json){
                    $("<div class='content item'/>")
                    .append($("<h2 class='ui header' style='color:white;'></h2>").text(item.header))
                    .append($("<p class='manual'></p>").html(make_color_for_keys(item.content).join("<br>")+"<br><br>"))
                    .appendTo(".manual .mCSB_container:eq(0)");
                }
                $("#font").text(json.font.title);
                $("#font_0").text(json.font.L);
                $("#font_1").text(json.font.S);
            })
            .fail(function(jqxhr, textStatus, error){
                var err = textStatus + ", " + error;
                console.error("Request Failed: " + err);
            });
        }else{
            console.error("no such file corresponding to the language.");
        }
    };
    var make_color_for_keys = (contents) => {
        for (let content_index in contents){
            content_index = Number(content_index);
            var content = contents[content_index];
            var keys = content.match(/'[^']+'/g);
            for (let key of keys){
                var key_str = key.substring(1, key.length-1);
                content = content.replace(key, "<kbd class='dark-apple'>" + key_str + "</kbd>");
            }
            contents[content_index] = content;
        }
        return contents;
    };
};

$(function(){
    var manual_config = {
        default: "en-US",
        content:{
            "ch-TW": {
                json: "json/ch_tw.json",
                name: "中文",
            },
            "en-US": {
                json: "json/en_us.json",
                name: "English",
            }
        }
    };

    manual.lan_file_set(manual_config.content, false);
    $(".font").click(function(){
        manual.manual_font(parseInt($(this).attr("id").substring(5)));
    });
    for ([key, value] of Object.entries(manual_config.content)){
        console.log(key, value);
        $("#lan div.menu").append("<div class='item" + ((key==manual_config.default)?" active selected":"") + "' data-value='" + key + "'>" + value.name + "</div>");
        if (key==manual_config.default) $("#lan div.text").text(value.name);
    }
    $("#lan .item").click(function(){
        manual.manual_language($(this).attr("data-value"));
    });
    $("#lan").dropdown();
    manual.manual_language(manual_config.default);
});