var edit_mode = () =>{
  $("#infohome").removeClass("disabled").click(()=>{
    $('#modaldiv2').modal('setting', 'transition', 'vertical flip').modal('show');
  });
  $(".left").show();
  $(".panel-group").show();
  $(".panel-group-preview").hide();
  // $("#print").hide();
  // $("#play").hide();
  // $("#share").hide();
  $(".pre-but").hide();
  $(".edit-but").show();
  $("#edit").hide();
  $("#preview").show();
  MSOE.Edit_(true);
  MSOE.print();
}
var preview_mode = () =>{
  $("#infohome").addClass("disabled").off("click");
  $(".left").hide();
  $(".panel-group").hide();
  $(".panel-group-preview").show();
  // $("#print").show();
  // $("#play").show();
  // $("#share").show();
  $(".pre-but").show();
  $(".edit-but").hide();
  $("#edit").show();
  $("#preview").hide();
  MSOE.Edit_(false);
  MSOE.print();
}
