/* global $, history, location, printJS, MIDI, MSOE */

var ErrorMes = (e) => {
    $("#error p").html(e);
    $("#error").show();
    setTimeout(()=>{$("#error").fadeOut()}, 2000);
};

var SuccessMes = (e) => {
    $("#success p").html(e);
    $("#success").show();
    setTimeout(()=>{$("#success").fadeOut()}, 2000);
};

var WarningMes = (e) => {
    $("#warning p").html(e);
    $("#warning").show();
    setTimeout(()=>{$("#warning").fadeOut()}, 2000);
};

var StartHint = (show) => {
    if(show){
        $("#hint").show();
    }else{
        $("#hint").hide();
    }
};

var UIhandler = new function(){
    var help_ = false; //if help mode is on
    var help_content = { //<UI button selector>:<help message> pairs
        "#infohome":"Edit sheet info",
        "#manualgo":"Show manual",
        "#save":"Save sheet",
        "#play":"Play music",
        "#print":"Print sheet",
        "#share":"Download midi file of this music",
        "#edit":"Enter edit mode",
        "#preview":"Enter preview mode",
        "#night":"Toggle night mode",
        "#copy":"(shift+F)Set copy cursor/Copy notes by clicking again",
        "#cut":"(H)Cut notes when copy is active",
        "#paste":"(G)Paste previous copied or cut notes",
        "#clef":"(Q)Set clef of current voice by using key 1 to 4",
        "#plus":"Add new voice after current voice(before current voice by holding (ctrl))",
        "#minus":"Delete current voice",
        "#check":"Replace current voicename with the text on the left",
        "#remove":"Replace current voicename with default value",
        ".v_num:eq(0)":"Select this voice/Switch position with selected voice",
        ".v_clef:eq(0)":"Change the clef of this voice",
        ".v_name:eq(0)":"Move cursor to this voice",
        ".v_div:eq(0)":"Move selected voice here",
        ".v_up:eq(0)":"Switch place with upper voice",
        ".v_down:eq(0)":"Switch place with lower voice"
    };
    var help_right = ["#paste", "#clef", "#check", "#remove", ".v_up:eq(0)", ".v_down:eq(0)", "#edit", "#preview", "#night"];
    //elements whose popups should expand to the right
    this.help_voice = () => { //set help popups for voice list
        if(!help_) return;
        $.each(help_content, (key, value)=>{
            $(key).popup({
                content: value,
                on: "hover",
                position: (key==".v_div:eq(0)")?"bottom center":((help_right.includes(key))?"bottom right":"bottom left"),
                variation: "basic mini",
                delay: {
                    show:30
                }
            });
        });
    };
    this.help = () => { //toggle help mode
        if(help_){
            help_ = false;
            $("#help").css("color","rgba(255, 255, 255, 0.9)");
            $(".help").popup("destroy");
        }else{
            help_ = true;
            $("#help").css("color","orange");
            this.help_voice();
        }
    };
    
    
    this.night = false;
    this.night_mode = () => { //toggle night mode
        this.night = !this.night;
        if(this.night){
            $("#sheet").css("background-color","#090909");
            $("#night").text("Default");
            MSOE.print();
        }else{
            $("#sheet").css("background-color","");
            $("#night").text("Night");
            MSOE.print();
        }
    };
    
    
    this.printabc = () => { //print the sheet as PDF
        printJS("sheet", "html");
    };
    
    this.loading = (show) => { //show or hide loader
        if(show){
            $("#preloader").show();
        }else{
            $("#preloader").hide();
        }
    };
    
    this.forceupdate = (callback) => {
        preview_mode();
        $("#forceupdatemes").show();
        $("#forceupdatecheck").click(function(){
            callback();
        });
    };
    
    this.discardconfirm = (callback) => {
        $("#discardconfirm").modal({
            onApprove: callback
        }).modal("show");
    };
    
    var font_size = ["0.9vw", "0.7vw"];
    this.manual_font = (index) => { //toggle manual font size
        $(".font").removeClass("active");
        $("#font_" + index).addClass("active");
        $(".manual").css("font-size", font_size[index]);
    };
    
    var manual_widen = false;
    this.manual_width = () => { //toggle manual width
        manual_widen = !manual_widen;
        if(manual_widen){
            // $("#sidebar").width("100vw");
            $("#sidebar").animate({"width":"100vw"});
            $("#manual_width").removeClass("left").addClass("right");
        }else{
            // $("#sidebar").width("260px");
            $("#sidebar").animate({"width":"260px"});
            $("#manual_width").removeClass("right").addClass("left");
        }
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
    }
    this.manual_language = (lan) => { //change manual language
        if(lan_files[lan]){
            $.getJSON(lan_files[lan], function(json){
                $("#mCSB_2_container .item:not(:first-child)").remove();
                var man_json = json.manual;
                for (let item of man_json){
                    $("<div class='item'/>")
                    .append($("<h2 class='ui header' style='color:white;'></h2>").text(item.header))
                    .append($("<p class='manual'></p>").html(item.content.join("<br>")+"<br><br>"))
                    .appendTo("#mCSB_2_container");
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
    this.imported = (sheets) => { //display exported sheets on screen to let the user choose
        //TODO: implement
        console.log(sheets);
    };
};

MSOE.UIhandler(UIhandler); //register UIhandler
UIhandler.lan_file_set({
    "ch-TW": "json/ch_tw.json",
    "en-US": "json/en_us.json"
}, false);

var checkinput = () => { //if input tags are focused, turn off key events
    let myArray = Array.from(document.getElementsByTagName("input"));
    if (myArray.includes(document.activeElement))
        return true;
    else
        return false;
};

var key = () => { // only keypress can tell if "shift" is pressed at the same time
    if ($("#voicename").is(":focus") && (event.keyCode == 13)) $("#check").click();
    if (checkinput()) return;
    if (!MSOE.Edit_()) return;
    switch (event.keyCode) {
        case 44: //"<"
            MSOE.ChgDstate(0);
            break;
        case 46: //">"
            MSOE.ChgDstate(1);
            break;
        case 60: //"shift+>"
            MSOE.ChgDstate(2);
            break;
        case 62: //"shift+<"
            MSOE.ChgDstate(3);
            break;
            // ----------Change Dstate-----------
        case 63: //"shift+?" for chord mode
        case 47: //"?"
            $("#octave").text(MSOE.ChgTstate(1) + 3);
            break;
        case 34: //"shift+'" for chord mode
        case 39: //"'" 
            $("#octave").text(MSOE.ChgTstate(0) + 3);
            break;
            // ----------Change Tstate-----------
        case 122: //"Z"
            MSOE.outinsert("C", 1, 0, 1);
            MSOE.miditone("C", 0);
            highlight("#C");
            break;
        case 120: //"X"
            MSOE.outinsert("D", 1, 0, 1);
            MSOE.miditone("D", 0);
            highlight("#D");
            break;
        case 99: //"C"
            MSOE.outinsert("E", 1, 0, 1);
            MSOE.miditone("E", 0);
            highlight("#E");
            break;
        case 118: //"V"
            MSOE.outinsert("F", 1, 0, 1);
            MSOE.miditone("F", 0);
            highlight("#F");
            break;
        case 98: //"B"
            MSOE.outinsert("G", 1, 0, 1);
            MSOE.miditone("G", 0);
            highlight("#G");
            break;
        case 110: //"N"
            MSOE.outinsert("A", 1, 0, 1);
            MSOE.miditone("A", 0);
            highlight("#A");
            break;
        case 109: //"M"
            MSOE.outinsert("B", 1, 0, 1);
            MSOE.miditone("B", 0);
            highlight("#B");
            break;
            // ----------Insert Note------------
        case 115: //"S"
            MSOE.separate();
            break;
            // ----------Seperate Notes---------
        case 97: //"A"
            MSOE.assemble();
            break;
            // ----------Assemble Notes---------
        case 100: //"D"
            if (!MSOE.checkpause()) { //Pause with duration of 8 is illegal
                MSOE.outinsert("z", 1, 0, 1);
            } else {
                ErrorMes("Pause with duration of 2 is illegal.");
            }
            break;
            // ----------Insert Pause-----------
        case 92: //"|"
            MSOE.outinsert("|", 0, 0, 0);
            break;
            // ----------Insert Bar-------------
        case 93: //"]" for #
            MSOE.accidental(0);
            break;
        case 91: //"[" for b
            MSOE.accidental(1);
            break;
        case 125: //"shift+[" for #(chord mode)
            MSOE.accidental(2);
            break;
        case 123: //"shift+]" for b(chord mode)
            MSOE.accidental(3);
            break;
            // ----------Accidental-------------
        case 90: //"shift+Z"
            MSOE.outinsertch("C");
            MSOE.miditone("C", 0);
            break;
        case 88: //"shift+X"
            MSOE.outinsertch("D");
            MSOE.miditone("D", 0);
            break;
        case 67: //"shift+C"
            MSOE.outinsertch("E");
            MSOE.miditone("E", 0);
            break;
        case 86: //"shift+V"
            MSOE.outinsertch("F");
            MSOE.miditone("F", 0);
            break;
        case 66: //"shift+B"
            MSOE.outinsertch("G");
            MSOE.miditone("G", 0);
            break;
        case 78: //"shift+N"
            MSOE.outinsertch("A");
            MSOE.miditone("A", 0);
            break;
        case 77: //"shift+M"
            MSOE.outinsertch("B");
            MSOE.miditone("B", 0);
            break;
            // ----------Chord Mode-------------
        case 13: //"enter"
            MSOE.newline();
            break;
            // ----------New Line---------------
        case 70: //"shift+f" turn on and off copy mode
            MSOE.copymode();
            break;
        case 104: //"h" turn off copy mode(cut)
            MSOE.cutmode();
            break;
        case 102: //"f" cancel copy mode(when it's on)
            MSOE.copycancel();
            break;
        case 103: //"g" paste
            MSOE.paste();
            break;
            // ----------Copy Mode--------------
        case 113: //"q" toggle clef setting mode
            MSOE.ClfMdTgl();
            break;
        case 49: //"1" set clef to treble or jump to 1st voice
            MSOE.ClfOrVic(49);
            break;
        case 50: //"2" set clef to alto or jump to 2nd voice
            MSOE.ClfOrVic(50);
            break;
        case 51: //"3" set clef to tenor or jump to 3rd voice
            MSOE.ClfOrVic(51);
            break;
        case 52: //"4" set clef to bass or jump to 4th voice
            MSOE.ClfOrVic(52);
            break;
        case 53: //"5" jump to 5th voice
            MSOE.ClfOrVic(53);
            break;
        case 54: //"6" jump to 6th voice
            MSOE.ClfOrVic(54);
            break;
        case 119: //"w" add a voice
            MSOE.AddVoice();
            break;
        case 101: //"e" delete current voice
            MSOE.DelVoice();
            break;
        case 114: //"r" swap two voices (mark current voice to be one of them)
            MSOE.VicChgA();
            break;
        case 82: //"shift+r" swap two voices (swap current voice and the one marked before)
            MSOE.VicChgB();
            break;
            // ----------Clef and Voice----------
        case 45: //"-" tie two notes
            MSOE.tie();
            break;
        case 61: //"=" untie
            MSOE.untie();
            break;
            // ----------Tie and Untie-----------
        case 26://"ctrl+z" undo
            MSOE.undo();
            break;
            // ----------Undo--------------------
        case 2://"ctrl+b" redo
            MSOE.redo();
            break;
        case 83://"shift+s" save
            MSOE.save();
            break;
            // ----------Save--------------------
        default:
    }
    console.log("keycode : "+event.keyCode);
    MSOE.print();
};

var move = () => { // some keys can't be detected in keypress
    if (checkinput()) return; //if inpus tags are focus, turn off key events
    if (!MSOE.Edit_()) return;
    switch(event.keyCode){
        case 37: //"left"
            MSOE.pre_move();
            MSOE.outmove(0);
            MSOE.post_move();
            break;
        case 39: //"right"
            MSOE.pre_move();
            MSOE.outmove(1);
            MSOE.post_move();
            break;
        case 38: //"up"
            MSOE.pre_move();
            MSOE.outmove(2);
            MSOE.post_move();
            break;
        case 40: //"down"
            MSOE.pre_move();
            MSOE.outmove(3);
            MSOE.post_move();
            break;
        case 36: //"home"
            MSOE.pre_move();
            MSOE.outmove2(4);
            MSOE.post_move();
            break;
        case 35: //"end"
            MSOE.pre_move();
            MSOE.outmove2(5);
            MSOE.post_move();
            break;
        case 8: //"backspace"
            MSOE.del();
            MSOE.print();
            break;
        case 16: //"shift" for chord mode on
            MSOE.chordmode(true);
            MSOE.chmodeon();
            break;
        case 17: //"ctrl" for add voice before
            MSOE.insvocbef(true);
            break;
        case 67: //"ctrl + C" for copy selected notes
            if (MSOE.insvocbef()){
                MSOE.copy2();
            }
            break;
        case 86: //"ctrl + V" for paste copied notes (by key)
            if (MSOE.insvocbef()){
                MSOE.paste2();
            }
            break;
        case 88: //"ctrl + X" for cut selected notes
            if (MSOE.insvocbef()){
                MSOE.cut2();
            }
            break;
    }
    console.log("keycode : "+event.keyCode);
};

var chord = () => { //keyup event for chord mode
    if (checkinput()) return;
    if (!MSOE.Edit_()) return;
    switch(event.keyCode){
        case 16: //"shift" for chord mode off
            MSOE.chordmode(false);
            MSOE.chmodeoff();
            break;
        case 17: //"ctrl" for add voice before
            MSOE.insvocbef(false);
            break;
    }
};

var highlight = (a) => {
    $(a).css('background-color', 'rgba(255,0,0,0.5)');
    setTimeout("clean()", '700');
}

var clean = () => {
    $('#C').css('background-color', 'white');
    $('#D').css('background-color', 'white');
    $('#E').css('background-color', 'white');
    $('#F').css('background-color', 'white');
    $('#G').css('background-color', 'white');
    $('#A').css('background-color', 'white');
    $('#B').css('background-color', 'white');
}

var btn = (a) => { //buttons for notes
    MSOE.outinsert(a.id, 1, 0, 1);
    MSOE.miditone(a.id, 0);
    MSOE.print();
    highlight(a);
};


$(window).on("load", function(){
    $('#preloader').fadeOut('slow',function(){console.log("loaded");});
});

$(document).ready(function(){
    MSOE.urlload(function(m){
        MSOE.print();
        MSOE.printVoc();
        if(MSOE.Edit_()){
            $("#edit").hide();
            $(".pre-but").hide();
        }else{
            $("#night").show();
            $(".edit-but").hide();
            $(".left").hide();
            $(".panel-group").hide();
        }
        $('#modaldiv1')
            .modal({
                allowMultiple: false,
                blurring: true,
                onHidden: function(){
                    $('#modaldiv2').modal('setting', 'transition', 'vertical flip').modal('show');
                }
            });
        if(m){
            $("#modaldiv1").modal('setting', 'transition', 'vertical flip').modal("show");
        }
        if(!MSOE.unsave()){
            $("#discard").hide();
        }
    });
    $("input").change(function(){
        MSOE.chginfo(this);
    });
    document.onkeypress = key;
    document.onkeydown = move;
    document.onkeyup = chord;
    $("#save").click(function(e) { MSOE.save(e); });
    $("#discard").click(function() {
        UIhandler.discardconfirm(function(){
            MSOE.cleartemp();
        });
    });
    $("#play").click(function(e) {
        if(MSOE.playing == false){
            MSOE.playing = true;
            MIDI.volume = 3;
            $(".abcjs-midi-reset").click();
            $(".abcjs-midi-start").click();
            $("#play").text("Stop");
            ABCJS.startAnimation(document.getElementById("boo"), MSOE.tune(), {showCursor: true, bpm: MSOE.bpm()});
        }else{
            MSOE.playing = false;
            $(".abcjs-midi-reset").click();
            $(".abcjs-midi-start").click();
            $("#play").text("Play");
            ABCJS.stopAnimation();
        }
    });
    $("#print").click(function(e) {
        if(!MSOE.Edit_()){
            UIhandler.printabc();
        }
    });
    $("#share").click(function(e){
        $(".download-midi a")[0].click();
    });
    $("#help").click(function(e){
        UIhandler.help();
    });
    $("#copy").click(function(){
        MSOE.copyui();
    });
    $("#cut").click(function(){
        MSOE.cutmode();
        MSOE.print();
    });
    $("#tie").click(function(){
        if(MSOE.tiemode(true)){
            $("#tie").css("color","#b5cc18");
        }else{
            $("#tie").css("color","");
        }
    });
    $("#clef").click(function(){
        MSOE.ClfMdTgl();
    });
    $("#paste").click(function(){
        MSOE.paste();
        MSOE.print();
    });
    $("#plus").click(function(){
        MSOE.AddVoice();
        MSOE.print();
    });
    $("#minus").click(function(){
        MSOE.DelVoice();
        MSOE.print();
    });
    $("#check").click(function(){
        MSOE.ChgVicName($("#voicename").val());
        $("#voicename").val("");
        MSOE.print();
    });
    $("#remove").click(function(){
        MSOE.ClrVicName();
        MSOE.print();
    });
    $(".font").click(function(){
        UIhandler.manual_font(parseInt($(this).attr("id").substring(5)));
    });
    $("#manual_width").click(function(){
        UIhandler.manual_width();
    });
    $("#manual_new").click(function(){
        window.open(window.location.origin + "/manual", "_blank");
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
        UIhandler.manual_language(lan);
    });
    MIDI.setup({
        soundfontUrl: window.ABCJS.midi.soundfountUrl,
        instruments: window.ABCJS.midi.instruments
    });
    $("#midi").hide();
    $("#error").hide();
});
