/* global $, history, location, printJS, MIDI */

var Error = (e) => {
    $("#error p").html(e);
    $("#error").show();
    setTimeout(()=>{$("#error").fadeOut()}, 2000);
};


//dependencies:
//  socketio.js: sheetchange(data, index), suscribe(index)
//  server.js: serverload(func, sucfunc, index, key), serversave(data, func)
//
var MSOE = new function() {

    var Edit = true; //if it'editable
    var Edit_const = false;
    this.Edit_ = (set) => { //setter and getter of Edit(limited by Edit_const)
        if(set !== undefined){
            if(!Edit_const){
                Edit = set;
            }
        }
        return Edit;
    };

    var abcstr = "$"; //abcstring
    var Tstate = 1; //0:A, 1:A  2:a  3:a'
    var Dstate = 5; //Mn, n=0~8. n=5 for N=1, n+1=>N*2, n-1=>N/2. 1n=N*(1+1/2), 2n=N*(1+1/2+1/4)... and so on
    var CrtPos = 0; //current position
    var abcjs = window.ABCJS;
    //-----------------------------------------//for voices
    var abcindex = 0; //index for abcstrings
    var vicchga; //Ath voice for VicChg;
    var strs = []; //voices
    var clef = []; //clef of voices
    var voicename = []; //name of voices
    //-----------------------------------------//
    var maxoffset = 0; //the maximum of offset
    var actions = []; //record the order of actions for the "undo" command
    var re_actions = []; //record the order of undone actions for the "redo" command
    
    const host = window.location.origin + window.location.pathname; //host url
    
    
    //-----------------------------------------//for actions
    this.sync = (A)=>{ //callback for syncronization when mutiple edittors are editing the same sheet
        re_actions = [];
        switch(A.inst){ //reverse actions(description stored for redo before)
            case 0:
                A.inst = 1;
                break;
            case 1:
                A.inst = 0;
                break;
            case 3:
                A.param2 = [1, 0, 3, 2][A.param2];
                break;
            case 6:
                //do nothing
                break;
            case 7:
            case 8:
            case 9:
                A.param2 = [A.X, A.X = A.param2][0];//swap A.X and A.param2
                break;
            default:
                A.param2 = (A.param2 == 0)? 1: 0;
        }
        doAct(A);
        actions.push(A);
        this.print();
    };

    const CPU = [//edit the sheet according to the inst code and params (just like a CPU)
            function(Act){
            //inst 0:  insert <-> delete param: [insertPos, insertStr]
                var Delen = true;// delete enable
                for(var i = 0, len = Act.param2.length; i < len; i++){
                    if(abcstr[Act.param1+i]!=Act.param2[i]){
                        Delen = false;
                        console.error("something's wrong with content");
                        return;
                    }
                }
                if(Delen){
                    abcstr = abcstr.substring(0,Act.param1)+abcstr.substring(Act.param1+Act.param2.length);
                    CrtPos = Act.param1;
                    CrtPos = mvpos(0);
                    Act.inst = 1;
                }
            },
            function(Act){
            //inst 1:  delete <-> insert param: [deletePos, deleteStr] X: initPos
                abcstr=abcstr.substring(0,Act.param1)+Act.param2+abcstr.substring(Act.param1);
                if(Act.X !== undefined){//special position control parameter
                    CrtPos = Act.X;
                    if(abcstr[Act.X]!="$"){
                        CrtPos = mvpos(0);
                    }
                    Act.inst = 0;
                    return;
                }
                if(Act.param2 != "\n$"){
                    CrtPos = Act.param1;
                    console.log("CrtPos", CrtPos);
                    Act.inst = 0;
                }else{
                    CrtPos = Act.param1 + 1;
                    console.log("CrtPos(newline)", CrtPos);
                    Act.inst = 0;
                }
            },
            //-----------------direct(0: ->, 1: <-)-----------------//
            function(Act){
            //inst 2:  assemble <-> disassemble param: [A_DPos, direct]
                var A_DPos = Act.param1;
                if (A_DPos == 0 || abcstr[A_DPos - 1] == "\n" || A_DPos == 1 || abcstr[A_DPos - 1] == "$") return;
                if (Act.param2 == 0){
                    if (abcstr[A_DPos - 1] != " ") {
                        abcstr = abcstr.substring(0, A_DPos) + " " + abcstr.substring(A_DPos);
                        CrtPos = A_DPos + 1;
                    }
                    Act.param2 = 1;
                    Act.param1++;
                }else if(Act.param2 == 1){
                    if (abcstr[A_DPos - 1] == " ") {
                        abcstr = abcstr.substring(0, A_DPos - 1) + abcstr.substring(A_DPos);
                        CrtPos = A_DPos - 1;
                    }
                    Act.param2 = 0;
                    Act.param1--;
                }else{
                    console.error("invalid direction of inst: 2");
                }
            },
            function(Act){
            //inst 3:  # <-> b param: [accidentialPos, md]
            },
            function(Act){
            //inst 4:  untie <-> tie param: [T_UPos, direct]
                var T_UPos = Act.param1;
                if (T_UPos == 0 || abcstr[T_UPos - 1] == "\n" || T_UPos == 1 || abcstr[T_UPos - 1] == "$") return;
                if (Act.param2 == 0){
                    if (abcstr[T_UPos - 1] != "-") {
                        abcstr = abcstr.substring(0, T_UPos) + "-" + abcstr.substring(T_UPos);
                        CrtPos = T_UPos + 1;
                    }
                    Act.param2 = 1;
                    Act.param1++;
                }else if(Act.param2 == 1){
                    if (abcstr[T_UPos - 1] == "-") {
                        abcstr = abcstr.substring(0, T_UPos - 1) + abcstr.substring(T_UPos);
                        CrtPos = T_UPos - 1;
                    }
                    Act.param2 = 0;
                    Act.param1--;
                }else{
                    console.error("invalid direction of inst: 4");
                }
            },
            function(Act){
            //inst 5:  addVoice <-> delVoice param: [A_DIndex, direct] (index for addBefore)
            },
            function(Act){
            //inst 6:  switchVoice param: [voiceA, voiceB] (don't need to reverse)
            },
            function(Act){
            //inst 7:  voicename param: [index, newName] X: oldName
                voicename[Act.param1] = Act.param2;
                Act.param2 = [Act.X, Act.X = Act.param2][0];
                MSOE.printVoc();
            },
            function(Act){
            //inst 8:  infostr param: [infoIndex, newVal] X: oldVal
                infostrs[infoinputs[Act.param1]] = Act.param2;
                $("input[name=" + Act.param1 + "]").val(Act.param2);
                Act.param2 = [Act.X, Act.X = Act.param2][0];
            },
            function(Act){
            //inst 9:  clef param: [clefIndex, newClef] X:oldClef
                clef[Act.param1] = Act.param2;
                Act.param2 = [Act.X, Act.X = Act.param2][0];
                MSOE.printVoc();
            }
        ];

    var doAct = (Act) => { //edit the sheet according to the description in Act(TODO: interface for editing)
        if(Act.inst < CPU.length){
            CPU[Act.inst](Act);
        }else{
            console.error("invalid instruction code");
        }
    };

    this.undo = ()=>{ //TODO: sync this
        var Act = actions.pop();
        if(!Act) return;
        console.log("undo :", Act.inst, Act.param1, Act.param2, Act.X);
        doAct(Act);
        re_actions.push(Act);
    };
    
    this.redo = ()=>{ //TODO: sync this
        var Act = re_actions.pop();
        if(!Act) return;
        console.log("redo :", Act.inst, Act.param1, Act.param2, Act.X);
        doAct(Act);
        actions.push(Act);
    };

    var act = (Act) => { //record action and emit sheet change message for syncronization
        if(!Act) return;
        console.log("do :", Act.inst, Act.param1, Act.param2, Act.X);
        // console.log("actions:", actions);
        re_actions = [];
        doAct(Act);
        actions.push(Act);
        sheetchange(Act, index);
    };
    //-----------------------------------------//for voices
    clef[0] = "treble"; //default value
    voicename[0] = undefined; //default value
    var InsVocBef = false; //insert before or after certain voice
    this.insvocbef = (v) => { //setter and getter for InsVocBef
        if (v === undefined){
            return InsVocBef;   
        }else{
            InsVocBef = v;
        }
    };
    var SaveNLoad = (j) => { //save and load (j: jump to)
        if (j >= clef.length) return;
        strs[abcindex] = abcstr;
        abcstr = strs[j];
        abcindex = j;
        CrtPos = 0;
    };
    this.ChgVicName = (vn) => { //change voice name
        if(vn.indexOf("\"") != -1){
            Error("A voicename can't contain \".");
            return;
        }
        let Act = {inst: 7, param1: abcindex, param2: vn, X: voicename[abcindex]};
        // voicename[abcindex] = vn;
        act(Act);
        this.printVoc();
    };
    this.ClrVicName = () => { //clear voice name
        let Act = {inst: 7, param1: abcindex, X: voicename[abcindex]};
        // voicename[abcindex]	= undefined;
        act(Act);
        this.printVoc();
    };
    this.AddVoice = () => { //add voice
        if(strs.length == 0) strs[0] = abcstr;
        var insind = (InsVocBef)?abcindex:(abcindex+1);
        clef.splice(insind, 0, "treble");
        strs.splice(insind, 0, "$");
        voicename.splice(insind, 0, undefined);
        if(!InsVocBef){
            SaveNLoad(insind);
        }else{
            strs[abcindex+1] = abcstr;
            abcstr = strs[abcindex];
        }
        this.printVoc();
    };
    this.DelVoice = () => { //delete voice
        if (clef.length == 1) return;
        strs = strs.slice(0, abcindex).concat(strs.slice(abcindex + 1));
        clef = clef.slice(0, abcindex).concat(clef.slice(abcindex + 1));
        voicename = voicename.slice(0, abcindex).concat(voicename.slice(abcindex + 1));
        if(abcindex != 0) abcindex--;
        abcstr = strs[abcindex];
        CrtPos = 0;
        this.printVoc();
    };
    this.VicChgA = () => { //set voice A for switching
        vicchga = abcindex;
    };
    this.VicChgB = () => { //set current voice as voice B for switching
        if (vicchga === undefined) return; //if not pressed "r" before
        if (ChgVocMd) return; //if vicchga is set by ui
        if (strs[vicchga] === undefined || strs[abcindex] === undefined || clef[vicchga] === undefined) return; //clef of current voice definitely exists
        strs[vicchga] = [strs[abcindex], strs[abcindex] = strs[vicchga]][0]; //swap strs
        clef[vicchga] = [clef[abcindex], clef[abcindex] = clef[vicchga]][0]; //swap clef
        voicename[vicchga] = [voicename[abcindex], voicename[abcindex] = voicename[vicchga]][0]; //swap clef
        abcindex = vicchga;
        vicchga = undefined;
        this.printVoc();
    };
    var VicChgB_ = (vicchgb) => { //set vicchgb as voice B for switching
        if (vicchga === undefined) return; //if not pressed "r" before
        if (strs[vicchga] === undefined || strs[vicchgb] === undefined || clef[vicchga] === undefined) return; //clef of current voice definitely exists
        strs[abcindex] = abcstr;
        strs[vicchga] = [strs[vicchgb], strs[vicchgb] = strs[vicchga]][0]; //swap strs
        clef[vicchga] = [clef[vicchgb], clef[vicchgb] = clef[vicchga]][0]; //swap clef
        voicename[vicchga] = [voicename[vicchgb], voicename[vicchgb] = voicename[vicchga]][0]; //swap clef
        abcstr = strs[abcindex];
        if(abcindex == vicchga){
            SaveNLoad(vicchgb);
        }else if(abcindex == vicchgb){
            SaveNLoad(vicchga);
        }
        vicchga = undefined;
        this.printVoc();
    };
    //-----------------------------------------//for voice list
    var ChgVocMd = false; //if voice A for voice switching is set
    this.regVocLstEvt = () => { //register voice list events
        $(".ui.dropdown").dropdown({silent:true});
        $(".mCSB_container").css("overflow","visible");
        $(".v_num").click(function(){
            if(ChgVocMd){
                VicChgB_(parseInt($(this).html()) - 1);
            }else{
                vicchga = parseInt($(this).html()) - 1;
                $(this).css("background","rgba(0, 0, 0, 0.15)");
            }
            ChgVocMd = !ChgVocMd;
            MSOE.print();
        });
        $(".v_up").click(function(){
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html()) - 1;
            if(vic == 0) return;
            vicchga = vic;
            VicChgB_(vic - 1);
            MSOE.print();
        });
        $(".v_down").click(function(){
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html()) - 1;
            if(vic == clef.length - 1) return;
            vicchga = vic;
            VicChgB_(vic + 1);
            MSOE.print();
        });
        $(".v_div").click(function(){
            if(!ChgVocMd || vicchga === undefined) return; //if other voice not clicked before
            var vic = parseInt($(this).attr("data-value"));
            if([vic, vic-1].includes(vicchga)){ //voices around divider can't be changed
                ChgVocMd = false;
                MSOE.printVoc();
                return;
            }
            strs[abcindex] = abcstr;
            clef.splice(vic, 0, clef[vicchga]);
            strs.splice(vic, 0, strs[vicchga]);
            voicename.splice(vic, 0, voicename[vicchga]);
            var tmpvica = vicchga
            if(vicchga > vic) vicchga++;
            strs = strs.slice(0, vicchga).concat(strs.slice(vicchga + 1));
            clef = clef.slice(0, vicchga).concat(clef.slice(vicchga + 1));
            voicename = voicename.slice(0, vicchga).concat(voicename.slice(vicchga + 1));
            abcstr = strs[abcindex];
            if(abcindex == tmpvica){
                SaveNLoad(vic);
            }else if(abcindex >= vic){
                SaveNLoad(abcindex+1);
            }else{
                SaveNLoad(abcindex-1);
            }
            vicchga = undefined;
            ChgVocMd = false;
            MSOE.printVoc();
            MSOE.print();
        });
        $(".dp_clef").click(function(){
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html()) - 1;
            MSOE.ClfOrVic(parseInt($(this).attr("data-value")) + 49, true, vic);
            MSOE.print();
        });
        $(".v_name").click(function(){
            SaveNLoad(parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html()) - 1);
            MSOE.print();
        });
        UIhandler.help_voice();
    };
    this.printVoc = () => { //render voice list
        $("#voices .mCSB_container").html("");
        $.each(clef,(index, value) => {
            if(index != 0){
                var d = $('<div class="ui divider v_div"></div>');
                d.attr("data-value",index);
                $("#voices .mCSB_container").append(d);
            }
            var e = $('<div class="row"><div class="ui inverted menu small borderless"><a class="item v_num help"></a><div class="ui dropdown floating item v_clef help"><div class="dp_menu menu"><a class="item dp_clef"></a><a class="item dp_clef"></a><a class="item dp_clef"></a></div></div><a class="item v_name help">Bass</a><div class="right menu"><a class="item v_up help"><i class="angle up mini icon"></i></a><a class="item v_down help"><i class="angle down mini icon"></i></a></div></div></div>');
            e.find(".v_num").html(index+1);
            e.find(".v_clef").prepend(RdClf(value, e, 0));
            e.find(".v_name").text((voicename[index] === undefined)?RdClf(value, e, 1):voicename[index]);
            $("#voices .mCSB_container").append(e);
        });
        var DOM = $("<div class='ui inverted segment'></div>");
        DOM.css("height",$(".ui.dropdown .menu").height()+"px");
        $("#voices .mCSB_container").append(DOM)
        this.regVocLstEvt();
    };
    //-----------------------------------------//for clef
    var clefmode = false;
    this.ClfMdTgl = () => { //toggle clefmode
        clefmode = !clefmode;
        if(clefmode){
            $("#clef").css("color","#d7983b");
        }else{
            $("#clef").css("color","");
        }
    };
    this.ClfOrVic = (kc, ui, ind) => { //switch clef or voice (clefmode?clef:voice) kc: keycode, ui: UI?, ind: index
        var clfind = (ui === true)?ind:abcindex; //UI sets certain index while keyboard sets current index
        if (clefmode || ui) {
            var newClef;
            switch (kc) {
                case 49:
                    newClef = "treble";
                    break;
                case 50:
                    newClef = "alto middle=C";
                    break;
                case 51:
                    newClef = "tenor middle=A";
                    break;
                case 52:
                    newClef = "bass,,";
                    break;
                default:
            }
            let Act = {inst: 9, param1: clfind, param2: newClef, X: clef[clfind]};
            act(Act);
        } else {
            SaveNLoad(kc - 49);
        }
    };
    var RdClf = (s, e, Md)=> { //reduced name for clefs and modify UI due to this change s: full clef string, e: voice UI element, Md: mode(0: modify UI, 1: just return)
        var Clfs = ["treble", "alto", "tenor", "bass"];
        var OrClfs = Clfs.slice();
        var res = "";
        var color = "";
        switch (s) {
            case "treble":
                res = "treble";
                color = "olive";
                break;
            case "alto middle=C":
                res = "alto";
                color = "yellow";
                break;
            case "tenor middle=A":
                res = "tenor";
                color = "orange";
                break;
            case "bass,,":
                res = "bass";
                color = "brown";
                break;
        }
        if(Md == 1){
            return res;
        }
        e.find(".ui.inverted.menu").addClass(color);
        Clfs.splice(Clfs.indexOf(res),1);
        e.find(".dp_clef").eq(0).html(Clfs[0]).attr("data-value",OrClfs.indexOf(Clfs[0]));
        e.find(".dp_clef").eq(1).html(Clfs[1]).attr("data-value",OrClfs.indexOf(Clfs[1]));
        e.find(".dp_clef").eq(2).html(Clfs[2]).attr("data-value",OrClfs.indexOf(Clfs[2]));
        return res;
    };
    //-----------------------------------------//for MIDI playing
    var tune_ = null;
    this.tune = () => { //return tuneObj
        return tune_[0];
    };
    this.playing = false; //if the music is playing
    this.bpm = ()=>{ //return bpm of the sheet
        return (infostrs["bpmstr"] == "")?180:Number(infostrs["bpmstr"]);
    };
    //-----------------------------------------//for print
    var rmsmb = (str, cursor) => { //remove symbols should not be in the final abcstring
        var Ins = mvpos(1);
        if (Ins == CrtPos) Ins = abcstr.length;
        if (abcstr[Ins - 1] == "\n") Ins--;
        if (cursor) {
            str = str.substring(0, Ins) + "!style=x!G" + numtostr(Math.pow(2, Dstate % 10 - 4) * (1 - Math.pow(1 / 2, Math.floor(Dstate / 10) + 1))) + str.substring(Ins);
        }
        console.log("after rmsmb:" + str);
        return str.replace(/[*$#]/g, "");
    };
    var GetStrOffset = (ix) => { //get the length before the voice for highlight listener (ix: index)
        var sum = 0;
        for (var i = 0; i < ix + 1; i++) {
            sum += 20 + (Math.floor(Math.log10(i + 1)) + 1) + clef[i].length + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]).length;
            if (i != ix) sum += rmsmb(strs[i], false).length + 4;
        }
        maxoffset = rmsmb(abcstr, true).length + 1;
        return sum;
    };
    
    var ForPrint = () => { //construct the string for ABCJS rendering
        var finalstr = "";
        for (var i = 0; i < clef.length; i++) {
            if (i != abcindex) {
                finalstr += "V: " + (i + 1) + " clef=" + clef[i] + " name=\"" + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]) + "\"\n[|" + rmsmb(strs[i], false) + " |]\n";
            } else {
                finalstr += "V: " + (i + 1) + " clef=" + clef[i] + " name=\"" + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]) + "\"\n[|" + rmsmb(abcstr, Edit) + " |]\n";
            }
        }
        return finalstr;
    };
    this.print = () => { //output svg
        var bpmstr = (infostrs["bpmstr"] == "")?"180":infostrs["bpmstr"];
        var SS = "T: " + infostrs["ttlstr"] + "\nM: " + infostrs["tmpstr"] + "\nL: " + Lstr + "\nC: " + infostrs["cmpstr"] + "\nQ: " + bpmstr + "\n" + ForPrint();
        // console.log("entire abcstr:", SS);
        tune_ = abcjs.renderAbc('boo', SS, {}, {
            add_classes: true,
            editable: true,
            listener: {
                highlight: (abcElem) => { //update CrtPos when note is clicked
                    console.log(abcElem.startChar);
                    var ignsmbs = ["$", "#", "*"]; //symbols that won't be in the final abcstring
                    var NumBefCrt = 0; //number of chars before current position
                    for (var i = 1; i < (mvpos(1) == CrtPos ? abcstr.length : mvpos(1)); i++) {
                        if (!ignsmbs.includes(abcstr[i])) {
                            NumBefCrt++;
                        }
                    }
                    console.log(NumBefCrt);
                    var offset = abcElem.startChar - 19 - infostrs["ttlstr"].length - infostrs["tmpstr"].length - Lstr.length - infostrs["cmpstr"].length - bpmstr.length - GetStrOffset(abcindex);
                    console.log(offset);
                    if ((offset < 0) || (offset > maxoffset) || (isNaN(offset))){
                        this.print();
                        return;
                    }
                    if (offset > NumBefCrt + 10 + String(numtostr(Math.pow(2, Dstate % 10 - 4) * (1 - Math.pow(1 / 2, Math.floor(Dstate / 10) + 1)))).length) { //if after the cursor, - the string length of cursor
                        offset -= (10 + String(numtostr(Math.pow(2, Dstate % 10 - 4) * (1 - Math.pow(1 / 2, Math.floor(Dstate / 10) + 1)))).length);
                    } else if (offset == NumBefCrt + 1) {
                        return;
                    }
                    if (offset == 0) {
                        CrtPos = 0;
                        this.print();
                        return;
                    }
                    for (var i = 0; i < abcstr.length; i++) {
                        if (!ignsmbs.includes(abcstr[i])) {
                            if (offset != 1) {
                                offset--;
                            } else if (abcstr[i] != "[") {
                                CrtPos = i - 1;
                                this.print();
                                return;
                            } else { //for chord
                                CrtPos = i - 2;
                                this.print();
                                return;
                            }
                        }
                    }
                }
            }
        });
        let qpm_ = Number(infostrs["bpmstr"]);
        abcjs.renderMidi("midi", SS, {}, { generateDownload: true, generateInline: true, qpm: qpm_, listener: (midiElem, midiEvent)=>{
                MIDI.volume = 3;
                if(midiEvent.progress == 1){
                    $("#play").text("Play");
                    this.playing = false;
                }
            },
            animate: {
                listener: (svgElems)=>{
                    console.log(svgElems);
                },
                target: tune_[0],
                qpm: qpm_
            }
        }, {});
        $("path, tspan").attr("fill", (UIhandler.night?"white":"#000000"));
    };
    //-----------------------------------------//for urlload and save
    var url = "";
    var index = "";
    var key = "";
    
    this.save = function(e) { //save sheet in database
        if(!Edit) return;
        var push = false;
        if (index === "" && key === "")
            push = true;

        if (history.pushState) {
            if(e !== undefined) e.preventDefault();
            var data = {
                insert: push,
                index: index,
                key: key,
                infostrs: infostrs,
                abcstr: abcstr,
                abcindex: abcindex,
                Lstr: Lstr,
                strs: strs,
                clef: clef
            };
            server_save(data, function(msg) {
                console.log(msg);
                if (msg.status.error) {
                    return console.log(msg.status.msg);
                }
                if (msg.status.success) {
                    index = msg.url.index;
                    key = msg.url.key;
                    suscribe(index);
                    console.log(msg.status.msg);
                } else {
                    console.log(msg.status.msg);
                }
            });
            if (push) {
                history.pushState({ title: "" }, "", host + "?!" + index + "!" + key);
            }
        } else {
            console.log("Web browser doesn't support history api");
        }
    };
    this.urlload = (func) => { //load sheet from database using info in url
        url = location.href.split("?")[1] || "";
        index = url.split("!")[1] || "";
        key = url.split("!")[2] || "";

        var pointer = this;
        if (index !== "") { //call ajax to load sheet data
            server_load(func, function(msg) {
                console.log(msg);
                if (msg.status.error) {
                    console.log(msg.status.msg);
                    window.location.replace(host);
                }
                if (msg.status.success) {
                    infostrs = msg.sheet.infostrs;
                    abcstr = msg.sheet.abcstr;
                    abcindex = msg.sheet.abcindex;
                    Lstr = msg.sheet.Lstr;
                    strs = msg.sheet.strs;
                    clef = msg.sheet.clef;

                    Edit = msg.status.edit;
                    if(!Edit){
                        $(".right.menu a").hide();
                        $("#modaldiv1").modal("hide");
                        $("#modaldiv2").modal("hide");
                        $("input").attr("disabled","disabled")
                        Edit_const = true;
                        history.pushState({ title: "" }, "", host + "?!" + index);
                    }else if(key!=""){
                        $("#modaldiv1").modal("hide");
                        $("#modaldiv2").modal("hide");
                    }
                    updateinfo();
                    suscribe(index);
                    console.log(msg.status.msg);
                } else {
                    console.log(msg.status.msg);
                    window.location.replace(host);
                }
                func();
            },
            index, key);
        } else if (location.href !== host) { // redirect to main page
            url = "";
            index = "";
            key = "";
            console.log("Error url, redirect to main page");
            window.location.replace(host);
            func();
        } else {
            func(true);
        }
    };
    //-----------------------------------------//for infos
    var Lstr = "1/4";
    var infostrs = {
        "edtstr":"",
        "cmpstr":"",
        "ttlstr":"",
        "stlstr":"",
        "albstr":"",
        "artstr":"",
        "tmpstr":"",
        "bpmstr":""
    };
    this.chginfo = (a) => { //change info strings
        if ((!Edit && a.name!="whatisbpm")||(a.name === "")) return;
        switch (a.name) {
            case "whatistempo": //update tempo
                if (a.value.length == 2) a.value = a.value[0] + "/" + a.value[1]; //if user is lazy and inputs, for example, 44 for 4/4, add "/" for the lazy guy
                for (var i = 0; i < infostrs["tmpstr"].length; i++) {
                    if (infostrs["tmpstr"][i] == "/") {
                        Lstr = "1/" + infostrs["tmpstr"].substring(i + 1);
                        break;
                    }
                }
                if (a.value == "") Lstr = "1/4";
            default: //update infos
                let Act = {inst: 8, param1: a.name, param2: a.value, X: infostrs[infoinputs[a.name]]};
                act(Act);
                // infostrs[infoinputs[a.name]] = a.value;
        }
        this.print();
    }
    var infoinputs = {
        "whoiseditor":"edtstr",
        "whoiscomposer":"cmpstr",
        "whatistitle":"ttlstr",
        "whatissubtitle":"stlstr",
        "whichalbum":"albstr",
        "whoisartist":"artstr",
        "whatistempo":"tmpstr",
        "whatisbpm":"bpmstr"
    };
    var updateinfo = ()=>{ //update the UI inputs according to infostrs
        for (var key in infoinputs){
            $("input[name=" + key + "]").val(infostrs[infoinputs[key]]);
        }
    };
    //-----------------------------------------//for copy, cut, and paste
    var CpMd = false; //copy mode
    var CpStP = -1; //copy startpoint
    var CpStr = ""; //copy string
    this.copymode = () => { //toggle copy mode and do copy
        if (CpMd) {
            $("#cut").addClass("disabled").css("color","");
            CpMd = false;
            var CpEdP = CrtPos; //copy end point
            var Swap = false;
            if (CrtPos < CpStP) { //if the end is on the left of the startpoint, swap their values.
                CpEdP = CpStP+3;
                CpStP = CrtPos;
                Swap = true;
            }
            if (CpStP == 0 || abcstr[CpStP - 1] == "\n") { //don't copy the extra "$" of the startpoint of every line;
                CpStP++;
            }
            var CpStrEd = CpEdP; //copy string end point
            for (var i = CpEdP + 1; i <= abcstr.length; i++) {
                if (abcstr[i] == "$") {
                    CpStrEd = i;
                    break;
                }
            }
            if (CpStrEd == CpEdP) {
                CpStr = abcstr.substring(CpStP);
            } else {
                CpStr = abcstr.substring(CpStP, CpStrEd);
            }
            var p = CpStr.indexOf("$[]");
            if (( p != -1 )&&( Swap )) {
                CpStr = CpStr.substring(0,p)+CpStr.substring(p+3);
            }
            console.log("copy : "+CpStr);
            CpStP = -1;
            $("#copy").css("color","");
            $("#paste").removeClass("disabled");
        } else {
            $("#cut").removeClass("disabled").css("color","#49beb5");
            CpMd = true;
            CpStP = CrtPos;
            $("#copy").css("color","#49beb5");
        }
    };
    this.cutmode = () => { //cut
        if(CpMd) {
            $("#cut").addClass("disabled").css("color","");
            CpMd = false;
            var CpEdP = CrtPos; //cut end point
            if (CrtPos < CpStP) { //if the end is on the left of the startpoint, swap their values.
                CpEdP = CpStP;
                CpStP = CrtPos;
            }
            if (CpStP == 0 || abcstr[CpStP - 1] == "\n") { //don't cut the extra "$" of the startpoint of every line;
                CpStP++;
            }
            var CpStrEd = CpEdP; //cut string end point
            for (var i = CpEdP + 1; i <= abcstr.length; i++) {
                if (abcstr[i] == "$") {
                    CpStrEd = i;
                    break;
                }
            }
            if (CpStrEd == CpEdP) {
                CpStrEd = abcstr.length;
            }
            CpStr = abcstr.substring(CpStP, CpStrEd);
            let Act = {inst: 0, param1: CpStP, param2: CpStr, X: CpStrEd};
            act(Act);
            console.log("cut : "+CpStr);
            CpStP = -1;
            $("#copy").css("color","");
            $("#paste").removeClass("disabled");
        }
    };
    this.copycancel = () => { //cancel copy when copy mode is on
        if (CpMd) {
            $("#cut").addClass("disabled").css("color","");
            CpMd = false;
            $("#copy").css("color","");
            CpStP = -1;
        }
    };
    this.copyui = () => { //copy UI button handler
        if(InsVocBef){
            this.copycancel();
        }else{
            this.copymode();
        }
    };
    this.paste = () => { //paste copied or cutten string
        if (mvpos(1) == CrtPos) {
            let Act = {inst: 1, param1: abcstr.length, param2: CpStr, X: abcstr.length + CpStr.length - 1};
            act(Act);
            CrtPos = abcstr.length - 1;
            CrtPos = mvpos(0);
        } else {
            let Act = {inst: 1, param1: mvpos(1), param2: CpStr, X: mvpos(1) + CpStr.length - 1};
            act(Act);
            CrtPos += CpStr.length;
            CrtPos = mvpos(0);
        }
        checkbar();
    };
    //-----------------------------------------//for editing
    this.ChgDstate = (md) => { //change duration state
        switch (md) {
            case 0:
                Dstate = (Dstate % 10 == 0) ? 8 : Dstate - 1;
                break;
            case 1:
                Dstate = (Dstate % 10 == 8) ? 0 : Dstate + 1;
                break;
            case 2:
                if ((Math.floor(Dstate / 10)) != 0)
                    Dstate = Dstate - 10;
                break;
            case 3:
                Dstate = Dstate + 10;
                break;
            default:
        }
    };
    this.ChgTstate = (md) => { //change octave state
        if (md == 0) Tstate = (Tstate == 3) ? 0 : Tstate + 1;
        else if (md == 1) Tstate = (Tstate == 0) ? 3 : Tstate - 1;
        return Tstate;
    };
    var insert = (str, md) => { //insert string in the right position. mode=1 for notations not occupying a position
        var InsBef = mvpos(1); //insert before
        var finalstr = (md != 1 ? "$" : "") + str;
        if (InsBef != CrtPos) { //not the last note
            if (abcstr[InsBef - 1] == "\n") //if on the position before a "\n", insert before "\n"
                InsBef--;
        } else {
            InsBef = abcstr.length;
        }
        if(str != "$[]"){
            let Act = {inst: 1, param1: InsBef, param2: finalstr};
            act(Act);
        }else
            abcstr = abcstr.substring(0, InsBef) + finalstr + abcstr.substring(InsBef);
    };
    var insertch = (str) => { //insert for chord
        for (var i = mvpos(1) + 2; i < abcstr.length; i++) {
            if (abcstr[i] == "]") {
                abcstr = abcstr.substring(0, i) + str + abcstr.substring(i);
                return;
            }
        }
    };
    this.outinsert = (ch, Toabcnote, md, Checkbar) => { //insert from outside the object
        var legalchars = ["A", "B", "C", "D", "E", "F", "G", "z", " ", "|", "_", "^"];
        if (!legalchars.includes(ch)) return;
        if (Toabcnote == 1) {
            insert(toabcnote(ch), md);
        } else {
            insert(ch, md);
        }
        if (Checkbar == 1) checkbar();
    };
    this.outinsertch = (ch) => { //insert from outside the object in chord mode
        var legalchars = ["A", "B", "C", "D", "E", "F", "G"];
        if (!legalchars.includes(ch)) return;
        insertch(toabcnote(ch));
    };
    this.separate = () => { //separate two linked notes
        let Act = {inst: 2, param1: CrtPos, param2: 0};
        act(Act);
    };
    this.assemble = () => { //assemble two notes
        let Act = {inst: 2, param1: CrtPos, param2: 1};
        act(Act);
    };
    this.tie = () => { //tie two joint notes TODO: tie not joint notes
        let Act = {inst: 4, param1: CrtPos, param2: 0};
        act(Act);
    };
    this.untie = () => { //untie tied notes
        let Act = {inst: 4, param1: CrtPos, param2: 1};
        act(Act);
    };
    this.accidental = (md) => { //add or delete accidental (# or b)
        if (md == 0) {
            if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n" && abcstr[CrtPos + 1] != "|" && abcstr[CrtPos + 1] != "#") {
                if (abcstr[CrtPos + 2] != "^") { //only allow 2 #s
                    if (abcstr[CrtPos + 1] != "_") {
                        abcstr = abcstr.substring(0, CrtPos + 1) + "^" + abcstr.substring(CrtPos + 1);
                        if (abcstr[CrtPos + 2] == "^") this.miditone(abcstr[CrtPos + 3], 2);
                        else this.miditone(abcstr[CrtPos + 2], 1);
                    } else { //if b exists, delete one b
                        abcstr = abcstr.substring(0, CrtPos + 1) + abcstr.substring(CrtPos + 2);
                        if (abcstr[CrtPos + 1] == "_") this.miditone(abcstr[CrtPos + 2], -1);
                        else this.miditone(abcstr[CrtPos + 1], 0);
                    }
                }
            }
        } else if (md == 1) {
            if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n" && abcstr[CrtPos + 1] != "|" && abcstr[CrtPos + 1] != "#") {
                if (abcstr[CrtPos + 2] != "_") { //only allow 2 bs
                    if (abcstr[CrtPos + 1] != "^") {
                        abcstr = abcstr.substring(0, CrtPos + 1) + "_" + abcstr.substring(CrtPos + 1);
                        if (abcstr[CrtPos + 2] == "_") this.miditone(abcstr[CrtPos + 3], -2);
                        else this.miditone(abcstr[CrtPos + 2], -1);
                    } else { //if # exists, delete one #
                        abcstr = abcstr.substring(0, CrtPos + 1) + abcstr.substring(CrtPos + 2);
                        if (abcstr[CrtPos + 1] == "^") this.miditone(abcstr[CrtPos + 2], 1);
                        else this.miditone(abcstr[CrtPos + 1], 0);
                    }
                }
            }
        } else if (md == 2) {
            var ChEnd; //chord end
            var LstNt; //last note of this chord
            var NtChs = ["a", "b", "c", "d", "e", "f", "g", "A", "B", "C", "D", "E", "F", "G"]; //possible note chars
            for (var i = mvpos(1) + 2; i < abcstr.length; i++) {
                if (abcstr[i] == "]") {
                    ChEnd = i;
                    break;
                }
                if (i == abcstr.length - 1) return;
            }
            for (var i = ChEnd - 1; i > mvpos(1); i--) {
                if (NtChs.includes(abcstr[i])) {
                    LstNt = i - 1;
                    break;
                }
                if (i == mvpos(1) + 1) return;
            }
            if (!(abcstr[LstNt] == "^" && abcstr[LstNt - 1] == "^")) { //only allow 2 #s
                if (abcstr[LstNt] != "_") {
                    abcstr = abcstr.substring(0, LstNt + 1) + "^" + abcstr.substring(LstNt + 1);
                    if (abcstr[LstNt] == "^") this.miditone(abcstr[LstNt + 2], 2);
                    else this.miditone(abcstr[LstNt + 2], 1);
                } else { //if b exists, delete one b
                    abcstr = abcstr.substring(0, LstNt) + abcstr.substring(LstNt + 1);
                    if (abcstr[LstNt - 1] == "_") this.miditone(abcstr[LstNt], -1);
                    else this.miditone(abcstr[LstNt], 0);
                }
            }
        } else if (md == 3) {
            var ChEnd; //chord end
            var LstNt; //last note of this chord
            var NtChs = ["a", "b", "c", "d", "e", "f", "g", "A", "B", "C", "D", "E", "F", "G"]; //possible note chars
            for (var i = mvpos(1) + 2; i < abcstr.length; i++) {
                if (abcstr[i] == "]") {
                    ChEnd = i;
                    break;
                }
                if (i == abcstr.length - 1) return;
            }
            for (var i = ChEnd - 1; i > mvpos(1); i--) {
                if (NtChs.includes(abcstr[i])) {
                    LstNt = i - 1;
                    break;
                }
                if (i == mvpos(1) + 1) return;
            }
            if (!(abcstr[LstNt] == "_" && abcstr[LstNt - 1] == "_")) { //only allow 2 bs
                if (abcstr[LstNt] != "^") {
                    abcstr = abcstr.substring(0, LstNt + 1) + "_" + abcstr.substring(LstNt + 1);
                    if (abcstr[LstNt] == "_") this.miditone(abcstr[LstNt + 2], -2);
                    else this.miditone(abcstr[LstNt + 2], -1);
                } else { //if b exists, delete one b
                    abcstr = abcstr.substring(0, LstNt) + abcstr.substring(LstNt + 1);
                    if (abcstr[LstNt - 1] == "^") this.miditone(abcstr[LstNt], 1);
                    else this.miditone(abcstr[LstNt], 0);
                }
            }
        }
    };
    this.newline = () => { //add "\n"
        if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n") { //ABCJS doesn't allow 2 "\n"s in series
            insert("\n$", 1);
        }
    };
    this.del = () => { //delete note
        if (CrtPos != 0) { //if not the start of abcstring
            if (abcstr[CrtPos - 1] != "\n") { //deleting notes
                var DelEnd = mvpos(1); //delete end
                if (DelEnd != CrtPos) { //if not the last note
                    if (abcstr[DelEnd - 1] == "\n") //if on the position before a "\n", keep "\n" in Latter
                        DelEnd--;
                }else{
                    DelEnd = abcstr.length;
                }
                var Content = abcstr.substring(CrtPos, DelEnd);
                let Act = {inst: 0, param1: CrtPos, param2: Content};
                act(Act);
            } else { //deleting "\n"
                let Act = {inst: 0, param1: CrtPos - 1, param2: "\n$"};
                act(Act);
            }
        }
        console.log(CrtPos);
        console.log(abcstr);
    };
    this.chmodeon = () => { //chord mode on
        var InsBef = mvpos(1); //insert before
        if ((InsBef == CrtPos) || (abcstr[InsBef + 1] != "[")) {
            insert("$[]", 1);
        }
    };
    this.chmodeoff = (k) => { //chord mode off
        if (k == 16) { //"shift" for chord mode off
            if (abcstr.substr(mvpos(1), 3) === "$[]") { //if no notes are inserted
                abcstr = abcstr.substring(0, mvpos(1)) + abcstr.substring(mvpos(1) + 3);
            } else if (abcstr.substr(mvpos(1), 2) === "$[") {
                abcstr = abcstr.substring(0, mvpos(1) + 1) + "#" + abcstr.substring(mvpos(1) + 1);
                var pos = mvpos(1);
                CrtPos = mvpos(1);
                act({inst: 0, param1: pos, param2: abcstr.substring(pos, ((CrtPos == mvpos(1))?abcstr.length:mvpos(1)))});
                checkbar();
            }
            this.print();
        }
    };
    //-----------------------------------------//helpers
    var tonum = (str) => { //transform string representation of fraction to number
        var Dnmntr = 0; //denominator
        var Nmrtr = 0; //numerator
        for (var i = 0; i < str.length; i++) {
            if (str[i] == "/") {
                Nmrtr = parseInt(str.substring(0, i));
                Dnmntr = parseInt(str.substring(i + 1));
                return Nmrtr / Dnmntr;
            }
        }
        return parseInt(str);
    };
    var checkbar = () => { //add bar automatically
        var SofD = 0; //sum of duration
        var temD = ""; //temparary duration
        var ChFm = mvpos(1); //check from
        var MaxD; //the max duration between bars

        for (var i = 0; i < infostrs["tmpstr"].length; i++) {
            if (infostrs["tmpstr"][i] == "/") {
                MaxD = parseInt(infostrs["tmpstr"].substring(0, i));
                break;
            }
        }
        if (infostrs["tmpstr"] == "") MaxD = 4;

        if (abcstr[CrtPos + 1] === "|") return;
        if (ChFm == CrtPos) {
            ChFm = abcstr.length;
        } else if (abcstr[ChFm + 1] == "|") {
            return;
        }
        var Cntin = true; //counting
        for (var i = ChFm - 1; i > 0; i--) {
            if (abcstr[i] == "|") break;
            if (abcstr[i] == "\n" || abcstr[i] == "]" || abcstr[i] == "[") continue;
            if (abcstr[i] == "$") {
                if (abcstr[i - 1] == "\n") { //the beginning of a line(not the first line)
                    break;
                } else {
                    Cntin = true;
                    continue;
                }
            }
            if (abcstr[i] == "*" && Cntin) { //sum every note
                Cntin = false;
                if (temD == "") temD = "1";
                SofD = SofD + tonum(temD);
                temD = "";
                continue;
            }
            if (Cntin) {
                temD = abcstr[i] + temD;
            }
        }

        if (SofD >= MaxD) {
            insert("|", 0);
        }
    };
    var mvpos = (md) => { //move cursor position
        if (md == 0) { //0: move to the right note (not change if on the first note)
            for (var i = CrtPos - 1; i >= 0; i--) {
                if (abcstr[i] == "$") {
                    return i;
                }
            }
        }
        if (md == 1) { //1: move to the left note(not change if on the last note)
            for (var i = CrtPos + 1; i <= abcstr.length; i++) {
                if (abcstr[i] == "$") {
                    return i;
                }
            }
        }
        if (md == 2) { //2: move to the last note of the upper line(not change if on the first line)
            for (var i = CrtPos - 1; i >= 0; i--) {
                if (abcstr[i] == "\n") {
                    for (var j = i - 1; j >= 0; j--) {
                        if (abcstr[j] == "$") {
                            return j;
                        }
                    }
                }
            }
        }
        if (md == 3) { //3: move to the first note of the lower line(not change if on the last line)
            for (var i = CrtPos + 1; i <= abcstr.length; i++) {
                if (abcstr[i] == "\n") {
                    for (var j = i + 1; j <= abcstr.length; j++) {
                        if (abcstr[j] == "$") {
                            return j;
                        }
                    }
                }
            }
        }
        if (md == 4) { //4: move to the first note of this line
            while (CrtPos != 0 && abcstr[CrtPos - 1] != "\n") {
                CrtPos = mvpos(0);
            }
            return;
        }
        if (md == 5) { //5: move to the last note of this line
            while (mvpos(1) != CrtPos && abcstr[mvpos(1) - 1] != "\n") {
                CrtPos = mvpos(1);
            }
            return;
        }
        return CrtPos;
    };
    this.outmove = (md) => { //mvpos from outside the object (move cursor)
        CrtPos = mvpos(md);
    };
    this.outmove2 = (md) => { //mvpos from outside the object (for "home" and "end")
        mvpos(md);
    };
    this.miditone = (ch, acc) => { //calculate the miditone of a note ch: character of the note, acc: accidental
        var temnum;
        var code = ch.charCodeAt(0);
        if (code >= 97) code -= 32;
        switch (code) {
            case 65:
                temnum = 9 + acc;
                break;
            case 66:
                temnum = 11 + acc;
                break;
            case 67:
                temnum = 0 + acc;
                break;
            case 68:
                temnum = 2 + acc;
                break;
            case 69:
                temnum = 4 + acc;
                break;
            case 70:
                temnum = 5 + acc;
                break;
            case 71:
                temnum = 7 + acc;
                break;
        }
        console.log("miditone : ", 48 + (Tstate) * 12 + temnum);
        MIDI.noteOn(0, 48 + (Tstate) * 12 + temnum, 127, 0);
        MIDI.noteOff(0, 48 + (Tstate) * 12 + temnum, 0.75);
        return 48 + (Tstate) * 12 + temnum;
    };
    var numtostr = (num) => { //transform a float to a string in fraction form(for duration of a note)
        if (!Number.isInteger(num)) { //if num is a integer, return it and it will be transformed to string automatically
            var Dnmntr = 0; //denominator
            var Nmrtr = 0; //numerator
            do {
                num *= 2;
                Dnmntr++;
            } while (!Number.isInteger(num));
            Dnmntr = Math.pow(2, Dnmntr);
            Nmrtr = num;
            num = Nmrtr + "/" + Dnmntr;
        }
        if (num === 1) { //1 doesn't need to be noted in abcstring
            num = "";
        }
        return num;
    };
    var toabcnote = (ch) => { //generate a string for a note in ABC format
        if (ch != "z") { //pause has no tune
            switch (Tstate) { //for tunes
                case 0:
                    ch = ch + ",";
                    break;
                case 3:
                    ch = String.fromCharCode(ch.charCodeAt(0) + 32) + "'";
                    break;
                case 2:
                    ch = String.fromCharCode(ch.charCodeAt(0) + 32);
                    break;
                default:
            }
        }
        /*
              (n-5)          1 (M+1)
          N = 2     x 2( 1-(---)    ), n=Dstate%10, M=Math.floor(Dstate/10).
                             2
        */
        //for duration
        ch = ch + "*" + numtostr(Math.pow(2, Dstate % 10 - 4) * (1 - Math.pow(1 / 2, Math.floor(Dstate / 10) + 1)));
        return ch;
    };
    this.checkpause = () => { //check if the pause is legal
        return (Math.pow(2, Dstate % 10 - 5) * eval(Lstr) >= 2);
    }
    
    var UIhandler;//UI handler from outside the object (would become critical argument of constructor in API version)
    this.UIhandler = (UI) => {
        UIhandler = UI;
    };
};