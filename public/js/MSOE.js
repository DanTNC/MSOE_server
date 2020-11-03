/* global $, history, location, printJS, MIDI, Tonal */

/** dependencies:
 *      socketio.js:
 *          sheetchange(data, index),
 *          suscribe(index)
 *      server.js:
 *          serverload(func, sucfunc, index, key),
 *          serversave(data, func),
 *          sync_undo(),
 *          sync_redo()
 *      MSOEctr.js:
 *          ErrorMes(message)
 *          SuccessMes(message)
 *
 **/
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
    var unsave = false;
    this.unsave = (un) => {
        if (un !== undefined){
            unsave = un;
        }
        return unsave;
    };
    this.cleartemp = () => {
        if (this.unsave()){
            clear_temp();
        }
    };
    const CPU = [//edit the sheet according to the inst code and params (just like a CPU)
            function(Act){
            //inst 0:  insert <-> delete param: [insertPos, insertStr]
                var Delen = true;// delete enable
                for(var i = 0, len = Act.param2.length; i < len; i++){
                    if(abcstr[Act.param1+i]!=Act.param2[i]){
                        Delen = false;
                        console.error("something's wrong with content :" + abcstr[Act.param1+i] + "/" + Act.param2[i]);
                        return 1;
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
                    console.log("CrtPos", CrtPos);
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
                if (A_DPos == 0 || abcstr[A_DPos - 1] == "\n" || A_DPos == 1 || abcstr[A_DPos - 1] == "$"){
                    console.log("warning: illegal position for inst: 2");
                    return 1;
                }
                var noteEnd = noteendbefore(A_DPos) + 1;
                var prefix = abcstr.substring(noteEnd, A_DPos);
                var delPos = prefix.indexOf(" ");
                if (Act.param2 == 0){
                    if (delPos == -1) {
                        let insPos = prefix.indexOf("&)");
                        if (insPos == -1){
                            abcstr = abcstr.substring(0, noteEnd) + " " + abcstr.substring(noteEnd);
                            CrtPos = A_DPos + 1;
                        }else{
                            abcstr = abcstr.substring(0, insPos + 2 + noteEnd) + " " + abcstr.substring(insPos + 2 + noteEnd);
                            CrtPos = A_DPos + 1;
                        }
                    }else{
                        console.error("already seperated");
                        return 1;
                    }
                    Act.param2 = 1;
                    Act.param1++;
                }else if(Act.param2 == 1){
                    if (delPos != -1) {
                        abcstr = abcstr.substring(0, delPos + noteEnd) + abcstr.substring(delPos + noteEnd + 1);
                        CrtPos = A_DPos - 1;
                    }else{
                        console.error("not seperated");
                        return 1;
                    }
                    Act.param2 = 0;
                    Act.param1--;
                }else{
                    console.error("invalid direction of inst: 2");
                    return 1;
                }
            },
            function(Act){
            //inst 3:  # <-> b param: [accidentialPos, md] X:oldAcc (only for natural)
                CrtPos = Act.param1;
                var md = Act.param2;
                if (md == 0) {
                    if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n" && abcstr[CrtPos + 1] != "|" && abcstr[CrtPos + 1] != "#") {
                        if (abcstr[CrtPos + 2] != "^") { //only allow 2 #s
                            if (abcstr[CrtPos + 1] != "_") {
                                abcstr = abcstr.substring(0, CrtPos + 1) + "^" + abcstr.substring(CrtPos + 1);
                                if (abcstr[CrtPos + 2] == "^") MSOE.miditone(abcstr[CrtPos + 3], 2);
                                else MSOE.miditone(abcstr[CrtPos + 2], 1);
                            } else { //if b exists, delete one b
                                abcstr = abcstr.substring(0, CrtPos + 1) + abcstr.substring(CrtPos + 2);
                                if (abcstr[CrtPos + 1] == "_") MSOE.miditone(abcstr[CrtPos + 2], -1);
                                else MSOE.miditone(abcstr[CrtPos + 1], 0);
                            }
                            Act.param2 = 1;
                        }else{
                            console.log("warning: only allow two #s");
                            return 1;
                        }
                    }else if(abcstr[CrtPos + 1] == "#"){
                        console.error("can't edit the accidental of a completed chord");
                        ErrorMes("You can't edit the accidental of a completed chord")
                        return 1;
                    }else{
                        console.log("warning: illegal position for inst: 3, md: 0");
                        return 1;
                    }
                } else if (md == 1) {
                    if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n" && abcstr[CrtPos + 1] != "|" && abcstr[CrtPos + 1] != "#") {
                        if (abcstr[CrtPos + 2] != "_") { //only allow 2 bs
                            if (abcstr[CrtPos + 1] != "^") {
                                abcstr = abcstr.substring(0, CrtPos + 1) + "_" + abcstr.substring(CrtPos + 1);
                                if (abcstr[CrtPos + 2] == "_") MSOE.miditone(abcstr[CrtPos + 3], -2);
                                else MSOE.miditone(abcstr[CrtPos + 2], -1);
                            } else { //if # exists, delete one #
                                abcstr = abcstr.substring(0, CrtPos + 1) + abcstr.substring(CrtPos + 2);
                                if (abcstr[CrtPos + 1] == "^") MSOE.miditone(abcstr[CrtPos + 2], 1);
                                else MSOE.miditone(abcstr[CrtPos + 1], 0);
                            }
                            Act.param2 = 0;
                        }else{
                            console.log("warning: only allow two bs");
                            return 1;
                        }
                    }else if(abcstr[CrtPos + 1] == "#"){
                        console.error("can't edit the accidental of a completed chord");
                        ErrorMes("You can't edit the accidental of a completed chord")
                        return 1;
                    }else{
                        console.log("warning: illegal position for inst: 3, md: 1");
                        return 1;
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
                        if (i == abcstr.length - 1){
                            console.error("can't find end of chord");
                            return 1;
                        }
                    }
                    for (var i = ChEnd - 1; i > mvpos(1); i--) {
                        if (NtChs.includes(abcstr[i])) {
                            LstNt = i - 1;
                            break;
                        }
                        if (i == mvpos(1) + 1){
                            console.error("can't find last note of this chord");
                            return 1;
                        }
                    }
                    if (!(abcstr[LstNt] == "^" && abcstr[LstNt - 1] == "^")) { //only allow 2 #s
                        if (abcstr[LstNt] != "_") {
                            abcstr = abcstr.substring(0, LstNt + 1) + "^" + abcstr.substring(LstNt + 1);
                            if (abcstr[LstNt] == "^") MSOE.miditone(abcstr[LstNt + 2], 2);
                            else MSOE.miditone(abcstr[LstNt + 2], 1);
                        } else { //if b exists, delete one b
                            abcstr = abcstr.substring(0, LstNt) + abcstr.substring(LstNt + 1);
                            if (abcstr[LstNt - 1] == "_") MSOE.miditone(abcstr[LstNt], -1);
                            else MSOE.miditone(abcstr[LstNt], 0);
                        }
                        return 1;//chord mode records whole string at once, so this action should not be recorded
                    }else{
                        console.log("warning: only allow 2 #s");
                        return 1;
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
                        if (i == abcstr.length - 1){
                            console.error("can't find end of chord");
                            return 1;
                        }
                    }
                    for (var i = ChEnd - 1; i > mvpos(1); i--) {
                        if (NtChs.includes(abcstr[i])) {
                            LstNt = i - 1;
                            break;
                        }
                        if (i == mvpos(1) + 1){
                            console.error("can't find last note of this chord");
                            return 1;
                        }
                    }
                    if (!(abcstr[LstNt] == "_" && abcstr[LstNt - 1] == "_")) { //only allow 2 bs
                        if (abcstr[LstNt] != "^") {
                            abcstr = abcstr.substring(0, LstNt + 1) + "_" + abcstr.substring(LstNt + 1);
                            if (abcstr[LstNt] == "_") MSOE.miditone(abcstr[LstNt + 2], -2);
                            else MSOE.miditone(abcstr[LstNt + 2], -1);
                        } else { //if b exists, delete one b
                            abcstr = abcstr.substring(0, LstNt) + abcstr.substring(LstNt + 1);
                            if (abcstr[LstNt - 1] == "^") MSOE.miditone(abcstr[LstNt], 1);
                            else MSOE.miditone(abcstr[LstNt], 0);
                        }
                        return 1;//chord mode records whole string at once, so this action should not be recorded
                    }else{
                        console.log("warning: only allow 2 bs");
                        return 1;
                    }
                } else if (md == 4) {
                    var NtChs = ["a", "b", "c", "d", "e", "f", "g", "A", "B", "C", "D", "E", "F", "G"]; //possible note chars
                    if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n" && abcstr[CrtPos + 1] != "|" && abcstr[CrtPos + 1] != "#") {
                        var accP;
                        for (var i = CrtPos; i < (mvpos(1) == CrtPos)?abcstr.length:mvpos(1); i++){
                            if (NtChs.includes(abcstr[i])){
                                accP = i;
                                break;
                            }
                        }
                        if (abcstr[accP - 1] == "="){
                            if (Act.X === undefined){
                                abcstr = abcstr.substring(0, CrtPos + 1) + abcstr.substring(accP);
                            }else{
                                abcstr = abcstr.substring(0, CrtPos + 1) + Act.X + abcstr.substring(accP);
                                Act.X = undefined;
                            }
                        }else{
                            Act.X = abcstr.substring(CrtPos + 1, accP);
                            abcstr = abcstr.substring(0, CrtPos + 1) + "=" + abcstr.substring(accP);
                        }
                    }else if(abcstr[CrtPos + 1] == "#"){
                        console.error("can't edit the accidental of a completed chord");
                        ErrorMes("You can't edit the accidental of a completed chord")
                        return 1;
                    }else{
                        console.log("warning: illegal position for inst: 3, md: 4");
                        return 1;
                    }
                } else if (md == 5) {
                    var ChEnd; //chord end
                    var LstNt; //last note of this chord
                    var NtChs = ["a", "b", "c", "d", "e", "f", "g", "A", "B", "C", "D", "E", "F", "G"]; //possible note chars
                    var SecLstNt; //second last note of thies chord (or maybe [)
                    for (var i = mvpos(1) + 2; i < abcstr.length; i++) {
                        if (abcstr[i] == "]") {
                            ChEnd = i;
                            break;
                        }
                        if (i == abcstr.length - 1){
                            console.error("can't find end of chord");
                            return 1;
                        }
                    }
                    for (var i = ChEnd - 1; i > mvpos(1); i--) {
                        if (NtChs.includes(abcstr[i])) {
                            LstNt = i;
                            break;
                        }
                        if (i == mvpos(1) + 1){
                            console.error("can't find last note of this chord");
                            return 1;
                        }
                    }
                    SecLstNt = noteendbefore(LstNt, mvpos(1));
                    if (abcstr[LstNt - 1] == "="){
                        abcstr = abcstr.substring(0, SecLstNt + 1) + abcstr.substring(LstNt);
                    }else{
                        abcstr = abcstr.substring(0, SecLstNt + 1) + "=" + abcstr.substring(LstNt);
                    }
                    return 1;//chord mode records whole string at once, so this action should not be recorded
                } else {
                    console.error("unsuppored mode");
                    return 1;
                }
            },
            function(Act){
            //inst 4:  slur param: [left, right]
                console.log(Act.param1, Act.param2);
                var left = Act.param1;
                var right = Act.param2;
                var left_noteEnd = noteendbefore(left) + 1;
                var left_prefix = abcstr.substring(left_noteEnd, left);
                var left_delPos = left_prefix.indexOf("&(");
                CrtPos = right;
                var right_ = mvpos(1);
                if (right_ == CrtPos){
                    right_ = abcstr.length;
                }
                var right_noteEnd = noteendbefore(right_) + 1;
                var right_prefix = abcstr.substring(right_noteEnd, right_);
                var right_delPos = right_prefix.indexOf("&)");
                console.log(left_delPos, right_delPos);
                if (left_delPos == -1 || right_delPos == -1){
                    abcstr = abcstr.substring(0, left) + "&(" +
                    abcstr.substring(left, right_noteEnd) + "&)" +
                    abcstr.substring(right_noteEnd);
                    CrtPos = right + 2;
                    Act.param1 += 2;
                    Act.param2 += 2;
                    SelNotesShift(2);
                }else{
                    abcstr = abcstr.substring(0, left_noteEnd + left_delPos) +
                            abcstr.substring(left_noteEnd + left_delPos + 2, right_noteEnd + right_delPos) +
                            abcstr.substring(right_noteEnd + right_delPos + 2);
                    CrtPos = right - 2;
                    Act.param1 -= 2;
                    Act.param2 -= 2;
                    SelNotesShift(-2);
                }
            },
            function(Act){
            //inst 5:  addVoice <-> delVoice param: [Restore, direct] X: InsVocBef
                if(Act.param2 == 1){//add voice
                    var InsVocBef = Act.X;
                    if(strs.length == 0) strs[0] = abcstr;
                    var insind = (InsVocBef)?abcindex:(abcindex+1);
                    var Restore = Act.param1;
                    clef.splice(insind, 0, Restore.clef);
                    strs.splice(insind, 0, Restore.str);
                    voicename.splice(insind, 0, Restore.vn);
                    if(!InsVocBef){
                        SaveNLoad(insind);
                    }else{
                        strs[abcindex+1] = abcstr;
                        abcstr = strs[abcindex];
                    }
                    Act.param2 = 0;
                    MSOE.printVoc();
                }else if(Act.param2 == 0){//delete voice
                    if (clef.length == 1){
                        console.error("can't delete the only voice");
                        return 1;
                    }
                    var InsVocBef = Act.X;
                    var delind = (InsVocBef)?abcindex:(abcindex+1);
                    strs = strs.slice(0, delind).concat(strs.slice(delind + 1));
                    clef = clef.slice(0, delind).concat(clef.slice(delind + 1));
                    voicename = voicename.slice(0, delind).concat(voicename.slice(delind + 1));
                    if(!InsVocBef){
                        SaveNLoad(delind);
                    }else if(abcindex == strs.length){
                        abcindex--;
                        abcstr = strs[abcindex];
                        CrtPos = 0;
                    }
                    Act.param2 = 1;
                    MSOE.printVoc();
                }else{
                    console.error("invalid direction of inst: 5");
                    return 1;
                }
            },
            function(Act){
            //inst 6:  switchVoice param: [voiceA, voiceB]
                var vicchga_ = Act.param1;
                var vicchgb_ = Act.param2;
                if (strs[vicchga_] === undefined || strs[vicchgb_] === undefined || clef[vicchga_] === undefined){//clef of current voice definitely exists
                    console.error("something wrong with content");
                    return 1;
                }
                strs[abcindex] = abcstr;
                strs[vicchga_] = [strs[vicchgb_], strs[vicchgb_] = strs[vicchga_]][0]; //swap strs
                clef[vicchga_] = [clef[vicchgb_], clef[vicchgb_] = clef[vicchga_]][0]; //swap clef
                voicename[vicchga_] = [voicename[vicchgb_], voicename[vicchgb_] = voicename[vicchga_]][0]; //swap voicename
                abcstr = strs[abcindex];
                if(abcindex == vicchga_){
                    SaveNLoad(vicchgb_);
                }else if(abcindex == vicchgb_){
                    SaveNLoad(vicchga_);
                }
                Act.param2 = [Act.param1, Act.param1 = Act.param2][0];
                MSOE.printVoc();
            },
            function(Act){
            //inst 7:  voicename param: [index, newName] X: oldName
                voicename[Act.param1] = Act.param2;
                Act.param2 = [Act.X, Act.X = Act.param2][0];
                MSOE.printVoc();
            },
            function(Act){
            //inst 8:  infostr param: [infoIndex, newVal] X: oldVal
                if(!(Act.param1 in infoinputs)){
                    console.error("no such info inputname");
                    return 1;
                }
                if(Act.param1 == "whatistempo" && Act.param2 == ""){
                    infostrs[infoinputs[Act.param1]] = "4/4";
                }else{
                    infostrs[infoinputs[Act.param1]] = Act.param2;
                }
                $("input[name=" + Act.param1 + "]").val(Act.param2);
                Act.param2 = [Act.X, Act.X = Act.param2][0];
            },
            function(Act){
            //inst 9:  clef param: [clefIndex, newClef] X:oldClef
                clef[Act.param1] = Act.param2;
                Act.param2 = [Act.X, Act.X = Act.param2][0];
                MSOE.printVoc();
            },
            function(Act){
            //inst 10:  replace param: [stP, newContent] X:oldContent
                abcstr = abcstr.substring(0, Act.param1) + Act.param2 + abcstr.substring(Act.param1 + Act.X.length);
                Act.param2 = [Act.X, Act.X = Act.param2][0];
                CrtPos = Act.param1;
                if (Act.X == ""){
                    CrtPos = mvpos(0);
                }
            },
            function(Act){
            //inst 11:  untriplet <-> triplet param: [T_UPos, direct]
                var T_UPos = Act.param1;
                var tmp = CrtPos;
                CrtPos = T_UPos;
                CrtPos = mvpos(1);
                if (T_UPos == 0 || abcstr[T_UPos - 1] == "\n" || abcstr.substring(T_UPos, mvpos(1)).indexOf("(3") != -1){
                    CrtPos = tmp;
                    console.log("warning: illegal position for inst: 11");
                    return 1;
                }
                var noteEnd = noteendbefore(T_UPos) + 1;
                var prefix = abcstr.substring(noteEnd, T_UPos);
                var delPos = prefix.indexOf("(3");
                if (Act.param2 == 0){
                    var checkStP = 0;
                    CrtPos = T_UPos;
                    for (var i = 0; i < 3; i++){
                        checkStP = mvpos(0);
                        if (checkStP == 0 || abcstr[checkStP - 1] == "\n"){ //if at line start
                            break;
                        }
                        CrtPos = checkStP;
                    }
                    CrtPos = tmp;
                    if (abcstr.substring(checkStP, T_UPos).indexOf("(3") == -1){
                        let insPos = prefix.indexOf("&(");
                        if (insPos == -1){
                            abcstr = abcstr.substring(0, T_UPos) + "(3" + abcstr.substring(T_UPos);
                            CrtPos = T_UPos + 2;
                        }else{
                            abcstr = abcstr.substring(0, insPos + noteEnd) + "(3" + abcstr.substring(insPos + noteEnd);
                            CrtPos = T_UPos + 2;
                        }
                    }else{
                        console.error("already exists triplet in valid range");
                        return 1;
                    }
                    Act.param2 = 1;
                    Act.param1+=2;
                }else if(Act.param2 == 1){
                    if (delPos != -1) {
                        abcstr = abcstr.substring(0, delPos + noteEnd) + abcstr.substring(delPos + noteEnd + 2);
                        CrtPos = T_UPos - 2;
                    }else{
                        console.error("no triplet here");
                        return 1;
                    }
                    Act.param2 = 0;
                    Act.param1-=2;
                }else{
                    console.error("invalid direction of inst: 11");
                    return 1;
                }
            },
            function(Act){
            //inst 12:  toggle tie param: [A_DPos]
                var A_DPos = Act.param1;
                if (A_DPos == 0 || abcstr[A_DPos - 1] == "\n" || A_DPos == 1 || abcstr[A_DPos - 1] == "$"){
                    console.log("warning: illegal position for inst: 12");
                    return 1;
                }
                var noteEnd = noteendbefore(A_DPos) + 1;
                var prefix = abcstr.substring(noteEnd, A_DPos);
                var delPos = prefix.indexOf("-");
                if (delPos == -1){
                    let insPos = prefix.indexOf(" ");
                    if (insPos != -1){
                        insPos += 1;
                    }else{
                        insPos = prefix.indexOf("&)");
                        if (insPos != -1){
                            insPos += 2;
                        }else{
                            insPos = 0;
                        }
                    }
                    abcstr = abcstr.substring(0, insPos + noteEnd) + "-" + abcstr.substring(insPos + noteEnd);
                    CrtPos = A_DPos + 1;
                    Act.param1++;
                }else{
                    abcstr = abcstr.substring(0, delPos + noteEnd) + abcstr.substring(delPos + noteEnd + 1);
                    CrtPos = A_DPos - 1;
                    Act.param1--;
                }
            }
        ];

    var doAct = (Act) => { //edit the sheet according to the description in Act
        if(Act.inst < CPU.length){
            console.log(Act);
            return CPU[Act.inst](Act);
        }else{
            console.error("invalid instruction code");
            return 1;
        }
    };

    this.undo = ()=>{ //TODO: sync this
        var Act = actions.pop();
        if(!Act) return;
        if(Act.inst != 4){
            this.SelNoteClr();
        }
        sync_undo();
        console.log("undo :", Act.inst, Act.param1, Act.param2, Act.X);
        SaveNLoad(Act.index);
        doAct(Act);
        re_actions.push(Act);
    };
    
    this.redo = ()=>{ //TODO: sync this
        var Act = re_actions.pop();
        if(!Act) return;
        if(Act.inst != 4){
            this.SelNoteClr();
        }
        sync_redo();
        console.log("redo :", Act.inst, Act.param1, Act.param2, Act.X);
        SaveNLoad(Act.index);
        doAct(Act);
        actions.push(Act);
    };

    var act = (Act, chord) => { //record action and emit sheet change message for syncronization
        if(!Act) return;
        if(Act.inst != 4 && Act.noclr !== true){
            this.SelNoteClr();
        }
        console.log("do :", Act.inst, Act.param1, Act.param2, Act.X);
        // console.log("actions:", actions);
        re_actions = [];
        Act.index = abcindex;
        //not need to do the work if it's a chord, and don't record it if there's an error
        if(chord === true || doAct(Act) !== 1){
            actions.push(Act);
            sheetchange(Act, index);
        }
    };
    
    this.sync = (A)=>{ //callback for syncronization when mutiple edittors are editing the same sheet
        re_actions = [];
        switch(A.inst){ //reverse actions(description stored for redo before)
            case 0:
                A.inst = 1;
                break;
            case 1:
                A.inst = 0;
                break;
            case 2:
                if (A.param2 == 1){
                    A.param2 = 0;
                    A.param1--;
                }else{
                    A.param2 = 1;
                    A.param1++;
                }
                break;
            case 3:
                A.param2 = [1, 0, 3, 2, 4, 5][A.param2];
                if (A.param2 == 4){
                    A.X = undefined;
                }
                break;
            case 4:
                var left = A.param1;
                var right = A.param2;
                var left_noteEnd = noteendbefore(left) + 1;
                var left_prefix = abcstr.substring(left_noteEnd, left);
                var left_delPos = left_prefix.indexOf("&(");
                var temp = CrtPos;
                CrtPos = right;
                var right_ = mvpos(1);
                if (right_ == CrtPos){
                    right_ = abcstr.length;
                }
                temp = CrtPos;
                var right_noteEnd = noteendbefore(right_) + 1;
                var right_prefix = abcstr.substring(right_noteEnd, right_);
                var right_delPos = right_prefix.indexOf("&)");
                if (left_delPos == -1 || right_delPos == -1){
                    A.param1 -= 2;
                    A.param2 -= 2;
                }else{
                    A.param1 += 2;
                    A.param2 += 2;
                }
                break;
            case 6:
                A.param2 = [A.param1, A.param1 = A.param2][0];//swap A.param1 and A.param2
                break;
            case 7:
            case 8:
            case 9:
            case 10:
                A.param2 = [A.X, A.X = A.param2][0];//swap A.X and A.param2
                break;
            case 11:
                if (A.param2 == 1){
                    A.param1-=2;
                    A.param2 = 0;
                }else{
                    A.param1+=2;
                    A.param2 = 1;
                }
                break;
            case 12:
                var A_DPos = A.param1;
                var noteEnd = noteendbefore(A_DPos) + 1;
                var prefix = abcstr.substring(noteEnd, A_DPos);
                var delPos = prefix.indexOf("-");
                if (delPos == -1){
                    A.param1--;
                }else{
                    A.param1++;
                }
                break;
            default:
                A.param2 = (A.param2 == 0)? 1: 0;
        }
        SaveNLoad(A.index);
        doAct(A);
        actions.push(A);
        this.print();
    };
    //-----------------------------------------//for voices
    clef[0] = "treble"; //default value
    voicename[0] = undefined; //default value
    var InsVocBef = false; //insert before or after certain voice
    var CtrlPos = -1;
    this.ctrl_pos = () => { //getter for CtrlPos
        return CtrlPos;
    }
    this.insvocbef = (v) => { //setter and getter for InsVocBef
        if (v !== undefined){
            InsVocBef = v;
            CtrlPos = (v)?CrtPos:-1;
        }
        return InsVocBef;
    };
    var SaveNLoad = (j) => { //save and load (j: jump to)
        if (j >= clef.length) return;
        strs[abcindex] = abcstr;
        abcstr = strs[j];
        abcindex = j;
        CrtPos = 0;
        maxoffset = rmsmb(abcstr).length + 1;
    };
    this.ChgVicName = (vn) => { //change voice name
        if(vn.indexOf("\"") != -1){
            ErrorMes("A voicename can't contain \".");
            return;
        }
        let Act = {inst: 7, param1: abcindex, param2: vn, X: voicename[abcindex]};
        act(Act);
    };
    this.ClrVicName = () => { //clear voice name
        let Act = {inst: 7, param1: abcindex, X: voicename[abcindex]};
        act(Act);
    };
    this.AddVoice = () => { //add voice
        let Act = {inst: 5, param1: {clef: "treble", str: "$", vn: undefined},
            param2: 1, X: InsVocBef
        };
        act(Act);
    };
    this.DelVoice = () => { //delete voice
        var X;
        var param1 = {clef: clef[abcindex], str: abcstr, vn: voicename[abcindex]};
        if(abcindex != 0){
            SaveNLoad(abcindex-1);
            X = false;
        }else{
            X = true;
        }
        let Act = {inst: 5, param1: param1, param2: 0, X: X};
        act(Act);
    };
    this.VicChgA = () => { //set voice A for switching
        vicchga = abcindex;
    };
    this.VicChgB = () => { //set current voice as voice B for switching
        VicChgB_(abcindex);
    };
    var VicChgB_ = (vicchgb) => { //set vicchgb as voice B for switching
        if (vicchga === undefined) return; //if not pressed "r" before
        let Act = {inst: 6, param1: vicchga, param2: vicchgb};
        act(Act);
        vicchga = undefined;
    };
    //-----------------------------------------//for voice list
    var ChgVocMd = false; //if voice A for voice switching is set
    this.regVocLstEvt = () => { //register voice list events
        $(".ui.dropdown").dropdown({silent:true});
        $(".mCSB_container").css("overflow","visible");
        $(".v_num").click(function(){
            if (!Edit) return;
            if(ChgVocMd){
                VicChgB_(parseInt($(this).html(), 10) - 1);
            }else{
                vicchga = parseInt($(this).html(), 10) - 1;
                $(this).css("background","rgba(0, 0, 0, 0.15)");
            }
            ChgVocMd = !ChgVocMd;
            MSOE.print();
        });
        $(".v_up").click(function(){
            if (!Edit) return;
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html(), 10) - 1;
            if(vic == 0) return;
            vicchga = vic;
            VicChgB_(vic - 1);
            MSOE.print();
        });
        $(".v_down").click(function(){
            if (!Edit) return;
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html(), 10) - 1;
            if(vic == clef.length - 1) return;
            vicchga = vic;
            VicChgB_(vic + 1);
            MSOE.print();
        });
        $(".v_div").click(function(){
            if (!Edit) return;
            if(!ChgVocMd || vicchga === undefined) return; //if other voice not clicked before
            var vic = parseInt($(this).attr("data-value"), 10);
            if([vic, vic-1].includes(vicchga)){ //voices around divider can't be changed
                ChgVocMd = false;
                MSOE.printVoc();
                return;
            }
            strs[abcindex] = abcstr;
            clef.splice(vic, 0, clef[vicchga]);
            strs.splice(vic, 0, strs[vicchga]);
            voicename.splice(vic, 0, voicename[vicchga]);
            var tmpvica = vicchga;
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
            if (!Edit) return;
            var vic = parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html(), 10) - 1;
            MSOE.ClfOrVic(parseInt($(this).attr("data-value"), 10) + 49, true, vic);
            MSOE.print();
        });
        $(".v_name").click(function(){
            if (!Edit) return;
            SaveNLoad(parseInt($(this).parents(".ui.inverted.menu").find(".v_num").html(), 10) - 1);
            MSOE.SelNoteClr();
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
        $("#voices .mCSB_container").append(DOM);
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
                    newClef = "tenor";
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
            this.SelNoteClr();
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
            case "tenor":
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
        for (let i = 0; i < 3; i++){
            e.find(".dp_clef").eq(i).html(Clfs[i]).attr("data-value",OrClfs.indexOf(Clfs[i]));
        }
        return res;
    };
    //-----------------------------------------//for MIDI playing
    var tune_ = null;
    this.tune = () => { //return tuneObj
        return tune_[0];
    };
    this.playing = false; //if the music is playing
    this.bpm = () => { //return bpm of the sheet
        return (infostrs["bpmstr"] == "")?180:Number(infostrs["bpmstr"]);
    };
    var volume = 10;
    this.increVolume = () => {
        if (volume < 10){
            volume++;
        }
        this.adjustvolume();
    };
    this.decreVolume = () => {
        if (volume > 0){
            volume--;
        }
        this.adjustvolume();
    };
    this.adjustvolume = () => {
        UIhandler.adjustvolume(volume * 10);
    }
    this.setmidivolume = (note) => {
        if (note === undefined) note = false;
        if (note){
            MIDI.volume = 0 + 0.001 * volume * volume;
        }else{
            MIDI.volume = 0 + 0.01 * volume * volume;
        }
    }
    //-----------------------------------------//for print
    var rmsmb = (str) => { //remove symbols should not be in the final abcstring
        console.log("after rmsmb:" + str);
        return str.replace(new RegExp(`[${ignsmbs.join("")}]`, "g"), "");
    };
    var GetStrOffset = (offset) => { //get the length before the voice and the clicked index for highlight listener
        var sum = 0;
        var res = {};
        console.log(offset);
        for (var i = 0; i < clef.length; i++) {
            sum += 18 + (Math.floor(Math.log10(i + 1)) + 1) + clef[i].length + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]).length;
            let str = (i == abcindex)?rmsmb(abcstr):rmsmb(strs[i]);
            console.log(sum);
            if (sum + str.length + 2 > offset){
                res.offset = offset - sum;
                res.ix = i;
                break;
            }
            sum += str.length + 2;
            console.log(sum);
        }
        maxoffset = rmsmb(abcstr).length + 1;
        return res;
    };
    var GetLineOffset = (line) => { //get the position of nth line's start
        var pos = 0;
        for (let i = 0; i < line; i++){
            pos = abcstr.indexOf("\n", pos) + 1;
        }
        return pos;
    };
    var ForPrint = () => { //construct the string for ABCJS rendering
        var finalstr = "";
        for (var i = 0; i < clef.length; i++) {
            if (i != abcindex) {
                finalstr += "V: " + (i + 1) + " clef=" + clef[i] + " name=\"" + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]) + "\"\n" + rmsmb(strs[i]) + " \n";
            } else {
                finalstr += "V: " + (i + 1) + " clef=" + clef[i] + " name=\"" + ((voicename[i] === undefined)?RdClf(clef[i], undefined, 1):voicename[i]) + "\"\n" + rmsmb(abcstr) + " \n";
            }
        }
        return finalstr;
    };
    this.print = () => { //output svg
        StartHint(allstr_empty());
        var [prefix, note] = prefix_note_of(CrtPos);
        UIhandler.showlabels(prefix, note);
        var bpmstr = (infostrs["bpmstr"] == "")?"180":infostrs["bpmstr"];
        updateLstr();
        var SS = "T: " + infostrs["ttlstr"] + "\nM: " + infostrs["tmpstr"] + "\nL: " + Lstr + "\nC: " + infostrs["cmpstr"] + "\nQ: " + bpmstr + "\n" + ForPrint();
        // console.log("entire abcstr:", SS);
        var previewS = "M: " + infostrs["tmpstr"] + "\nL: " + Lstr + "\nV: 1 clef=" + clef[abcindex] + "\n" + toabcnote("G").replace("*", "");
        abcjs.renderAbc('booo', previewS, {}, {
            listener: {
                highlight: function(){MSOE.print();}
            }
        }, {});
        tune_ = abcjs.renderAbc('boo', SS, {}, {
            add_classes: true,
            editable: true,
            listener: {
                highlight: click_handler
            }
        });
        let qpm_ = Number(infostrs["bpmstr"]);
        abcjs.renderMidi("midi", SS, {}, { generateDownload: true, generateInline: true, qpm: qpm_, listener: (midiElem, midiEvent)=>{
                this.setmidivolume();
                if(midiEvent.progress == 1){
                    $("#play").text("Play");
                    this.playing = false;
                }
            },
            animate: {
                // listener: (svgElems)=>{
                //     console.log(svgElems);
                // },
                target: tune_[0],
                qpm: qpm_
            }
        }, {});
        $("#boo path, #boo tspan").attr("fill", (UIhandler.night?"white":"#000000"));
        $("#boo path.triplet").attr("stroke", (UIhandler.night?"white":"#000000"));
        $("#booo path, #booo tspan").attr("fill", "white");
        if(Edit){
            this.SelNoteHighLight_();
        }else{
            stopBounce();
        }
    };
    var click_handler = (abcElem) => {
        $("#boo path, #boo tspan").attr("fill", (UIhandler.night?"white":"#000000"));
        $("#boo path.triplet").attr("stroke", (UIhandler.night?"white":"#000000"));
        $("#booo path, #booo tspan").attr("fill", "white");
        if(this.insvocbef() || this.chordmode()){ //select notes
            sel_handler(abcElem);
        }else{
            pos_handler(abcElem);
        }
    };
    var pos_handler = (abcElem) => { //update CrtPos when note is clicked
        console.log("move cursor");
        CrtPos = clicked_index(abcElem);
        console.log(CrtPos);
        this.pre_move();
        this.post_move();
        this.print();
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
                clef: clef,
                voicename: voicename
            };
            server_save(data, function(msg) {
                console.log(msg);
                if (msg.status.error) {
                    return console.log(msg.status.msg);
                }
                if (msg.status.success) {
                    index = msg.url.index;
                    key = msg.url.key;
                    suscribe(index, false);
                    console.log(msg.status.msg);
                    SuccessMes("Successfully saved.");
                    UIhandler.hide_discard();
                    if (push) {
                        history.pushState({ title: "" }, "", host + "?!" + index + "!" + key);
                    }
                    UIhandler.displayurl("?!" + index + "!" + key);
                } else {
                    console.log(msg.status.msg);
                }
            });
            
        } else {
            console.error("Web browser doesn't support history api");
            ErrorMes("Your browser doesn't have a needed api support");
        }
    };
    this.urlload = (func) => { //load sheet from database using info in url
        url = location.search.split("?")[1] || "";
        index = url.split("!")[1] || "";
        key = url.split("!")[2] || "";

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
                    strs = msg.sheet.strs || [];
                    clef = msg.sheet.clef;
                    voicename = msg.sheet.voicename || [];

                    Edit = msg.status.edit;
                    if(!Edit){
                        $("#modaldiv1").modal("hide");
                        $("#modaldiv2").modal("hide");
                        $("input").attr("disabled","disabled");
                        $("#save_url input").removeAttr("disabled");
                        $(".left a.item").addClass("disabled");
                        Edit_const = true;
                        history.pushState({ title: "" }, "", host + "?!" + index);
                        key = "";
                    }else if(key!=""){
                        $("#modaldiv1").modal("hide");
                        $("#modaldiv2").modal("hide");
                    }
                    updateinfo();
                    suscribe(index, true, func);
                    console.log(msg.status.msg);
                } else {
                    console.log(msg.status.msg);
                    window.location.replace(host);
                    func();
                }
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
    
    this.displayurl = () => {
        if (index !== ""){
            var ret_url = "?!" + index;
            if (key !== ""){
                ret_url += "!" + key;
            }
            UIhandler.displayurl(ret_url);
        }
    };
    
    this.host = () => {
        return host;
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
        "tmpstr":"4/4",
        "bpmstr":""
    };
    this.chginfo = (a) => { //change info strings
        if ((!Edit && a.name!="whatisbpm")||(a.name === "")) return;
        if (a.name == "whatistempo" && a.value.length == 2){ //update tempo preprocessing
            a.value = a.value[0] + "/" + a.value[1]; //if user is lazy and inputs, for example, 44 for 4/4, add "/" for the lazy guy
        }
        let Act = {inst: 8, param1: a.name, param2: a.value, X: infostrs[infoinputs[a.name]]};
        act(Act);
        this.print();
    };
    var updateLstr = () => { //calculate Lstr from infostrs['tmpstr']
        for (var i = 0; i < infostrs["tmpstr"].length; i++) {
            if (infostrs["tmpstr"][i] == "/") {
                Lstr = "1/" + infostrs["tmpstr"].substring(i + 1);
                break;
            }
        }
    };
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
            if ((p != -1) && (Swap)) {
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
    this.paste = (cpStr) => { //paste copied or cutten string
        cpStr = cpStr || CpStr;
        if (mvpos(1) == CrtPos) {
            let Act = {inst: 1, param1: abcstr.length, param2: cpStr, X: abcstr.length + cpStr.length - 1};
            act(Act);
            // CrtPos = abcstr.length - 1;
            // CrtPos = mvpos(0);
        } else {
            let Act = {inst: 1, param1: mvpos(1), param2: cpStr, X: mvpos(1) + cpStr.length - 1};
            act(Act);
            // CrtPos += CpStr.length;
            // CrtPos = mvpos(0);
        }
        checkbar();
    };
    var arrangeSelNotes = () => {
        return this.PartialSelNotes("pos", SelNotes.sort((a, b) => {
            if (a.pos < b.pos){
                return -1;
            }else if (a.pos > b.pos){
                return 1;
            }else{
                return 0;
            }
        }));
    };
    var updateSelPoses = (poses) => {
        SelNotes = SelNotes.sort((a, b) => {
            if (a.pos < b.pos){
                return -1;
            }else if (a.pos > b.pos){
                return 1;
            }else{
                return 0;
            }
        });
        for (let idx in SelNotes){
            SelNotes[idx].pos = poses[idx];
        }
    };
    var posToNotes = (poses) => {
        var res = [];
        var tmp = CrtPos;
        for (let pos of poses){
            CrtPos = pos;
            var End = (mvpos(1) == CrtPos)?abcstr.length:mvpos(1);
            if (abcstr[End - 1] == "\n"){
                End--;
            }
            var str = abcstr.substring(pos, End);
            if (str == "$") str = "\n$";
            res.push(str);
        }
        CrtPos = tmp;
        console.log(res);
        return res.join("");
    };
    var CpStr2 = "";
    this.copy2 = () => {
        var copiedNotes = arrangeSelNotes();
        copiedNotes = posToNotes(copiedNotes);
        console.log("copy: ", copiedNotes);
        CpStr2 = copiedNotes;
    };
    this.paste2 = () => {
        this.paste(CpStr2);
        this.print();
    };
    this.del_sel_notes = () => {
        var copiedNotes = arrangeSelNotes();
        var CtStP = copiedNotes[0];
        if (abcstr[CtStP - 1] == "\n"){
            CtStP--;
        }
        var tmp = CrtPos;
        CrtPos = copiedNotes[copiedNotes.length - 1];
        var CtEdP = mvpos(1);
        if (CtEdP == CrtPos){
            CtEdP = abcstr.length;
        }
        CrtPos = tmp;
        var lastContent = abcstr.substring(copiedNotes[copiedNotes.length - 1], CtEdP);
        var [prefix, _] = prefix_note_of(CtStP);
        var new_prefix = union_symbol(has_symbol(prefix), has_symbol(lastContent)).join("");
        var both_slurs = false;
        if (prefix.includes("&(") && lastContent.includes("&)")){
            new_prefix = new_prefix.replace(/&\(|&\)/g, "");
            both_slurs = true;
        // FIXME: lots of issues for slurs and ties
        // more than one slurs would be ignored by union
        // if a note is both a slur start and a slur end the &( should stay
        // if the notes to be deleted are forming one big slur, delete the whole slur
        // maybe the solution is creating different rules for every prefix type especially slur and tie... Oh my...
        }else if (prefix.includes("&(") || lastContent.includes("&)")){
            ErrorMes("cannot delete notes on one of slur ends");
            return;
        }
        copiedNotes = posToNotes(copiedNotes);
        // act({inst:0, param1: CtStP, param2: copiedNotes, X: CtEdP});
        act({inst:10, param1: CtStP - prefix.length, param2: new_prefix, X: prefix + copiedNotes});
        return copiedNotes;
    };
    this.cut2 = () => {
        // var copiedNotes = arrangeSelNotes();
        // var CtStP = copiedNotes[0];
        // var tmp = CrtPos;
        // CrtPos = copiedNotes[copiedNotes.length - 1];
        // var CtEdP = mvpos(1);
        // if (CtEdP == CrtPos){
        //     CtEdP = abcstr.length;
        // }
        // CrtPos = tmp;
        // copiedNotes = posToNotes(copiedNotes);
        // console.log("cut: ", copiedNotes);
        // CpStr2 = copiedNotes;
        // if (copiedNotes[0] == "\n"){
        //     if (CtStP == 0){
        //         copiedNotes = copiedNotes.substring(2);
        //         CtStP++;
        //     }else{
        //         CtStP--;
        //     }
        // }
        // act({inst:0, param1: CtStP, param2: copiedNotes, X: CtEdP});
        // this.print();
        CpStr2 = this.del_sel_notes();
        console.log("cut: ", CpStr2);
    };
    //-----------------------------------------//for note selector
    var SelColor = "#2196f3";
    var SelNotes = []; // array of {pos:Number, sel:String}
    this.PartialSelNotes = (mode, guest) => {
        var mapfunc = n => n;
        if (mode=="pos") mapfunc = n => n.pos;
        if (mode=="sel") mapfunc = n => n.sel;
        var subject = guest || SelNotes;
        return subject.map(mapfunc);
    };
    this.SelNoteClr = () => { //clear selected notes, called when the sheet is changed
        this.SelNoteHighLight("clear", {color:(UIhandler.night?"white":"#000000")});
        SelNotes = [];
    };
    this.SelNotesIndexOf = (notes) => {
        var notePos = notes.pos;
        var SelNotesPos = this.PartialSelNotes("pos");
        return SelNotesPos.indexOf(notePos);
    };
    this.SelNotesIncludes = (notePos) => {
        return SelNotes.some(function(note){return note.pos == notePos;});
    };
    this.SelNoteCheck = (note) => {
        var poses = arrangeSelNotes();
        var in_ = poses.includes(note.pos);
        var min = poses[0], max = poses[poses.length - 1];
        if (in_){//2: on border => unselect, 3: inside => clear and select new one
            return (note.pos == min || note.pos == max)? 2: 3;
        }else{//0: alone => clear and select new one, 1: beside border => concate
            var tmp = CrtPos;
            CrtPos = min;
            min = mvpos(0);
            CrtPos = max;
            max = mvpos(1);
            CrtPos = tmp;
            return (note.pos == min || note.pos == max)? 1: 0;
        }
    };
    this.SelNotesPush = (notes) => { //add new notes to selected notes
        if(!Array.isArray(notes)){
            notes = [notes];
        }
        for (let note of notes){
            var check = this.SelNoteCheck(note);
            switch(check){
                case 0:
                    SelNotes = [note];
                    break;
                case 1:
                    SelNotes.push(note);
                    break;
                case 2:
                    SelNotes.splice(this.SelNotesIndexOf(note), 1);
                    break;
                case 3:
                    SelNotes = [note];
                    break;
            }
        }
        console.log(SelNotes);
        this.SelNoteHighLight("clear", {color:(UIhandler.night?"white":"#000000")});
        this.SelNoteHighLight("HL", {color: SelColor, notes: this.PartialSelNotes("sel")});
    };
    var SelNotesShift = (amt) => {
        SelNotes = SelNotes.map(x=>{return {pos: x.pos + amt, sel: x.sel}});
    };
    this.SelNotesCrt = () => {
        this.SelNotesPush({pos: CrtPos, sel: this.getCssClass(this.chordPos())});
    };
    var SelNotesSelect = (pos) => {
        this.SelNotesPush({pos: pos, sel: this.getCssClass(pos)});
    };
    this.SelNoteHighLight_ = () => {
        this.SelNoteHighLight("HL", {color: SelColor, notes: this.PartialSelNotes("sel")});
    };
    this.SelNoteHighLight = (op, arg) => { //highlight selected notes or clear highlighting. op: "clear" or "HL", arg: color or notes.sels...
        switch (op) {
            case "clear":
                $("#boo path, #boo tspan").attr("fill", arg.color);
                break;
            case "HL":
                $(arg.notes.join(", ")).attr("fill", arg.color);
                if(arg.notes.includes(this.getCssClass(this.chordPos()))){
                    cursorBounce(this.getCssClass(this.chordPos()), SelColor);
                }else{
                    cursorBounce(this.getCssClass(this.chordPos()), (UIhandler.night?"white":"#000000"));
                }
                break;
        }
    };
    var sel_handler = (abcElem) => { //select notes
        console.log("select notes");
        var tmpC = CrtPos, tmpI = abcindex;
        var selected = clicked_index(abcElem);
        if (tmpI != abcindex){
            this.SelNoteClr();
            CrtPos = selected;
            this.print();
        }else{
            SaveNLoad(tmpI);
            CrtPos = tmpC;
        }
        console.log("clicked on: " + selected);
        if (this.insvocbef()){
            this.SelNotesPush({pos: selected, sel: this.getCssClass(selected)});
        }else{
            this.chmodeoff();
            if (selected > CrtPos){
                var tmp = CrtPos;
                var poses = [];
                while (mvpos(1) != selected && mvpos(1) != CrtPos){
                    poses.push(CrtPos);
                    CrtPos = mvpos(1);
                }
                poses.push(CrtPos);
                poses.push(mvpos(1));
                CrtPos = tmp;
                this.SelNotesPush(poses.map(n => {return {pos: n, sel: this.getCssClass(n)}}));
            }else if (selected < CrtPos){
                var tmp = CrtPos;
                var poses = [];
                while (mvpos(0) != selected && mvpos(0) != CrtPos){
                    poses.push(CrtPos);
                    CrtPos = mvpos(0);
                }
                poses.push(CrtPos);
                poses.push(mvpos(0));
                CrtPos = tmp;
                this.SelNotesPush(poses.map(n => {return {pos: n, sel: this.getCssClass(n)}}));
            }else{
                this.SelNotesPush({pos: selected, sel: this.getCssClass(selected)});
            }
            CrtPos = selected;
            this.chmodeon();
            this.SelNoteHighLight_();
        }
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
    var ChgInPlc = false; // whether to change duration in place
    this.chginplc = (val) => { // getter and setter for ChgInPlc
        if (val != undefined){
            ChgInPlc = val;
        }
        return ChgInPlc;
    };
    var newDFromoldD = (oldD, md) => { // caculate newD from oldD
        var parts = oldD.split("/");
        var D;
        if (parts.length == 1) {
            D = parts[0];
        } else {
            D = parts[0] / parts[1];
        }
        var ceil = 1/16;
        for (; ceil <= 8; ceil*=2){
            if (D < ceil){
                break;
            }
        }
        var base = ceil/2;
        var n = Math.log2(1/(1-D/(2*base)));
        switch (md) {
            case 0:
                base = (base == 1/32)? 8: base/2;
                break;
            case 1:
                base = (base == 8)? 1/32: base*2;
                break;
            case 2:
                if (n == 1) return;
                n--;
                break;
            case 3:
                n++;
                break;
            default:
                return;
        }
        var newD = numtostr(2 * base * (1 - Math.pow(1/2, n)));
        if (newD == "1") newD = "";
        if (oldD == "1") oldD = "";
        return [newD, oldD];
    };
    var getoldDAt = (pos, isChord) => { // get oldD from substring for note at pos
        isChord = isChord || false;
        var temp = CrtPos;
        CrtPos = pos;
        var edP = mvpos(1);
        if (edP == CrtPos){
            edP = abcstr.length;
        }
        var oldContent = abcstr.substring(CrtPos, edP);
        if (oldContent.endsWith("\n")){
            oldContent = oldContent.substring(0, oldContent.length - 1);
        }
        var dFrom = undefined;
        for (var i = oldContent.length - 1; i > 0; i--){
            if (oldContent[i] == "*"){
                dFrom = i;
                break;
            }
        }
        var dTo = noteendbefore(edP) - 1;
        if (isChord){
            dTo = noteendbefore(dTo + 1) - 1;
        }
        var oldD = oldContent.substring(dFrom + 1, dTo - CrtPos + 1);
        if (oldD == ""){
            oldD = "1";
        }
        CrtPos = temp;
        return [oldD, oldContent];
    };
    var ChgDstateInPlaceSingle = (md, pos, noclr) => {
        var isChord = false;
        if (pos < abcstr.length - 1 && abcstr[pos + 1] == "#"){
            isChord = true;
        }
        var oldD, oldContent, newD;
        [oldD, oldContent] = getoldDAt(pos, isChord);
        if (oldContent.indexOf("*") == -1){
            if (oldContent == "$" && pos != 0){
                oldContent = "\n$";
            }
            return [0, oldContent, oldContent];
        }
        [newD, oldD] = newDFromoldD(oldD, md);
        var newContent = oldContent.replace(new RegExp("\\*" + oldD, "g"), "*" + newD);
        if (!noclr){
            act({inst: 10, param1: pos, param2: newContent, X: oldContent});
        }
        return [newContent.length - oldContent.length, oldContent, newContent];
    };
    var ChgDstateInPlaceSel = (md) => {
        var offset = 0;
        var newPoses = [];
        var oldabcstring = "";
        var newabcstring = "";
        var firstPos = undefined;
        for (let pos of arrangeSelNotes()){
            if (firstPos === undefined) firstPos = pos;
            newPoses.push(pos + offset);
            var result = ChgDstateInPlaceSingle(md, pos, true);
            offset += result[0];
            oldabcstring += result[1];
            newabcstring += result[2];
        }
        act({inst: 10, param1: firstPos, param2: newabcstring, X: oldabcstring, noclr: true});
        updateSelPoses(newPoses);
    };
    this.ChgDstateInPlace = (md) => { //change duration state in place
        this.chmodeoff();
        if (SelNotes.length == 0){
            ChgDstateInPlaceSingle(md, CrtPos);
        } else {
            ChgDstateInPlaceSel(md);
        }
        this.chmodeon();
    };
    this.ChgTstate = (md) => { //change octave state
        if (md == 0) Tstate = (Tstate == 3) ? 0 : Tstate + 1;
        else if (md == 1) Tstate = (Tstate == 0) ? 3 : Tstate - 1;
        return Tstate;
    };
    var insert = (str, md) => { //insert string in the right position. mode=1 for notations not occupying a position
        if (str == "|")
            str += "@";
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
                this.SelNoteClr();
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
    this.tie = () => { //tie two joint notes
        let Act = {inst: 12, param1: CrtPos};
        act(Act);
    };
    this.untie = () => { //untie tied notes
        let Act = {inst: 4, param1: CrtPos, param2: 1};
        act(Act);
    };
    this.triplet = () => { //triplet following notes
        let Act = {inst: 11, param1: CrtPos, param2: 0};
        act(Act);
    };
    this.untriplet = () => { //untriplet following notes
        let Act = {inst: 11, param1: CrtPos, param2: 1};
        act(Act);
    };
    this.accidental = (md) => { //add or delete accidental (# or b)
        let Act = {inst: 3, param1: CrtPos, param2: md};
        act(Act);
    };
    this.newline = () => { //add "\n"
        if (CrtPos != 0 && abcstr[CrtPos - 1] != "\n") { //ABCJS doesn't allow 2 "\n"s in series
            insert("\n$", 1);
        }
    };
    this.del = () => { //delete note or selected notes
        if (SelNotes.length == 0){
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
                    var [prefix, _] = prefix_note_of(CrtPos);
                    var new_prefix = union_symbol(has_symbol(prefix), has_symbol(Content)).join("");
                    if (prefix.includes("&(") || Content.includes("&)")){
                        ErrorMes("cannot delete notes on one of slur ends");
                        return;
                    }
                    // let Act = {inst: 0, param1: CrtPos, param2: Content};
                    let Act = {inst: 10, param1: CrtPos - prefix.length, param2: new_prefix, X: prefix + Content};
                    act(Act);
                    CrtPos += new_prefix.length;
                } else { //deleting "\n"
                    let Act = {inst: 0, param1: CrtPos - 1, param2: "\n$"};
                    act(Act);
                }
            }
            console.log(CrtPos);
            console.log(abcstr);
        }else{
            // var copiedNotes = arrangeSelNotes();
            // var CtStP = copiedNotes[0];
            // if (abcstr[CtStP - 1] == "\n"){
            //     CtStP--;
            // }
            // var tmp = CrtPos;
            // CrtPos = copiedNotes[copiedNotes.length - 1];
            // var CtEdP = mvpos(1);
            // if (CtEdP == CrtPos){
            //     CtEdP = abcstr.length;
            // }
            // CrtPos = tmp;
            // var lastContent = abcstr.substring(copiedNotes[copiedNotes.length - 1], CtEdP);
            // var [prefix, _] = prefix_note_of(CtStP);
            // var new_prefix = union_symbol(has_symbol(prefix), has_symbol(lastContent)).join("");
            // if (new_prefix == "&)&("){
            //     new_prefix = "";
            // }
            // if (prefix.includes("&(") || lastContent.includes("&)")){
            //     ErrorMes("cannot delete notes on one of slur ends");
            //     return;
            // }
            // copiedNotes = posToNotes(copiedNotes);
            // // act({inst:0, param1: CtStP, param2: copiedNotes, X: CtEdP});
            // act({inst:10, param1: CtStP - prefix.length, param2: new_prefix, X: prefix + copiedNotes});
            this.del_sel_notes();
        }
    };
    this.outslur = () => {
        if (SelNotes.length < 2){
            ErrorMes("You have to select more than two notes first");
            return;
        }
        var poses = arrangeSelNotes();
        var left = poses[0], right = poses[poses.length - 1];
        if (!slurCheck(left, right)){
            ErrorMes("Both ends need to be notes");
            return;
        }
        slur(left, right);
    };
    var slurCheck = (l, r) => {
        var illegalChars = ["z", "Z", "|", "$"];
        return !(illegalChars.includes(abcstr[l + 1]) || illegalChars.includes(abcstr[r + 1]));
    };
    var slur = (left, right) => {
        act({inst: 4, param1: left, param2: right});
    };
    this.insertchsnippet = (sci) => {
        check = toabcnote2(Tonal.Chord.notes(sci));
        if (check == 1){
            ErrorMes("Chord not legal");
        }
        if (check == 2){
            ErrorMes("Chord out of range");
        }
        this.print();
    };
    var VALID_ROOT = ["C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb", "G", "G#", "Ab", "A", "A#", "Bb", "B", "B#", "Cb"];
    this.insertchformula = (root, numbers) => {
        if (!VALID_ROOT.includes(root)){
            ErrorMes("Invalid root");
            return;
        }
        var scale = Tonal.Scale.notes(root, "major");
        numbers = numbers.split(",");
        var notes = [], octs = [];
        for (let num of numbers){
            var m = num.match(/^([b#])?([0-9])+/);
            if (m == null){
                ErrorMes("Formula not legal");
                return;
            }else{
                var idx, nth, octoff;
                if (m[1] != undefined){
                    var accd = m[1];
                    idx = parseInt(num.substring(1), 10) - 1;
                    nth = idx % 7;
                    octoff = (idx + NOTECHAR.indexOf(root[0])) / 7;
                    notes.push(accdnote(scale[nth], accd, root[1]));
                    octs.push(Math.floor(octoff));
                }else{
                    idx = parseInt(num, 10) - 1;
                    nth = idx % 7;
                    octoff = (idx + NOTECHAR.indexOf(root[0])) / 7;
                    notes.push(scale[nth]);
                    octs.push(Math.floor(octoff));
                }
            }
        }
        toabcnote2(notes, octs);
        this.print();
    };
    var chordmode = false;
    this.chordmode = (ch) => {
        if (ch !== undefined){
            chordmode = ch;
        }
        return chordmode;
    };
    this.chordPos = () => {
        if (this.chordmode() && abcstr.substr(mvpos(1), 3) !== "$[]"){
            return mvpos(1);
        }else{
            return undefined;
        }
    };
    this.chmodeon = () => { //chord mode on
        if (this.chordmode()){ //if shift pressed
            var InsBef = mvpos(1); //insert before
            if ((InsBef == CrtPos) || (abcstr[InsBef + 1] != "[")) {
                insert("$[]", 1);
            }
        }
    };
    this.chmodeoff = () => { //chord mode off
        this.chplclr();
        if (abcstr.substr(mvpos(1), 2) === "$[") {
            abcstr = abcstr.substring(0, mvpos(1) + 1) + "#" + abcstr.substring(mvpos(1) + 1);
            var pos = mvpos(1);
            CrtPos = mvpos(1);
            act({inst: 0, param1: pos, param2: abcstr.substring(pos, ((CrtPos == mvpos(1))?abcstr.length:mvpos(1)))}, true);
            checkbar();
        }
        this.print();
    };
    this.chplclr = () => {
        abcstr = abcstr.replace(/\$\[\]/g, "");
    };
    //-----------------------------------------//helpers
    var tonum = (str) => { //transform string representation of fraction to number
        var Dnmntr = 0; //denominator
        var Nmrtr = 0; //numerator
        for (var i = 0; i < str.length; i++) {
            if (str[i] == "/") {
                Nmrtr = parseInt(str.substring(0, i), 10);
                Dnmntr = parseInt(str.substring(i + 1), 10);
                return Nmrtr / Dnmntr;
            }
        }
        return parseInt(str, 10);
    };
    var checkbar = () => { //add bar automatically
        var SofD = 0; //sum of duration
        var temD = ""; //temparary duration
        var ChFm = mvpos(1); //check from
        var MaxD; //the max duration between bars

        for (var i = 0; i < infostrs["tmpstr"].length; i++) {
            if (infostrs["tmpstr"][i] == "/") {
                MaxD = parseInt(infostrs["tmpstr"].substring(0, i), 10);
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
            if (abcstr[i] == "\n" || abcstr[i] == "]" || abcstr[i] == "[" || abcstr[i] == "@") continue;
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
                this.SelNotesCrt();
            }
            return;
        }
        if (md == 5) { //5: move to the last note of this line
            while (mvpos(1) != CrtPos && abcstr[mvpos(1) - 1] != "\n") {
                CrtPos = mvpos(1);
                this.SelNotesCrt();
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
        this.setmidivolume(true);
        MIDI.noteOn(0, 48 + (Tstate) * 12 + temnum, 127, 0);
        MIDI.noteOff(0, 48 + (Tstate) * 12 + temnum, 0.75);
        return 48 + (Tstate) * 12 + temnum;
    };
    var accdnote = (note, accd, rootlimit) => {
        if (accd != "#" && accd != "b"){
            console.error("something's wrong with the code");
            return;
        }
        note = note + "5";
        accd = (accd == "#")?1:-1;
        var useSharpen = (rootlimit !== undefined)?(rootlimit == "#"):(accd == 1);
        var res = Tonal.Note.fromMidi(Tonal.midi(note)+accd, useSharpen);
        return res.substr(0, res.length-1);
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
        return String(num);
    };
    var toabcnote = (ch, Tst) => { //generate a string for a note in ABC format
        Tst = (Tst === undefined)? Tstate: Tst;
        if (ch != "z") { //pause has no tune
            switch (Tst) { //for tunes
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
        ch = ch + "*" + numtostr(Math.pow(2, Dstate % 10 - 4) * (1 - Math.pow(1 / 2, Math.floor(Dstate / 10) + 1))) + "@";
        return ch;
    };
    var NOTECHAR = ["C", "D", "E", "F", "G", "A", "B"];
    var toabcnote2 = (chs, octs) => {
        console.log("notes: ", chs);
        if (chs.length == 0 || chs[0] == null) return 1;
        for (let ch of chs){
            if (!ch.match(/^[ABCDEFGb#]+$/)){
                return 1;
            }
        }
        var last = NOTECHAR.indexOf(chs[0][0]);
        var Tst = Tstate;
        var abcchord = "#[";
        var i = 0;
        for (let ch of chs){
            let lttr = ch[0], accd = ch.substring(1);
            var idx = NOTECHAR.indexOf(lttr);
            if (octs == undefined){
                if (idx < last){
                    if (Tst == 3){
                        return 2;
                    }else{
                        Tst++;
                    }
                }
                last = idx;
            }else{
                Tst = Tstate + octs[i];
                if (Tst > 3){
                    return 2;
                }
                i++;
            }
            accd = accd.replace(/b/g, "_").replace(/#/g, "^");
            var abcch = toabcnote(lttr, Tst);
            abcchord = abcchord + accd + abcch;
        }
        insert(abcchord + "]");
    }
    this.checkpause = () => { //check if the pause is legal
        return (Math.pow(2, Dstate % 10 - 5) * eval(Lstr) >= 2);
    };
    this.getCssClass = (CrtPos_, abcindex_) => { //an interface for further possible proxy use
        CrtPos_ = (CrtPos_ == undefined)?CrtPos:CrtPos_;
        abcindex_ = (abcindex_ == undefined)?abcindex:abcindex_;
        return CrtPos_cssClass(CrtPos_, abcindex_);
    };
    //convert CrtPos to or from a note's cssClass (selector) type: number <-> string
    //typeof from: number => CrtPos, abcindex -> cssClass, noteindex
    //typeof from: string => cssClass, noteindex -> CrtPos, abcindex
    var CrtPos_cssClass = (from, index) => {
        //cssClass: "path.note.lX.mX.vX:eq(X)" or "path.staff-extra.lX.vX:eq(0)" or "path.bar.lX.mX.vX:eq(0)"
        if ((typeof from) == "number"){ //from CrtPos to cssClass
            //do 
            var L = "", M = "", V = "", note = ":eq(0)", type = "";
            V = ".v" + (index - empty_strs_count());
            if(from == 0 || abcstr[from-1] == "\n"){ //start of a line
                type = ".staff-extra";
            }else if(abcstr[from+1] == "|"){ //bar
                type = ".bar";
            }else{
                type = ".note";
            }
            var line = 0;
            var start = 0;
            var substr = abcstr.substring(1, from + 1);
            while(substr.indexOf("\n$", start) != -1){
                start = substr.indexOf("\n$", start) + 2;
                line++;
            }
            L = ".l" + line;
            if(type != ".staff-extra"){
                var measure = 0;
                var start_with_bar = false;
                if(substr.substr(start, 2) == "$|"){
                    measure = -1;
                    start_with_bar = true;
                }
                while(substr.indexOf("$|", start) != -1){
                    start = substr.indexOf("$|", start) + 2;
                    measure++;
                }
                if(start_with_bar && measure == 0 && type == ".bar"){
                    note = ":eq(1)";
                }
                M = ".m" + measure;
            }
            if(type == ".note"){
                var noteindex = -1;
                while(substr.indexOf("$", start) != -1){
                    start = substr.indexOf("$", start) + 1;
                    noteindex++;
                }
                note = ":eq(" + noteindex + ")";
            }
            return "#boo path" + type + L + M + V + note;
        }else if((typeof from) == "string"){ //from cssClass to CrtPos
            //reserved
        }else{
            console.warn("the type of argument is not supported: " + from);
        }
    };
    
    var allstr_empty = (before) => { //return if all abcstrs are empty. before: the index to test before
        let strs_ = strs.slice(0, before);
        if(strs_.length == 0){
            return (abcstr == "$");
        }else{
            return strs_.reduce((res, str, i) => {
                if(i != abcindex){
                    return res && (str == "$");
                }else{
                    return res && (abcstr == "$");
                }
            }, true);
        }
    };
    var empty_strs_count = () => { //return the number of continous empty abcstrs from index 0
        return strs.reduce((res, str, i) => {
            if(res.count == false) return res;
            let str_ = (i == abcindex)?abcstr:str;
            if(str_ == "$"){
                res.sum++;
                // console.log(res);
                return res;
            }else{
                res.count = false;
                // console.log(res);
                return res;
            }
        }, {sum: 0, count: true}).sum;
    };
    
    var ignsmbs = ["$", "#", "*", "@", "&"]; //symbols that won't be in the final abcstring
    
    var clicked_index = (abcElem) => {
        console.log(abcstr);
        var bpmstr = (infostrs["bpmstr"] == "")?"180":infostrs["bpmstr"];
        console.log(abcElem);
        updateLstr();
        if (abcElem.startChar == undefined){ //click on staff
            var class_ = abcElem.abselem.elemset[0].attrs.class; 
            var line = class_.match(/l([^ ]*)/)[1];
            var voice = class_.match(/v([^ ]*)/)[1];
            SaveNLoad(voice);
            return GetLineOffset(line);
        }
        var stroffset = GetStrOffset(abcElem.startChar - 19 - infostrs["ttlstr"].length - infostrs["tmpstr"].length - Lstr.length - infostrs["cmpstr"].length - bpmstr.length);
        var offset = stroffset.offset;
        var moveix = stroffset.ix;
        SaveNLoad(moveix);
        if ((offset < 0) || (offset > maxoffset)){ //illegal offset
            return CrtPos;
        }
        if (offset == 0) {
            return 0;
        }
        var srchstr = abcstr.replace(/\$\[\]/g, "");
        for (var i = 0; i < srchstr.length; i++) {
            if (!ignsmbs.includes(srchstr[i])) {
                if (offset != 1) {
                    offset--;
                } else if (srchstr[i] == "[") { //for chord
                    return i - 2;
                } else if (srchstr[i] == "(" && srchstr[i-1] == "&") { //for slur start
                    CrtPos = i;
                    return mvpos(1);
                } else {
                    return i - 1;
                }
            }
        }
    };
    
    var noteendbefore = (pos, after) => {
        if (pos == 0){
            return -1;
        }
        after = after || 0;
        for (var i = pos - 1; i >= after; i--){
            if (abcstr[i] == "@" || abcstr[i] == "]" || abcstr[i] == "$"){
                return i;
            }
        }
        console.error("can't find note end in the given interval.");
    };
    var prefix_note_of = (pos) => {
        var noteEnd = noteendbefore(pos) + 1;
        var temp = CrtPos;
        CrtPos = pos;
        var noteTail = mvpos(1);
        if (noteTail == CrtPos) noteTail = abcstr.length;
        CrtPos = temp;
        return [abcstr.substring(noteEnd, pos), abcstr.substring(pos, noteTail)]
    };
    
    var addon_symbols = ["&)", " ", "-", "(3", "&("];
    var has_symbol = (str) => {//find the addon-symbols exist in str
        var sym_set = [];
        for (var sym of addon_symbols){
            if (str.includes(sym)){
                sym_set.push(sym);
            }
        }
        return sym_set;
    };
    var union_symbol = (sym1, sym2) => {//return the union of two symbol sets
        var sym_set = [];
        for (var sym of addon_symbols){
            if (sym1.includes(sym) || sym2.includes(sym)){
                sym_set.push(sym);
            }
        }
        return sym_set;
    };
    
    var bouncingID, previousSelector;
    var cursorBounce = (selector, color)=>{ //make certain element has bouncing effect to be a cursor
        console.log(selector);
        if ($(selector).length != 0 && !UIhandler.isInView(selector)){
            UIhandler.scrollSheetTo(selector);
        }
        var a = true;
        stopBounce();
        if(allstr_empty(abcindex + 1)) return;
        bouncingID = setInterval(function(){
            $(selector).attr("stroke",(a)?color:"none");
            a=!a;
        }, 500);
        previousSelector = selector;
    };
    var stopBounce = () => {
        clearInterval(bouncingID);
        $(previousSelector).attr("stroke","none");
    };
    
    var movefrom;
    this.pre_move = () => {
        this.chmodeoff();
        movefrom = CrtPos;
    };
    
    this.pre_move_edge = () => {
        this.chmodeoff();
        if(this.insvocbef()){
            this.SelNotesCrt();
        }
        movefrom = CrtPos;
    };
    
    this.pre_move_line = () => {
        this.pre_move_edge();
    };
    
    this.post_move = () => {
        if (this.insvocbef() && movefrom != CrtPos){ //if ctrl pressed
            if (!this.SelNotesIncludes(movefrom)){
                if (!this.SelNotesIncludes(CrtPos)){
                    SelNotesSelect(movefrom);
                    SelNotesSelect(CrtPos);
                }
            }else{
                if (!this.SelNotesIncludes(CrtPos)){
                    SelNotesSelect(CrtPos);
                }else{
                    if (SelNotes.length == 2){
                        SelNotesSelect(movefrom);
                        SelNotesSelect(CrtPos);
                    }else{
                        SelNotesSelect(movefrom);
                    }
                }
            }
        }
        this.chmodeon();
        if (!this.insvocbef()){
            this.SelNoteClr();
        }
        this.print();
    };
    
    this.post_move_edge = () => {
        this.chmodeon();
        if (!this.insvocbef()){
            this.SelNoteClr();
        }
        this.print();
    };
    
    this.post_move_line = () => {
        this.chmodeon();
        if (!this.insvocbef()){
            this.SelNoteClr();
        }else{
            if (CrtPos == movefrom){
                this.SelNoteCrt();
            }else{
                let Goal = CrtPos;
                CrtPos = movefrom;
                if (CrtPos > Goal){
                    mvpos(4);
                }else{
                    mvpos(5);
                }
                CrtPos = Goal;
            }
        }
        this.print();
    };
    
    var UIhandler;//UI handler from outside the object (would become critical argument of constructor in API version)
    this.UIhandler = (UI) => {
        UIhandler = UI;
    };
    
    this.loading = (show) => { //delegate loading request to UIhandler
        UIhandler.loading(show);
    };
};

var MSOETest = new (function(target){
    for (let func of Object.getOwnPropertyNames(target).filter(function(p){
        return typeof target[p] === 'function';
    })) {
        this[func] = function(...args){
            target[func](...args);
            target.print();
        };
    }
})(MSOE);