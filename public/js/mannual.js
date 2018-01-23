var UI = new function(){
    var font_size = ["0.9vw", "0.7vw"];
    this.mannual_font = (index) => { //toggle mannual font size
        $(".font").removeClass("active");
        $("#font_" + index).addClass("active");
        $(".mannual").css("font-size", font_size[index]);
    };
};

$(function(){
    $(".font").click(function(){
        UI.mannual_font(parseInt($(this).attr("id").substring(5)));
    });
});