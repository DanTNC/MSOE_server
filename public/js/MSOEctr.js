/* global $, history, location, printJS, MIDI, MSOE */
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
            document.getElementById("octave").innerHTML = (MSOE.ChgTstate(1) + 3);
            break;
        case 34: //"shift+'" for chord mode
        case 39: //"'" 
            document.getElementById("octave").innerHTML = (MSOE.ChgTstate(0) + 3);
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
                Error("Pause with duration of 2 is illegal.");
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
        case 87: //"shift+w" delete current voice
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
    //not using switch for speed(avoid looking up table)
    if (event.keyCode == 37) { //"left"
        MSOE.outmove(0);
    }
    if (event.keyCode == 39) { //"right"
        MSOE.outmove(1);
    }
    if (event.keyCode == 38) { //"up"
        MSOE.outmove(2);
    }
    if (event.keyCode == 40) { //"down"
        MSOE.outmove(3);
    }
    if (event.keyCode == 36) { //"home"
        MSOE.outmove2(4);
    }
    if (event.keyCode == 35) { //"end"
        MSOE.outmove2(5);
    }
    if (event.keyCode == 8) { //"backspace"
        MSOE.del();
    }
    if (event.keyCode == 16) { //"shift" for chord mode on
        MSOE.chmodeon();
    }
    if (event.keyCode == 17) { //"ctrl" for add voice before
        MSOE.insvocbef(true);
    }
    MSOE.print();
};

var chord = () => { //keyup event for chord mode
    if (checkinput()) return;
    if (!MSOE.Edit_()) return;
    MSOE.chmodeoff(event.keyCode);
    if (event.keyCode == 17) { //"ctrl" for add voice before
        MSOE.insvocbef(false);
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

$(document).ready(function() {
    MSOE.urlload(function(m){
        MSOE.print();
        MSOE.printVoc();
        if(MSOE.Edit_()){
            $('#print').hide();
            $('#play').hide();
            $('#share').hide();
            $("#edit").hide();
        }else{
            $(".left").hide();
            $(".panel-group").hide();
        }
        $('#modaldiv1')
            .modal({
                allowMultiple: false
            })
            .modal({
                blurring: true
            })
            .modal('setting', 'closable', false);
        if(m){
            $("#modaldiv1").modal('setting', 'transition', 'vertical flip').modal("show");
        }
    });
    $("input").change(function(){
        MSOE.chginfo(this);
    });
    document.onkeypress = key;
    document.onkeydown = move;
    document.onkeyup = chord;
    $("#save").click(function(e) { MSOE.save(e); });
    $("#play").click(function(e) {
        MIDI.volume = 3;
        $(".abcjs-midi-reset").click();
        $(".abcjs-midi-start").click();
    });
    $("#print").click(function(e) {
        if(!MSOE.Edit_()){
            MSOE.printabc();
        }
    });
    $("#share").click(function(e){
        $(".download-midi a")[0].click();
    });
    $("#help").click(function(e){
        MSOE.help();
    });
    $("#copy").click(function(){
        MSOE.copyui();
    });
    $("#cut").click(function(){
        MSOE.cutmode();
        MSOE.print();
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
    MIDI.setup({
        soundfontUrl: window.ABCJS.midi.soundfountUrl,
        instruments: window.ABCJS.midi.instruments
    });
    $("#midi").hide();
    $("#error").hide();
});
