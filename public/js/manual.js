/* global $ */

$(function(){
    var UI = new function(){
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
            if(lan_files[lan]){
                $.getJSON(lan_files[lan], function(json){
                    $("#sidebar_new .mCSB_container:eq(0) .item:not(:first-child)").remove();
                    var man_json = json.manual;
                    for (let item of man_json){
                        $("<div class='item'/>")
                        .append($("<h2 class='ui header' style='color:white;'></h2>").text(item.header))
                        .append($("<p class='manual'></p>").html(item.content.join("<br>")+"<br><br>"))
                        .appendTo("#sidebar_new .mCSB_container:eq(0)");
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
    };
    
    UI.lan_file_set({
        "ch-TW": "json/ch_tw.json",
        "en-US": "json/en_us.json"
    }, false);
    $(".font").click(function(){
        UI.manual_font(parseInt($(this).attr("id").substring(5)));
    });
    
    $("#lan").click(function(){
        var lan = $(this).attr("data-lan");
        if(lan == "ch-TW"){
            $(this).attr("data-lan", "en-US");
            $(this).text("English")
        }else if(lan == "en-US"){
            $(this).attr("data-lan", "ch-TW");
            $(this).text("中文")
        }else{
            return;
        }
        UI.manual_language(lan);
    });
    UI.manual_language("ch-TW");
});