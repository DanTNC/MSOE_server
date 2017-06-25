var edit_mode = () =>{
  $(".left").show();
  $(".panel-group").show();
  $("#print").hide();
  $("#play").hide();
  $("#share").hide();
  Edit=true;
  MSOE.print();
}
var preview_mode = () =>{
  $(".left").hide();
  $(".panel-group").hide();
  $("#print").show();
  $("#play").show();
  $("#share").show();
  Edit=false;
  MSOE.print();
}

