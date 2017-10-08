var edit_mode = () =>{
  $("#infohome").removeClass("disabled").click(()=>{
    $('#modaldiv2').modal('setting', 'transition', 'vertical flip').modal('show');
  });
  $(".left").show();
  $(".panel-group").show();
  $("#print").hide();
  $("#play").hide();
  $("#share").hide();
  $("#edit").hide();
  $("#preview").show();
  MSOE.Edit_(true);
  MSOE.print();
}
var preview_mode = () =>{
  $("#infohome").addClass("disabled").off("click");
  $(".left").hide();
  $(".panel-group").hide();
  $("#print").show();
  $("#play").show();
  $("#share").show();
  $("#edit").show();
  $("#preview").hide();
  MSOE.Edit_(false);
  MSOE.print();
}

