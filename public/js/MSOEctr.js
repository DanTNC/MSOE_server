var MSOE = new function msoe () {
	var abcstr="$"; //abcstring
	var Tstate=1; //0:A, 1:A  2:a  3:a'
	var Dstate=5; //Mn, n=0~8. n=5 for N=1, n+1=>N*2, n-1=>N/2. 1n=N*(1+1/2), 2n=N*(1+1/2+1/4)... and so on
	var CrtPos=0; //current position
	var abcjs=window.ABCJS;
	var ttlstr="";//title string
	//-----------------------------------------//for voices
	var abcindex=0;//index for abcstrings
	var vicchga;//Ath voice for VicChg;
	var maxoffset=0;//the maximum of offset
	var strs=[];//voices
	var clef=[];//clef of voices
	var tuneObjectArray;

  var page=[];
	clef[0]="treble";//default value
	this.AddVoice = () => {
		var temindex=clef.length;
		clef[temindex]="treble";
		strs[temindex]="$";
		SaveNLoad(temindex);
		
	};
	this.DelVoice = () => {
		if(clef.length==1) return;
		strs=strs.slice(0,abcindex).concat(strs.slice(abcindex+1));
		clef=clef.slice(0,abcindex).concat(clef.slice(abcindex+1));
		console.log(strs);
		console.log(clef);
		abcindex=0;
		abcstr=strs[0];
		CrtPos=0;
	}
	this.VicChgA = () => {
		vicchga=abcindex;
	}
	this.VicChgB = () => {
		if(vicchga===undefined) return;//if not pressed "r" before
		if(strs[vicchga]===undefined||strs[abcindex]===undefined||clef[vicchga]===undefined) return;//clef of current voice definitely exists
		strs[vicchga] = [ strs[abcindex], strs[abcindex] = strs[vicchga]] [0];//swap strs
		clef[vicchga] = [ clef[abcindex], clef[abcindex] = clef[vicchga]] [0];//swap clef
		abcindex=vicchga;		
	}
	var GetStrOffset = (ix) => {//get the length before the voice for highlight listener (ix: index)
		var sum=0;
		for(var i=0;i<ix+1;i++){
			sum+=12+(Math.floor(Math.log10(i+1))+1)+clef[i].length;
			if(i!=ix) sum+=rmsmb(strs[i],false).length+4;
		}
		maxoffset=rmsmb(abcstr,true).length+4;
		return sum;
	};
	var SaveNLoad = (j) => {//save and load (j: jump to)
		if(j>=clef.length) return;
		strs[abcindex]=abcstr;
		abcstr=strs[j];
		abcindex=j;
		CrtPos=0;
	};
  var start = 0;
  var p = 0;
	var ForPrint = () => {
		console.log(abcstr);
		console.log(clef.length);
		var finalstr="";
		for(var i=0;i<clef.length;i++){
			if(i!=abcindex){
				finalstr+="V: "+(i+1)+" clef="+clef[i]+"\n[|"+rmsmb(strs[i],false)+" |]\n";
			}else{
        var strrr = abcstr.substring(start);
				finalstr+="V: "+(i+1)+" clef="+clef[i]+"\n[|"+rmsmb(strrr,Edit)+" |]\n";
			}
		}
    var N = 0;
    for(var i=0;i<finalstr.length;i++){
      if(finalstr.charAt(i) == '\n'){
        N++;
      }
    }
    if((N - 2) % 4 == 0 && N != 2){
      page[p] = finalstr;
      p++;
      finalstr = "";
      start = abcstr.length;  
      $('#pg').text("第" + (p + 1) + "頁");
      var pgstr = '<button class="pagebutton" id="p' +  (p + 1) + ' onclick="">' +  (p + 1) + '</button>';
      $("#showpages").append(pgstr);
    }
		console.log(finalstr);
		return finalstr;
	};
	//-----------------------------------------//for clef
	var clefmode=false;
	this.ClfMdTgl = () => {//toggle clefmode
		clefmode=!clefmode;
	};
	this.ClfOrVic = (kc) => {
		if(clefmode){
			switch(kc){
				case 49:
					clef[abcindex]="treble";
					break;
				case 50:
					clef[abcindex]="alto middle=C";
					break;
				case 51:
					clef[abcindex]="tenor middle=A";
					break;
				case 52:
					clef[abcindex]="bass,,";
					break;
				default:
			}
		}else{
			SaveNLoad(kc-49);
		}
	};
	//-----------------------------------------//
	this.print = () => {//output svg
		tuneObjectArray = abcjs.renderAbc('boo',"T: "+ttlstr+"\nM: "+tmpstr+"\nL: "+Lstr+"\n"+ForPrint(),{},{add_classes:true, editable:true, listener:{highlight:(abcElem)=>{//update CrtPos when note is clicked
			console.log(abcElem.startChar);
			var ignsmbs=["$","#","*"];//symbols that won't be in the final abcstring
			var NumBefCrt=0;//number of chars before current position
			for(var i=1;i<(mvpos(1)==CrtPos?abcstr.length:mvpos(1));i++){
				if(!ignsmbs.includes(abcstr[i])){
					NumBefCrt++;
				}
			}
			console.log(NumBefCrt);
			var offset=abcElem.startChar-11-ttlstr.length-tmpstr.length-Lstr.length-GetStrOffset(abcindex);
			console.log(offset);
			if((offset<0)||(offset>maxoffset)) return;
			if(offset>NumBefCrt+10+String(numtostr(Math.pow(2,Dstate%10-4)*(1-Math.pow(1/2,Math.floor(Dstate/10)+1)))).length){//if after the cursor, - the string length of cursor
				offset-=(10+String(numtostr(Math.pow(2,Dstate%10-4)*(1-Math.pow(1/2,Math.floor(Dstate/10)+1)))).length);
			}else if(offset==NumBefCrt+1){
				return;
			}
			if(offset==0){
				CrtPos=0;
				this.print();
				return;
			}
			for(var i=0;i<abcstr.length;i++){
				if(!ignsmbs.includes(abcstr[i])){
					if(offset!=1){
						offset--;
					}else if(abcstr[i]!="["){
						CrtPos=i-1;
						this.print();
						return;
					}else{//for chord
						CrtPos=i-2;
						this.print();
						return;
					}
				}
			}
	  	}}});
	};
	this.chgttl = (a) => {//update title
		if(!Edit) return;
		ttlstr=a.value;
		this.print();
	};
	var tmpstr="";//tempo string
	var Lstr="1/4";
	this.chgtmp = (a) => {//update tempo
		if(!Edit) return;
		if(a.value.length==2) a.value=a.value[0]+"/"+a.value[1];//if user is lazy and inputs, for example, 44 for 4/4, add "/" for the lazy guy
		tmpstr=a.value;
		for(var i=0;i<tmpstr.length;i++){
			if(tmpstr[i]=="/"){
				Lstr="1/"+tmpstr.substring(i+1);
				break;
			}
		}
		if(a.value=="") Lstr="1/4";
		this.print();
	};
	var tonum = (str) => {
		var Dnmntr=0;//denominator
		var Nmrtr=0;//numerator
		for(var i=0;i<str.length;i++){
			if(str[i]=="/"){
				Nmrtr=parseInt(str.substring(0,i));
				Dnmntr=parseInt(str.substring(i+1));
				return Nmrtr/Dnmntr;
			}
		}
		return parseInt(str);
	};
	var checkbar = () => {//add bar automatically
		var SofD=0;//sum of duration
		var temD="";//temparary duration
		var ChFm=mvpos(1);//check from
		var MaxD;//the max duration between bars

		for(var i=0;i<tmpstr.length;i++){
			if(tmpstr[i]=="/"){
				MaxD=parseInt(tmpstr.substring(0,i));
				break;
			}
		}
		if(tmpstr=="") MaxD=4;

		if(abcstr[CrtPos+1]==="|") return;
		if(ChFm==CrtPos){
			ChFm=abcstr.length;
		}else if(abcstr[ChFm+1]=="|"){
			return;
		}
		var Cntin=true;//counting
		for(var i=ChFm-1;i>0;i--){
			if(abcstr[i]=="|") break;
			if(abcstr[i]=="\n" || abcstr[i]=="]" || abcstr[i]=="[") continue;
			if(abcstr[i]=="$"){
				if(abcstr[i-1]=="\n"){//the beginning of a line(not the first line)
					break;
				}else{
					Cntin=true;
					continue;
				}
			}
			if(abcstr[i]=="*"&&Cntin){//sum every note
				Cntin=false;
				if(temD=="") temD="1";
				SofD=SofD+tonum(temD);
				temD="";
				continue;
			}
			if(Cntin){
				temD=abcstr[i]+temD;
			}
		}

		if(SofD>=MaxD){
			insert("|",0);
		}
	};
	var mvpos = (md) => {
		if(md==0){//0: move to the right note (not change if on the first note)
			for(var i=CrtPos-1;i>=0;i--){
				if(abcstr[i]=="$"){
					return i;
				}
			}
		}
		if(md==1){//1: move to the left note(not change if on the last note)
			for(var i=CrtPos+1;i<=abcstr.length;i++){
				if(abcstr[i]=="$"){
					return i;
				}
			}
		}
		if(md==2){//2: move to the last note of the upper line(not change if on the first line)
    		for(var i=CrtPos-1;i>=0;i--){
      			if(abcstr[i]=="\n"){
        			for(var j=i-1;j>=0;j--){
          				if(abcstr[j]=="$"){
            				return j;
          				}
        			}
      			}
    		}
  		}
  		if(md==3){//3: move to the first note of the lower line(not change if on the last line)
    		for(var i=CrtPos+1;i<=abcstr.length;i++){
      			if(abcstr[i]=="\n"){
        			for(var j=i+1;j<=abcstr.length;j++){
          				if(abcstr[j]=="$"){
            				return j;
          				}
        			}
      			}
    		}
  		}
		if(md==4){//4: move to the first note of this line
			while(CrtPos!=0 && abcstr[CrtPos-1]!="\n"){
				CrtPos=mvpos(0);
			}
			return;
		}
		if(md==5){//5: move to the last note of this line
			while(mvpos(1)!=CrtPos && abcstr[mvpos(1)-1]!="\n"){
				CrtPos=mvpos(1);
			}
			return;
		}
		return CrtPos;
	};
	var numtostr = (num) => {//transform a float to a string in fraction form(for duration of a note)
		if(!Number.isInteger(num)){//if num is a integer, return it and it will be transformed to string automatically
			var Dnmntr=0;//denominator
			var Nmrtr=0;//numerator
			do{
		  		num*=2;
		  		Dnmntr++;
			}while(!Number.isInteger(num));
			Dnmntr=Math.pow(2,Dnmntr);
			Nmrtr=num;
			num=Nmrtr+"/"+Dnmntr;
	  	}
	  	if(num===1){//1 doesn't need to be noted in abcstring
			num="";
	  	}
	  	return num;
	};
	this.miditone = (ch,inc) => {
		var temnum;
		var code=ch.charCodeAt(0);
		if(code>=97) code-=32;
		switch(code){
			case 65:
				temnum=9+inc;
				break;
			case 66:
				temnum=11+inc;
				break;
			case 67:
				temnum=0+inc;
				break;
			case 68:
				temnum=2+inc;
				break;
			case 69:
				temnum=4+inc;
				break;
			case 70:
				temnum=5+inc;
				break;
			case 71:
				temnum=7+inc;
				break;
		}
		console.log(48+(Tstate)*12+temnum);
		return 48+(Tstate)*12+temnum;
	};
	var toabcnote = (ch) => {//generate a string for a note in ABC format
		if(ch!="z"){//pause has no tune
			switch(Tstate){//for tunes
		  	case 0:
		   		ch=ch+",";
		   		break;
		 	case 3:
		   		ch=String.fromCharCode(ch.charCodeAt(0)+32)+"'";
		   		break;
		 	case 2:
		   		ch=String.fromCharCode(ch.charCodeAt(0)+32);
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
	  	ch=ch+"*"+numtostr(Math.pow(2,Dstate%10-4)*(1-Math.pow(1/2,Math.floor(Dstate/10)+1)));
	  	return ch;
	};
	var insert = (str,md) => {//insert string in the right position. mode=1 for notations not occupying a position
		var InsBef=mvpos(1);//insert before
		if(InsBef!=CrtPos){//not the last note
		if(abcstr[InsBef-1]=="\n")//if on the position before a "\n", insert before "\n"
			InsBef--;
			abcstr=abcstr.substring(0,InsBef)+(md!=1?"$":"")+str+abcstr.substring(InsBef);
	  	}else{
			abcstr=abcstr+(md!=1?"$":"")+str;//append
	  	}
	  	CrtPos=(md!=1)?mvpos(1):CrtPos;
	  	console.log(abcstr);
	};
	var insertch = (str) => {//insert for chord
		for(var i=mvpos(1)+2;i<abcstr.length;i++){
			if(abcstr[i]=="]"){
			 	abcstr=abcstr.substring(0,i)+str+abcstr.substring(i);
			 	return;
			}
		}
	};		
	var rmsmb = (str,cursor) => {//remove symbols should not be in the final abcstring
		var Ins=mvpos(1);
		if(Ins==CrtPos) Ins=abcstr.length;
		if(abcstr[Ins-1]=="\n") Ins--;
		if(cursor){
			str=str.substring(0,Ins)+"!style=x!G"+numtostr(Math.pow(2,Dstate%10-4)*(1-Math.pow(1/2,Math.floor(Dstate/10)+1)))+str.substring(Ins);
		}
		console.log("after rmsmb:"+str);
		return str.replace(/[*]|[$]|[#]/g,"");
	};
	this.msg = null;
    this.save = function(e) {
  		var url = location.href.split("?")[1];
  		var urlIndex = "";
  		var urlKey = "";
        var insert = false;
        var pointer = this;
  		if(url != null) {
            insert = false;
            console.log("update");
    		urlIndex = url.split("!")[1];
    		urlKey = url.split("!")[2];
            
            if(urlIndex == null) urlIndex = "";
            if(urlKey == null) urlKey = "";
  		}
        else {
            console.log("insert");
            insert = true;
        }
  		if(history.pushState) {
    
    		e.preventDefault();
    		$.ajax( {
   	   				url: "/save",
                    method: 'POST',
    				async: false,
      				data: {
					cmpstr: "",
                    ttlstr: ttlstr,
					tmpstr: tmpstr,
					abcstr: abcstr,           
                    abcindex: 0,
                    Lstr: "",
                    strs: null,
                    clef: null,
					index: urlIndex,
					key: urlKey,
                    insert: insert,
				},
				success: function(rcvData) {
                    console.log(rcvData);
                    pointer.msg = rcvData;
					//rcvUrl += rcvData;
				},
				error: function() {
					console.log('connect to save.njs failed');
				}
			});
            /*
			if(push) {
				history.pushState( {title: ""}, "", location.href.split("?")[0]+"?"+rcvUrl);
				url = rcvUrl;
			}
			document.getElementById("url").setAttribute('value', location.href.split("?")[0]+"?"+rcvUrl);  
            */
		}
		else {
			console.log("web brower doesn't support history api");
		}
	};
	this.urlload=()=>{
        var pointer = this;
		var url = location.href.split("?")[1];
		if(url != null) {
			var urlIndex = url.split("!")[1];
			var urlKey = url.split("!")[2];

			var check = true;

			if(urlIndex == null)
			{
				urlIndex = "";
				check = false;
			}
			if(urlKey == null)
			{
				urlKey = "";
			}

			if(urlIndex.length != 0 && check)
			{
				$.ajax( {
					url: "/load",
                    method: 'POST',
					async: false,
					data: {
						index: urlIndex,
						key: urlKey,
					},
					success: function(rcvData) {
                        console.log(rcvData);
                        pointer.msg = rcvData;
                    /*
					MSOE.ttlstr=rcvData.split("!")[0]; 
					MSOE.tmpstr=rcvData.split("!")[1];
					MSOE.abcstr=rcvData.split("!")[2];
					if(rcvData.trim().length < 4)
						window.location.replace("http://luffy.ee.ncku.edu.tw/~lin11220206/MSOE/");
					else
					{
						$(function () { $('#myModal').modal({
						keyboard: false,
						show: false
						})});
					}*/
					},
					error: function(){
						console.log("connect to load.njs failed");
					}
				});
			}
			else
				window.location.replace("http://luffy.ee.ncku.edu.tw/~lin11220206/MSOE/");
		}
		else
		{
			$(function () { $('#myModal').modal({
				keyboard: false
			})});
		}
	};
	this.outinsert = (ch,Toabcnote,md,Checkbar) => {
		var legalchars = ["A","B","C","D","E","F","G","z"," ","|","_","^"];
		if(!legalchars.includes(ch)) return;
		if(Toabcnote==1){
			insert(toabcnote(ch),md);
		}else{
			insert(ch,md);
		}
		if(Checkbar==1) checkbar();
	};
	this.outinsertch = (ch) => {
		var legalchars = ["A","B","C","D","E","F","G"];
		if(!legalchars.includes(ch)) return;
		insertch(toabcnote(ch));
	};
	this.ChgDstate = (md) => {
		switch(md){
			case 0:
				Dstate=(Dstate%10==0)?8:Dstate-1;
				break;
			case 1:
				Dstate=(Dstate%10==8)?0:Dstate+1;
				break;
			case 2:
				if((Math.floor(Dstate/10))!=0)
					Dstate=Dstate-10;
				break;
			case 3:
				Dstate=Dstate+10;
				break;
			default:
		}
	};
	this.ChgTstate = (md) => {
		if(md==0) Tstate=(Tstate==3)?0:Tstate+1;
		else if(md==1) Tstate=(Tstate==0)?3:Tstate-1;
		return Tstate;
	};
	this.separate = () => {
		if(CrtPos==0||abcstr[CrtPos-1]=="\n"||CrtPos==1||abcstr[CrtPos-1]=="$") return;
		if(abcstr[CrtPos-1]!=" "){
			abcstr=abcstr.substring(0,CrtPos)+" "+abcstr.substring(CrtPos);
			CrtPos++;
		}
	};
	this.assemble = () => {
		if(CrtPos==0||abcstr[CrtPos-1]=="\n"||CrtPos==1||abcstr[CrtPos-1]=="$") return;
      	if(abcstr[CrtPos-1]==" "){
			abcstr=abcstr.substring(0,CrtPos-1)+abcstr.substring(CrtPos);
			CrtPos--;
		}
	};
	this.tie = () => {
		if(CrtPos==0||abcstr[CrtPos-1]=="\n"||CrtPos==1||abcstr[CrtPos-1]=="$") return;
		if(abcstr[CrtPos-1]!="-"){
			abcstr=abcstr.substring(0,CrtPos)+"-"+abcstr.substring(CrtPos);
			CrtPos++;
		}
	};
	this.untie = () => {
		if(CrtPos==0||abcstr[CrtPos-1]=="\n"||CrtPos==1||abcstr[CrtPos-1]=="$") return;
      	if(abcstr[CrtPos-1]=="-"){
			abcstr=abcstr.substring(0,CrtPos-1)+abcstr.substring(CrtPos);
			CrtPos--;
		}
	};
	this.accidental = (md) => {
		if(md==0){
			if(CrtPos!=0 && abcstr[CrtPos-1]!="\n" && abcstr[CrtPos+1]!="|" && abcstr[CrtPos+1]!="#"){
        		if(abcstr[CrtPos+2]!="^"){//only allow 2 #s
          			if(abcstr[CrtPos+1]!="_"){
           				abcstr=abcstr.substring(0,CrtPos+1)+"^"+abcstr.substring(CrtPos+1);
						if(abcstr[CrtPos+2]=="^") this.miditone(abcstr[CrtPos+3],2);
						else this.miditone(abcstr[CrtPos+2],1);
         			}else{//if b exists, delete one b
           				abcstr=abcstr.substring(0,CrtPos+1)+abcstr.substring(CrtPos+2);
						if(abcstr[CrtPos+1]=="_") this.miditone(abcstr[CrtPos+2],-1);
						else this.miditone(abcstr[CrtPos+1],0);
         			}
        		}
      		}
		}else if(md==1){
			if(CrtPos!=0 && abcstr[CrtPos-1]!="\n" && abcstr[CrtPos+1]!="|" && abcstr[CrtPos+1]!="#"){
        		if(abcstr[CrtPos+2]!="_"){//only allow 2 bs
          			if(abcstr[CrtPos+1]!="^"){
            			abcstr=abcstr.substring(0,CrtPos+1)+"_"+abcstr.substring(CrtPos+1);
						if(abcstr[CrtPos+2]=="_") this.miditone(abcstr[CrtPos+3],-2);
						else this.miditone(abcstr[CrtPos+2],-1);
          			}else{//if # exists, delete one #
            			abcstr=abcstr.substring(0,CrtPos+1)+abcstr.substring(CrtPos+2);
						if(abcstr[CrtPos+1]=="^") this.miditone(abcstr[CrtPos+2],1);
						else this.miditone(abcstr[CrtPos+1],0);
         			}
        		}
      		}
		}else if(md==2){
			var ChEnd;//chord end
			var LstNt;//last note of this chord
			var NtChs = ["a","b","c","d","e","f","g","A","B","C","D","E","F","G"];//possible note chars
			for(var i=mvpos(1)+2;i<abcstr.length;i++){
				if(abcstr[i]=="]"){
					ChEnd=i;
					break;
				}
				if(i==abcstr.length-1) return;
			}
			for(var i=ChEnd-1;i>mvpos(1);i--){
				if(NtChs.includes(abcstr[i])){
					LstNt=i-1;
					break;
				}
				if(i==mvpos(1)+1) return;
			}
        	if(!(abcstr[LstNt]=="^" && abcstr[LstNt-1]=="^")){//only allow 2 #s
          		if(abcstr[LstNt]!="_"){
           			abcstr=abcstr.substring(0,LstNt+1)+"^"+abcstr.substring(LstNt+1);
					if(abcstr[LstNt]=="^") this.miditone(abcstr[LstNt+2],2);
					else this.miditone(abcstr[LstNt+2],1);
         		}else{//if b exists, delete one b
           			abcstr=abcstr.substring(0,LstNt)+abcstr.substring(LstNt+1);
					if(abcstr[LstNt-1]=="_") this.miditone(abcstr[LstNt],-1);
					else this.miditone(abcstr[LstNt],0);
         		}
        	}
		}else if(md==3){
			var ChEnd;//chord end
			var LstNt;//last note of this chord
			var NtChs = ["a","b","c","d","e","f","g","A","B","C","D","E","F","G"];//possible note chars
			for(var i=mvpos(1)+2;i<abcstr.length;i++){
				if(abcstr[i]=="]"){
					ChEnd=i;
					break;
				}
				if(i==abcstr.length-1) return;
			}
			for(var i=ChEnd-1;i>mvpos(1);i--){
				if(NtChs.includes(abcstr[i])){
					LstNt=i-1;
					break;
				}
				if(i==mvpos(1)+1) return;
			}
			if(!(abcstr[LstNt]=="_" && abcstr[LstNt-1]=="_")){//only allow 2 bs
          		if(abcstr[LstNt]!="^"){
           			abcstr=abcstr.substring(0,LstNt+1)+"_"+abcstr.substring(LstNt+1);
					if(abcstr[LstNt]=="_") this.miditone(abcstr[LstNt+2],-2);
					else this.miditone(abcstr[LstNt+2],-1);
         		}else{//if b exists, delete one b
           			abcstr=abcstr.substring(0,LstNt)+abcstr.substring(LstNt+1);
					if(abcstr[LstNt-1]=="^") this.miditone(abcstr[LstNt],1);
					else this.miditone(abcstr[LstNt],0);
         		}
        	}
		}
	};
	this.newline = () => {
		if(CrtPos!=0 && abcstr[CrtPos-1]!="\n"){//ABCJS doesn't allow 2 "\n"s in series
      			insert("\n$",1);
      			CrtPos=mvpos(1);
			}
	};
	var CpMd=false; //copy mode
	var CpStP=0; //copy startpoint
	var CpStr=""; //copy string
	this.copymode = () => {
		if(CpMd){
			CpMd=false;
        	var CpEdP=CrtPos;//copy end point
        	if(CrtPos<CpStP){//if the end is on the left of the startpoint, swap their values.
          		CpEdP=CpStP;
          		CpStP=CrtPos;
        	}
        	if(CpStP==0 || abcstr[CpStP-1]=="\n"){//don't copy the extra "$" of the startpoint of every line;
          		CpStP++;
        	}
        	var CpStrEd=CpEdP;//copy string end point
        	for(var i=CpEdP+1;i<=abcstr.length;i++){
			   	if(abcstr[i]=="$"){
			    	CpStrEd=i;
			    	break;
		    	}
	    	}
        	if(CpStrEd==CpEdP){
          		CpStr=abcstr.substring(CpStP);
        	}else{
          		CpStr=abcstr.substring(CpStP,CpStrEd);
        	}
		}else{
			CpMd=true;
			CpStP=CrtPos;
		}
	};
	this.copycancel = () => {
		if(CpMd){
			CpMd=false;
		}
	};
	this.paste = () => {
		if(mvpos(1)==CrtPos){
				abcstr=abcstr+CpStr;
				CrtPos=abcstr.length-1;
			}else{
				abcstr=abcstr.substring(0,mvpos(1))+CpStr+abcstr.substring(mvpos(1));
				CrtPos=mvpos(1)+CpStr.length;
				CrtPos=mvpos(0);
			}
	};
	this.outmove = (md) => {
		CrtPos=mvpos(md);
	};
	this.outmove2 = (md) => {
		mvpos(md);
	};
	this.del = () => {
		if(CrtPos!=0){//if not the start of abcstring
			if(abcstr[CrtPos-1]!="\n"){//deleting notes
				var DelEnd=mvpos(1);//delete end
				var Latter="";
				if(DelEnd!=CrtPos){//if not the last note
					if(abcstr[DelEnd-1]=="\n")//if on the position before a "\n", keep "\n" in Latter
						DelEnd--;
					Latter=abcstr.substring(DelEnd);
				}
				abcstr=abcstr.substring(0,CrtPos)+Latter;
				CrtPos=mvpos(0);
			}else{//deleting "\n"
				var NxtPos=mvpos(0);//next position
				if(abcstr[CrtPos-1]=="\n"){
					abcstr=abcstr.substring(0,CrtPos-1)+abcstr.substring(CrtPos+1);
					CrtPos=NxtPos;
				}
			}
		}
		console.log(CrtPos);
		console.log(abcstr);
	};
	this.chmodeon = () => {
		var InsBef=mvpos(1);//insert before
    	if((InsBef==CrtPos)||(abcstr[InsBef+1]!="[")){
      		insert("$[]",1);
    	}
	};
	this.chmodeoff = (k) => {
		if(k==16){//"shift" for chord mode off
			if(abcstr.substr(mvpos(1),3)==="$[]"){//if no notes are inserted
				abcstr=abcstr.substring(0,mvpos(1))+abcstr.substring(mvpos(1)+3);
			}else if(abcstr.substr(mvpos(1),2)==="$["){
				abcstr=abcstr.substring(0,mvpos(1)+1)+"#"+abcstr.substring(mvpos(1)+1);
				CrtPos=mvpos(1);
			}
			checkbar();
			this.print();
  		}
	};
	this.checkpause = () => {
		return (Math.pow(2,Dstate%10-5)*eval(Lstr)>=2);
	}
}

//var MSOE = new msoe();
var Edit = true; //if it's editable


$("#DDDD").click(function(){
  if(!MSOE.checkpause()){//Pause with duration of 8 is illegal
	MSOE.outinsert("z",1,0,1);
  }else{
    alert("Pause with duration of 2 is illegal.");
  }
});


var checkinput = () => {//if input tags are focused, turn off key events
	let myArray = Array.from(document.getElementsByTagName("input"));
 	if(myArray.includes(document.activeElement))
    	return true;
  	else
    	return false;
};

var moveright = () => {
	var x0 = $('#quarter2').position().left;
	var x1 = $('#sixty-fourth').position().left;
	var x2 = $('#thirty-second').position().left;
	var x3 = $('#sixteenth').position().left;
	var x4 = $('#eighth').position().left;
	var x5 = $('#quarter').position().left;
	var x6 = $('#half').position().left;
	var x7 = $('#whole').position().left;
	var x8 = $('#breve').position().left;
	$('#quarter2').css('left', x1);
	$('#sixty-fourth').css('left', x2);
	$('#thirty-second').css('left', x3);
	$('#sixteenth').css('left', x4);
	$('#eighth').css('left', x5);
	$('#quarter').css('left', x6);
	$('#half').css('left', x7);
	$('#whole').css('left', x8);
	$('#breve').css('left', x0);
}

var moveleft = () => {
	var x0 = $('#quarter2').position().left;
  	var x1 = $('#sixty-fourth').position().left;
  	var x2 = $('#thirty-second').position().left;
  	var x3 = $('#sixteenth').position().left;
  	var x4 = $('#eighth').position().left;
  	var x5 = $('#quarter').position().left;
  	var x6 = $('#half').position().left;
  	var x7 = $('#whole').position().left;
  	var x8 = $('#breve').position().left;
  	$('#quarter2').css('left', x8);
  	$('#sixty-fourth').css('left', x0);
  	$('#thirty-second').css('left', x1);
  	$('#sixteenth').css('left', x2);
  	$('#eighth').css('left', x3);
  	$('#quarter').css('left', x4);
  	$('#half').css('left', x5);
  	$('#whole').css('left', x6);
  	$('#breve').css('left', x7);
}

var key = () => { // only keypress can tell if "shift" is pressed at the same time
  	if(checkinput()) return;
	if(event.keyCode==101){
		Edit=!Edit;
		MSOE.print();
		return;
	}
  	if(!Edit) return;
	switch(event.keyCode){
		case 44://"<"
			MSOE.ChgDstate(0);
        	moveright();
			break;
		case 46://">"
			MSOE.ChgDstate(1);
        	moveleft();
			break;
		case 60://"shift+>"
			MSOE.ChgDstate(2);
			break;
		case 62://"shift+<"
			MSOE.ChgDstate(3);
			break;
	// ----------Change Dstate-----------
    	case 63://"shift+?" for chord mode
    	case 47://"?"
      		document.getElementById("octave").innerHTML=(MSOE.ChgTstate(0)+3);
      		break;
    	case 34://"shift+'" for chord mode
    	case 39://"'" 
      		document.getElementById("octave").innerHTML=(MSOE.ChgTstate(1)+3);
      		break;
	// ----------Change Tstate-----------
    	case 122://"Z"
      		MSOE.outinsert("C",1,0,1);
		console.log(MSOE.miditone("C",0));
      		highlight("#C");
      		break;
    	case 120://"X"
      		MSOE.outinsert("D",1,0,1);
			MSOE.miditone("D",0);
      		highlight("#D");
      		break;
    	case 99://"C"
      		MSOE.outinsert("E",1,0,1);
			MSOE.miditone("E",0);
      		highlight("#E");
      		break;
    	case 118://"V"
      		MSOE.outinsert("F",1,0,1);
			MSOE.miditone("F",0);
      		highlight("#F");
      		break;
    	case 98://"B"
      		MSOE.outinsert("G",1,0,1);
			MSOE.miditone("G",0);
      		highlight("#G");
      		break;
    	case 110://"N"
      		MSOE.outinsert("A",1,0,1);
			MSOE.miditone("A",0);
      		highlight("#A");
      		break;
    	case 109://"M"
      		MSOE.outinsert("B",1,0,1);
			MSOE.miditone("B",0);
      		highlight("#B");
      		break;
  // ----------Insert Note------------
		case 115://"S"
      		MSOE.separate();
      		break;
  // ----------Seperate Notes---------
    	case 97://"A"
      		MSOE.assemble();
      		break;
  // ----------Assemble Notes---------
    	case 100://"D"
      		if(!MSOE.checkpause()){//Pause with duration of 8 is illegal
			MSOE.outinsert("z",1,0,1);
      		}else{
        		alert("Pause with duration of 2 is illegal.");
      		}
      		break;
  // ----------Insert Pause-----------
    	case 92://"|"
      		MSOE.outinsert("|",0,0,0);
      		break;
  // ----------Insert Bar-------------
    	case 93://"]" for #
			MSOE.accidental(0);
      		break;
    	case 91://"[" for b
      		MSOE.accidental(1);
      		break;
		case 125://"shift+[" for #(chord mode)
			MSOE.accidental(2);
			break;
		case 123://"shift+]" for b(chord mode)
			MSOE.accidental(3);
			break;
  // ----------Accidental-------------
    	case 90://"shift+Z"
			MSOE.outinsertch("C");
			MSOE.miditone("C",0);
      		break;
    	case 88://"shift+X"
      		MSOE.outinsertch("D");
			MSOE.miditone("D",0);
      		break;
    	case 67://"shift+C"
      		MSOE.outinsertch("E");
			MSOE.miditone("E",0);
      		break;
    	case 86://"shift+V"
      		MSOE.outinsertch("F");
			MSOE.miditone("F",0);
      		break;
    	case 66://"shift+B"
      		MSOE.outinsertch("G");
			MSOE.miditone("G",0);
      		break;
    	case 78://"shift+N"
      		MSOE.outinsertch("A");
			MSOE.miditone("A",0);
      		break;
    	case 77://"shift+M"
      		MSOE.outinsertch("B");
			MSOE.miditone("B",0);
      		break;
  // ----------Chord Mode-------------
    	case 13://"enter"
			MSOE.newline();
      		break;
  // ----------New Line---------------
		case 70://"shift+f" turn on and off copy mode
			MSOE.copymode();
      		break;
		case 102://"f" cancel copy mode(when it's on)
			MSOE.copycancel();
			break;
		case 103://"g" paste
			MSOE.paste();
			break;
  // ----------Copy Mode--------------
		case 113://"q" toggle clef setting mode
			MSOE.ClfMdTgl();
			break;
		case 49://"1" set clef to treble or jump to 1st voice
			MSOE.ClfOrVic(49);
			break;
		case 50://"2" set clef to alto or jump to 2nd voice
			MSOE.ClfOrVic(50);
			break;
		case 51://"3" set clef to tenor or jump to 3rd voice
			MSOE.ClfOrVic(51);
			break;
		case 52://"4" set clef to bass or jump to 4th voice
			MSOE.ClfOrVic(52);
			break;
		case 53://"5" jump to 5th voice
			MSOE.ClfOrVic(53);
			break;
		case 54://"6" jump to 6th voice
			MSOE.ClfOrVic(54);
			break;
		case 119://"w" add a voice
			MSOE.AddVoice();
			break;
		case 87://"shift+w" delete current voice
			MSOE.DelVoice();
			break;
		case 114://"r" swap two voices (mark current voice to be one of them)
			MSOE.VicChgA();
			break;
		case 82://"shift+r" swap two voices (swap current voice and the one marked before)
			MSOE.VicChgB();
			break;
  // ----------Clef and Voice----------
		case 116://"t" use browser printer to print the sheet (can save as pdf)
			printJS('boo','html');
			break;
  // ----------Print (as pdf)----------
		case 45://"-" tie two notes
			MSOE.tie();
			break;
		case 61://"=" untie
			MSOE.untie();
			break;
  // ----------Tie and Untie-----------
    	default:
	}
	console.log(event.keyCode);
	MSOE.print();
};

var move = () => { // some keys can't be detected in keypress
	if(checkinput()) return;//if inpus tags are focus, turn off key events
  	if(!Edit) return;
	//not using switch for speed(avoid looking up table)
	if(event.keyCode==37){//"left"
		MSOE.outmove(0);
	}
	if(event.keyCode==39){//"right"
		MSOE.outmove(1);
	}
  	if(event.keyCode==38){//"up"
    	MSOE.outmove(2);
  	}
  	if(event.keyCode==40){//"down"
    	MSOE.outmove(3);
  	}
	if(event.keyCode==36){//"home"
    	MSOE.outmove2(4);
  	}
	if(event.keyCode==35){//"end"
    	MSOE.outmove2(5);
  	}
  	if(event.keyCode==8){//"backspace"
		MSOE.del();
  	}
  	if(event.keyCode==16){//"shift" for chord mode on
    	MSOE.chmodeon();
  	}
	MSOE.print();
};

var chord = () => {//keyup event for chord mode
  	if(checkinput()) return;
  	if(!Edit) return;
  	MSOE.chmodeoff(event.keyCode);
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

var btn = (a) => {//buttons for notes
	MSOE.outinsert(a.id,1,0,1);
	MSOE.miditone(a.id,0);
  	MSOE.print();
  	highlight(a);
};

var chgtmp = (a) => {MSOE.chgtmp(a)};
var chgttl = (a) => {MSOE.chgttl(a)};

$("#save").click(function(e){MSOE.save(e)});

$(document).ready(function (){
	MSOE.urlload();
	MSOE.print();
	document.onkeypress=key;
 	document.onkeydown=move;
    window.ABCJS.midi.soundfontUrl = "soundfonts/";
    window.ABCJS.midi.instruments = "acoustic_grand_piano-ogg.js";
    document.onkeyup=chord;
    $("#showpages").hide();
});
