function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

function alert_show(text = "", error = false) {
  loaded();
  if (error) {
    $("#alert").addClass("error");
  } else {
    $("#alert").removeClass("error");
  }
  text = String(text);
  text = text.replace(/\n/gi, "</br>");
  $("#alert-body").html(text);
  $("#alert").addClass("visible");
}

function alert_hide() {
  $("#alert").removeClass("visible");
}

function loading() {
  alert_hide();
  $(".loader").removeClass("none");
}

function loaded() {
  $(".loader").addClass("none");
}

function openFile() {
  document.getElementById("file_input").click();
}

function readFile(e) {
  loading();
  let file = e.target.files[0];
  if (!file) {
    // log("Error opening file!\n"+String(file),error=true)
    return;
  }
  let reader = new FileReader();
  reader.onload = function (e) {
    // console.log(e.target.result);
    try {
      state = JSON.parse(e.target.result);
    } catch (err) {
      log("Cannot open file!\n" + String(file.name), (error = true));
      $("#file_input").prop("value", "");
      return;
    }
    $("#file_input").prop("value", "");
    loaded();
    // log("Opened file.\n"+String(file.name),error=false)
    init();
    return;
  };
  reader.readAsText(file);
}

function saveFile() {
  loading();
  console.log(state);
  if (!!downloadUrl) {
    URL.revokeObjectURL(downloadUrl);
  }
  let file = new Blob([JSON.stringify(state)], { type: "application/json" });
  downloadUrl = URL.createObjectURL(file);
  $(this).attr("href", downloadUrl);
  let name_ = "state.json";
  if (!!state.is_filtered) {
    name_ = "state_filtered.json";
  }
  $(this).attr("download", name_);
  ISUNSAVED = false;
  loaded();
}

function openURLs() {
  document.getElementById("file_input_urls").click();
}

function read_file_promise(file) {
  return new Promise((resolve, reject) => {
    let fr = new FileReader();
    fr.onload = () => {
      resolve(fr.result);
    };
    fr.readAsText(file);
  });
}

function readURLs(e) {
  loading();
  if (!e.target.files.length) {
    // log("Error opening file!\n"+String(file),error=true)
    return;
  }
  let promises = []; // collect all promises
  let urls = [];
  // let reader = new FileReader();
  for (file of e.target.files) {
    promises.push(read_file_promise(file));
  }
  Promise.all(promises) // wait for the resolutions
    .then((results) => {
      for (let result of results) {
        // console.log(result);
        let url = result;
        url = url.replace(/\r\n/g, "\n");
        url = url.replace("[InternetShortcut]\nURL=", "");
        let newline_index = url.indexOf("\n");
        if (newline_index != -1) {
          url = url.slice(0, newline_index);
        }
        urls.push(url);
      }
      // console.log(urls)
      let done_fn = function (data) {
        if (data.kind == "playlist") {
          for (let track of data.tracks) {
            results.push(track.id);
          }
        } else {
          results.push(data.id);
        }
      };
      parallel(
        "resolve",
        "url",
        urls,
        done_fn,
        null,
        function (results, failed) {
          log(results);
          log(failed_urls);
          append_playlist(results);
          $("#file_input_urls").prop("value", "");
          loaded();
          log("loaded soundcloud urls", (error = false));
          // init()
          // return
        },
      );
    });
}

function insert_at_index(parent, i, element) {
  if (i === 0) {
    parent.prepend(element);
    return;
  }
  parent
    .children()
    .eq(i - 1)
    .after(element);
}

function array_equal(a1, a2) {
  return (
    a1.length === a2.length &&
    a1.every(function (value, index) {
      return value === a2[index];
    })
  );
}

function* range(start, end) {
  yield start;
  if (start === end) return;
  let step = start > end ? -1 : 1;
  yield* range(start + step, end);
}

function log(text, error = false) {
  if (error) {
    console.warn(text);
  } else {
    console.log(text);
  }
  alert_show(text, (error = !!error));

  let class_text = !!error ? "error" : "";
  let log_html = "<span class='" + class_text + "'>" + text + "</span></br>";
  log_html = log_html.replace(/\n/gi, "");
  log_html = log_html.replace(/<\/br>/gi, "");
  $("#log").prepend(log_html);
  state.log = state.log + log_html;
}

function sort_dict_prop_compare(key) {
  return function compare_Key(a, b) {
    a_key = a[key].toUpperCase();
    b_key = b[key].toUpperCase();
    if (a_key < b_key) {
      return -1;
    }
    if (a_key > b_key) {
      return 1;
    }
    return 0;
  };
}

function keybinds(e) {
  // alert_show(e.keyCode + " " + e.shiftKey)
  // return
  if (document.activeElement.id == "input_goto_like") {
    return;
  }
  if (document.activeElement.id == "search_likes") {
    if (e.keyCode == 13) {
      // ENTER
      document.activeElement.blur();
      search_likes();
    }
    return;
  }
  if (is_show_popup) {
    switch (e.keyCode) {
      case 27: // ESCAPE
        hide_popup();
        break;
    }
    return;
  }
  switch (e.keyCode) {
    case 27: // ESCAPE
      hide_popup();
    case 16: // SHIFT
      break;
    case 17: // CONTROL
      alert_hide();
      break;
    case "N".charCodeAt():
    case "S".charCodeAt():
    case 40: // DOWN
      if (e.shiftKey) {
        change_volume(false);
      } else {
        next_like();
      }
      break;
    case "B".charCodeAt():
    case "W".charCodeAt():
    case 38: // UP
      if (e.shiftKey) {
        change_volume(true);
      } else {
        prev_like();
      }
      break;
    case "A".charCodeAt():
    case 37: // LEFT
      if (e.shiftKey) {
        seek(false, 15000);
      } else {
        seek(false);
      }
      break;
    case "D".charCodeAt():
    case 39: // RIGHT
      if (e.shiftKey) {
        seek(true, 15000);
      } else {
        seek(true);
      }
      break;
    case 32: // SPACE
      toggle_play();
      break;
    case 109: // NUM-
      unlike(get_track_id_by_index(state.index));
      break;
    case 107: // NUM+
      add_to_any_playlist_fn(get_track_id_by_index(state.index));
      break;
    case 48 <= e.keyCode && e.keyCode <= 57: // 0-9
    case 96 <= e.keyCode && e.keyCode <= 105: // NUM0-9
      let offset;
      if (48 <= e.keyCode && e.keyCode <= 57) {
        offset = (e.keyCode - 48) / 10;
      } else {
        offset = (e.keyCode - 96) / 10;
      }
      if (e.shiftKey) {
        seek(true, offset);
      } else {
        const playlist = get_playlist_by_name(quick_playlists[offset]);
        const playlist_id = playlist.id;
        add_to_playlist(get_track_id_by_index(state.index), playlist_id);
      }
      break;
  }
}

function confirm_exit() {
  if (ISUNSAVED) return true;
}
