const host = "http://localhost:8080";
const sc_host = "https://api-v2.soundcloud.com";

var state = {
  index: 0,
  likes: null,
  likes_ids: null,
  playlists: null,
  dl: [],
  dled: [],
  log: "",
};
var ISUNSAVED = false;
var isSEARCH = false;
var overiFrame = -1; // hovered iframe
var focusiFrame = -1; // focused iframe
var is_show_popup = false;
var downloadUrl;
// var listen_later_id = 133219448;

function hooks() {
  // $("#download_file").click(saveFile);
  $("#input_goto_like").keydown(function (e) {
    if (e.keyCode == 13) {
      // ENTER
      goto_like_fn();
      document.activeElement.blur();
    }
  });
  popup_init();
  $("#reset_state")
    .on("mousedown", function () {
      $("#content").empty();
      loading();
    })
    .on("mouseup", function () {
      init(true);
    });
  $(window).blur(function () {
    if (document.activeElement.tagName === 'IFRAME') {
      setTimeout(function () {
        document.activeElement.blur();
      }, 100);
      // console.log("overiFrame",overiFrame);
      if (focusiFrame != overiFrame) {
        focusiFrame = overiFrame;
        let id = parseInt(focusiFrame.replace("iframe", ""));
        if (isSEARCH) {
          const idx = get_track_index_by_id(id);
          update_index(idx);
        } else {
          focus_to_like(id);
        }
      }
    }
  });
  $(document).keydown(keybinds);
}

$(document).ready(function () {
  hooks();
  autoplay_render();
  set_volume_slider(volume);
  return;
});
