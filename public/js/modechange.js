var edit_mode = () =>{
  $(".left").show();
  $(".panel-group").show();
  $(".edit_line").show();
  $("#showpages").hide();
}
var preview_mode = () =>{
  $(".left").hide();
  $(".panel-group").hide();
  $(".edit_line").hide();
  $("#showpages").show();
}
var printpage = (a) => {
  var b = a.id;
  var p = '#boo' + b.substring(1) + '';
  console.log('b' + b);
  console.log('p' + p);
  $(".boo").hide();
  $(p).show();  
}
