/* global $, MSOE */

var edit_mode = () => {
  $(".left").show();
  $(".panel-group").show();
  $(".panel-group-preview").hide();
  $(".pre-but").hide();
  $(".edit-but").show();
  $("#edit").hide();
  $("#preview").show();
  MSOE.Edit_(true);
  if(!MSOE.unsave() || !MSOE.Edit_()){
    $("#discard").hide();
  }
  if(MSOE.playing == true){
    $(".abcjs-midi-reset").click();
    $(".abcjs-midi-start").click();
    ABCJS.stopAnimation();
    $("#play").text("Play");
    MSOE.playing == false;
  }
  MSOE.print();
};
var preview_mode = () => {
  $(".left").hide();
  $(".panel-group").hide();
  $(".panel-group-preview").show();
  $(".pre-but").show();
  $(".edit-but").hide();
  $("#edit").show();
  $("#preview").hide();
  MSOE.Edit_(false);
  MSOE.print();
};
