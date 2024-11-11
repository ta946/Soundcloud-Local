function popup_init() {
  $(".popup-close, .popup-overlay").on("click", function () {
    hide_popup();
  });
  $(".popup-body").on("click", function (e) {
    e.stopPropagation();
  });
}

function show_popup() {
  is_show_popup = true;
  $(".popup-overlay").addClass("active");
  $(".popup-overlay button").focus();
}

function hide_popup() {
  is_show_popup = false;
  $(".popup-overlay").removeClass("active");
  $(".popup-content").empty();
}
