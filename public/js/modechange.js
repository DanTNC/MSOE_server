var edit_mode = () =>{
  $(".left").show();
  $(".panel-group").show();
  $("#print").hide();
  $("#play").hide();
  $("#share").hide();
  MSOE.Edit_(true);
  MSOE.print();
}
var preview_mode = () =>{
  $(".left").hide();
  $(".panel-group").hide();
  $("#print").show();
  $("#play").show();
  $("#share").show();
  MSOE.Edit_(false);
  MSOE.print();
}

