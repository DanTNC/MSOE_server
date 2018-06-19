/* global $ */

$(function(){
    var UI = new function(){
        var font_size = ["0.9vw", "0.7vw"];
        this.mannual_font = (index) => { //toggle mannual font size
            $(".font").removeClass("active");
            $("#font_" + index).addClass("active");
            $(".mannual").css("font-size", font_size[index]);
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
        this.mannual_language = (lan) => { //change mannual language
            if(lan_files[lan]){
                $.getJSON(lan_files[lan], function(json){
                    $("#mCSB_1_container .item:not(:first-child)").remove();
                    var man_json = json.mannual;
                    for (let item of man_json){
                        $("<div class='item'/>")
                        .append($("<h2 class='ui header' style='color:white;'></h2>").text(item.header))
                        .append($("<p class='mannual'></p>").html(item.content.join("<br>")+"<br><br>"))
                        .appendTo("#mCSB_1_container");
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
        UI.mannual_font(parseInt($(this).attr("id").substring(5)));
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
        UI.mannual_language(lan);
    });
});