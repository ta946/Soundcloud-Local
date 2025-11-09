function init(force = false) {
  reset_flags();
  $("#content").empty();
  loading();
  if (force || !state.likes || !state.likes_ids) {
    get_likes();
  }
  if (force || !state.playlists) {
    get_playlists();
  }
  loaded();

  $("#log").html(state.log);
  if (state.index < 0) {
    update_index(0);
  } else if (state.index > state.likes.length - 1) {
    update_index(state.likes.length - 1);
  }
  if (!(0 <= state.index && state.index <= state.likes.length - 1)) {
    update_index(0);
  }
  goto_like(next_unassigned()); // render likes
}

function init_filter_playlist(force = false) {
  if (force || !state.likes || !state.likes_ids) {
    get_likes();
  }
  if (force || !state.playlists) {
    get_playlists();
  }
  let html = create_add_to_any_playlist_popup_html(null, filter_tracks_fn);
  $(".popup-content").html(html);
  show_popup();
}

function init_modified_playlists(force = false) {
  // if (force || !state.likes || !state.likes_ids) {
  //   get_likes();
  // }
  if (force || !state.playlists) {
    get_playlists();
  }
  $("#content").empty();
  let modified_playlists_html = "";

  const sorted_playlists = [...state.playlists].sort(
    (a, b) => new Date(b.last_modified) - new Date(a.last_modified)
  );

  for (let playlist of sorted_playlists) {
    let html = create_modified_playlists_item_html(playlist);
    modified_playlists_html = `${modified_playlists_html}${html}\n`;
  }
  let html = `
    <div class="modified_playlists_list">
      ${modified_playlists_html}
    </div>
  `;
  $("#content").append(html);
}

function filter_tracks_fn(track_id, playlist_id) {
  reset_flags();
  hide_popup();
  $("#content").empty();
  loading();
  get_playlist_tracks(playlist_id, filter_tracks);
  loaded();
}

function filter_tracks(playlist_id, tracks) {
  if (!state.is_filtered) {
    state.likes_ids_unfiltered = state.likes_ids.slice();
    state.likes_unfiltered = state.likes.slice();
  }
  state.is_filtered = true;
  let filtered_likes = state.playlists.find((x) => x.id == playlist_id);
  state.likes_ids = filtered_likes.track_ids.slice();
  state.likes_ids.reverse();
  tracks.sort(function (a, b) {
    return (
      // state.likes_ids.indexOf(b.track.id) - state.likes_ids.indexOf(a.track.id)
      state.likes_ids.indexOf(a.track.id) - state.likes_ids.indexOf(b.track.id)
    );
  });
  state.likes = tracks.slice();
  if (
    !array_equal(
      state.likes_ids,
      state.likes.map((x) => x.track.id),
    )
  ) {
    log("ERROR! track ids & tracks are not correctly sorted!", (error = true));
    return;
  }
  // loaded();
  // $("#log").html(state.log)
  update_index(state.likes.length - 1);
  goto_like(state.likes.length - 1); // render likes
  update_index();
  set_volume(true);
}

function render_likes(index) {
  if (isSEARCH) return;
  let [ids, indexes] = get_rendered_tracks();
  let [start, end] = get_start_and_end_track_indexes_from_index(index);
  for (let idx of indexes) {
    if (idx < end || start < idx) {
      let id = get_track_id_by_index(idx);
      $(`#${id}`).remove();
    }
  }
  let i = -1;
  for (let idx of range(start, end)) {
    i++;
    if (indexes.indexOf(idx) !== -1) continue;
    let like_html = create_like_html(state.likes[idx], idx);
    insert_at_index($("#content"), i, like_html);
  }
  set_volume(true);
}

function reset_flags() {
  if (!!state.is_filtered) {
    state.likes_ids = state.likes_ids_unfiltered.slice();
    state.likes = state.likes_unfiltered.slice();
    state.index = state.likes.length - 1;
    state.is_filtered = false;
  }
  isSEARCH = false;
}

function refresh() {
  reset_flags();
  $("#content").empty();
  goto_like(state.index);
}

function goto_like_fn() {
  if (isSEARCH) return;
  let val = $("#input_goto_like").val();
  $("#input_goto_like").val("");
  let i;
  try {
    i = parseInt(val);
  } catch (err) {
    return;
  }
  if (0 <= i && i < state.likes.length) {
    goto_like(i);
  }
}

function toggle_autoplay() {
  autoplay = !autoplay;
  autoplay_render();
}

function autoplay_render() {
  if (autoplay) {
    $("#btn_autoplay").addClass("active");
  } else {
    $("#btn_autoplay").removeClass("active");
  }
}

function create_like_html(liked_track, idx = "", title, username, genre, tags, upload_date, liked_date) {
  let track = liked_track.track;
  let id = track.id;
  // let permalink_url = track.permalink_url;
  // let artist = track.permalink_url.split('/')[3];
  // let artist_url = 'https://soundcloud.com/' + artist;
  let like = state.likes[state.likes_ids.indexOf(id)];
  title = !!title ? title : track.title;
  username = !!username ? username : like.track.user.username;
  genre = !!genre ? genre : like.track.genre;
  tags = !!tags ? tags : like.track.tag_list;
  upload_date = !!upload_date ? upload_date : like.track.display_date;
  liked_date = !!liked_date ? liked_date : like.created_at;
  let upload_date_rel_str = timestamp_to_relative_time_str(upload_date);
  let liked_date_rel_str = timestamp_to_relative_time_str(liked_date);
  let btn_unlike_none = "";
  let btn_like_none = "none";
  let [playlist_ids_w_track, playlist_names_w_track] =
    get_playlists_with_track(id);
  if (idx == 0) {
    idx = 0;
  } else {
    idx = !!idx ? idx : "";
  }
  if (!!state.is_filtered) {
    if (state.likes_ids_unfiltered.indexOf(id) == -1) {
      btn_unlike_none = "none";
      btn_like_none = "";
    }
  }
  if (like.track.downloadable) {
    show_download = true;
    show_buy = false;
  } else {
    show_download = false;
    show_buy = true;
  }
  let template = `
        <div id="${id}" class="track">
            <div class="trackDates">${liked_date_rel_str} | upload: ${upload_date_rel_str}</div>
            <div class="trackTitle">${username} - ${title}</div>
            <div class="trackTags">${genre} ${tags}</div>
            <div class="trackPlaylists">${playlist_names_w_track.join()}</div>
            <iframe id="iframe${id}" name="iframe${id}" width="100%" height="120px" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${id}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=true&show_teaser=false&visual=false&download=${show_download}&buying=${show_buy}&single_active=true"></iframe>
            <div class="buttons">
                <div class="index">${idx}</div>
                <button type="button" class="btn_unlike ${btn_unlike_none}" onclick="document.activeElement.blur();unlike(${id});">unlike</button>
                <button type="button" class="btn_like exists ${btn_like_none}" onclick="document.activeElement.blur();like(${id});">....like</button>
            </div>
        </div>`;
  template = $(template);
  let playlist_buttons = create_playlist_buttons(id);
  template.find(".buttons").append(playlist_buttons);
  template.hover(
    function () {
      let id = $(this).closest(".track").prop("id");
      overiFrame = id;
    },
    function () {
      let id = $(this).closest(".track").prop("id");
      if (overiFrame == id) {
        overiFrame = -1;
      }
    },
  );
  return template;
}

function create_playlist_buttons(track_id) {
  track_id = parseInt(track_id);
  let playlist_buttons = "";
  for (var i = 0; i < quick_playlists.length; i++) {
    let playlist_name = quick_playlists[i];
    let playlist = get_playlist_by_name(playlist_name);
    let playlist_id = playlist.id;
    let exists = exists_in_playlist(track_id, playlist_id);
    let exists_txt = !!exists ? "exists" : "";
    let playlist_num = 0 <= i && i <= 9 ? `${i}.` : "";
    let btn_template = `<button type="button" class="btn_playlist p${playlist_id} ${exists_txt}" onclick="document.activeElement.blur();add_to_playlist_fn(${track_id},${playlist_id});">${playlist_num}${playlist_name}</button>`;
    playlist_buttons += btn_template;
  }
  let add_to_any_playlist_btn = `<button type="button" class="btn_playlist pAny" onclick="document.activeElement.blur();add_to_any_playlist_fn(${track_id});">+.add</button>`;
  playlist_buttons += add_to_any_playlist_btn;
  return playlist_buttons;
}

function volume_slider_handler(value) {
  volume = value;
  $("#volumeValue").text(volume);
  set_volume();
}

const volume_slider_handler_debounced = debounce(volume_slider_handler, 10);

function set_volume_slider(value) {
  if (value == null) {
    value = volume;
  }
  value = parseInt(value);
  $("#volume_slider").val(value);
  volume_slider_handler_debounced(value);
}

function set_volume(initialize = false) {
  let iframes = document.querySelectorAll("iframe");
  iframes.forEach(function (item) {
    let sc_widget = SC.Widget(item);
    if (initialize) {
      sc_widget.bind(SC.Widget.Events.PLAY, function () {
        set_volume();
      });
    } else {
      sc_widget.setVolume(volume);
    }
  });
}

function change_volume(up = true, toggle_mute = false) {
  let step = 5;
  if (up == false) {
    step *= -1;
  }
  let volume_ = parseInt(volume) + step;
  if (volume_ < 0) {
    volume_ = 0;
  } else if (volume_ > 100) {
    volume_ = 100;
  }
  // if (parseInt(volume) != volume_) {
  volume = parseInt(volume_);
  set_volume_slider(volume);
  // }
}

function toggle_play() {
  let sc_widget = get_sc_widget_by_index(state.index);
  if (sc_widget === undefined) return;
  sc_widget.toggle();
}

function pause() {
  let sc_widget = get_sc_widget_by_index(state.index);
  if (sc_widget === undefined) return;
  sc_widget.pause();
}

function play() {
  let sc_widget = get_sc_widget_by_index(state.index);
  if (sc_widget === undefined) return;
  sc_widget.play();
}

function seek(forward = true, step = 3000) {
  let sc_widget = get_sc_widget_by_index(state.index);
  if (sc_widget === undefined) return;
  let ms;
  if (step < 1) {
    function getDuration_cb(duration) {
      ms = duration * step;
      sc_widget.seekTo(ms);
    }
    sc_widget.getDuration(getDuration_cb);
  } else {
    if (!forward) {
      step *= -1;
    }
    function getPosition_cb(curr_ms) {
      ms = curr_ms + step;
      sc_widget.seekTo(ms);
    }
    sc_widget.getPosition(getPosition_cb);
  }
}

function toggle_track_playlist_button(track_id, playlist_id, toggle) {
  if (!!toggle) {
    $(
      `#${track_id} .p${playlist_id}, .add_to_playlist_playlists .p${playlist_id}`,
    ).addClass("exists");
  } else {
    $(
      `#${track_id} .p${playlist_id}, .add_to_playlist_playlists .p${playlist_id}`,
    ).removeClass("exists");
  }
}

function toggle_track_playlist_text(track_id, playlist_id, toggle) {
  let playlists_text = $(`#${track_id} > .trackPlaylists`).text();
  let playlist = state.playlists.find((x) => x.id == playlist_id);
  let playlist_name = playlist.title;
  let playlist_text = `,${playlist_name}`;
  if (!!toggle) {
    playlists_text += playlist_text;
  } else {
    playlists_text = playlists_text.replace(playlist_text, "");
    playlists_text = playlists_text.replace(playlist_name, "");
  }
  $(`#${track_id} > .trackPlaylists`).text(playlists_text);
}

function create_add_to_any_playlist_popup_html(
  track_id,
  cb = add_to_playlist_fn,
) {
  let track_title = "";
  if (track_id !== null) {
    let like = state.likes[state.likes_ids.indexOf(track_id)];
    let track = like.track;
    track_title = track.title;
  }

  let playlists_html = "";
  for (let playlist of state.playlists.sort(sort_dict_prop_compare("title"))) {
    let playlist_id = playlist.id;
    let playlist_name = playlist.title;
    let exists = exists_in_playlist(track_id, playlist_id);
    let exists_txt = !!exists ? "exists" : "";
    let btn_template = `<button type="button" class="btn_playlist btn_add_to_playlist p${playlist_id} ${exists_txt}" onclick="document.activeElement.blur();${cb.name}(${track_id},${playlist_id});">${playlist_name}</button>`;
    playlists_html += btn_template;
  }

  let html = `
  <div class="add_to_playlist_popup">
    <div class="add_to_playlist_header">
      <h2>Add to playlist</h2>
    </div>
    <div class="add_to_playlist_track_info">
      <div class="add_to_playlist_track_title">${track_title}</div>
      <div class="add_to_playlist_track_id">${track_id}</div>
    </div>
    <div class="add_to_playlist_playlists">
      ${playlists_html}
    </div>
  </div>
  `;
  return html;
}

function add_to_any_playlist_fn(track_id) {
  let html = create_add_to_any_playlist_popup_html(track_id);
  $(".popup-content").html(html);
  show_popup();
}

function create_search_html(id, title, artist) {
  const html = `
    <div id="${id}" class="search_result">
      <div class="trackTitle">
        ${title}
      </div>
      <div class="search_artist">
        ${artist}
      </div>
    </div>
  `;
  return html;
}

function setup_quick_playlists() {
  if (state.playlists === null) {
    alert_show("load or reset state before setup quick playlists!", true);
    return;
  }
  let html = create_setup_quick_playlists_html();
  $(".popup-content").html(html);
  $(
    ".setup_quick_playlists_selected, .setup_quick_playlists_unselected",
  ).sortable({
    group: "quick_playlists",
    animation: 200,
    // onSort: reportActivity,
  });
  show_popup();
}

function save_quick_playlists() {
  const selected = $(".setup_quick_playlists_selected").sortable("toArray");
  if (String(quick_playlists) === String(selected)) {
    return true;
  }
  quick_playlists = selected;
  const url = `${host}/save_quick_playlists`;
  const data = JSON.stringify(quick_playlists);
  let res = $.ajax(url, {
    method: "POST",
    cache: false,
    async: false,
    contentType: "application/json",
    data: data,
  });
  let status = res.status;
  if (status != 200) {
    // error
    log("Error saving state!", (error = true));
    return false;
  }
  hide_popup();
  log("quick playlists updated.");
  refresh();
  return true;
}

function create_setup_quick_playlists_html() {
  const unselected_playlists = [];
  for (var i = 0; i < state.playlists.length; i++) {
    const playlist = state.playlists[i];
    const playlist_name = playlist.title;
    if (quick_playlists.indexOf(playlist_name) === -1) {
      unselected_playlists.push(playlist_name);
    }
  }
  let unselected_playlists_html = "";
  unselected_playlists.forEach(function (item) {
    const html = create_setup_playlists_item_html(item);
    unselected_playlists_html = `${unselected_playlists_html}${html}\n`;
  });
  let selected_playlists_html = "";
  quick_playlists.forEach(function (item) {
    const html = create_setup_playlists_item_html(item);
    selected_playlists_html = `${selected_playlists_html}${html}\n`;
  });
  let html = `
    <div class="setup_quick_playlists_popup">
      <div class="setup_quick_playlists_header">
        <h2>Setup quick playlists - drag and drop the playlists</h2>
      </div>
      <div class="setup_quick_playlists_content">
        <span>Selected:</span>
        <div class="setup_quick_playlists_selected list-group col">
          ${selected_playlists_html}
        </div>
        <span>Not selected:</span>
        <div class="setup_quick_playlists_unselected list-group col">
          ${unselected_playlists_html}
        </div>
      </div>
      <div class="setup_quick_playlists_footer">
        <button type="button" id="btn_setup_quick_playlists_save" class="right" onclick="document.activeElement.blur();save_quick_playlists();">save</button>
      </div>
    </div>
  `;
  return html;
}

function create_setup_playlists_item_html(name) {
  const html = `
    <div data-id="${name}" class="list-group-item">${name}</div>
  `;
  return html;
}

function create_modified_playlists_item_html(playlist) {
  let last_modified_rel_str = timestamp_to_relative_time_str(playlist.last_modified);
  const html = `
    <div id="${playlist.id}" class="modified_playlist_item">
      <div class="modified_playlist_item_date">${last_modified_rel_str}</div>
      <button type="button" class="btn_modified_playlist_filter" onclick="document.activeElement.blur();filter_tracks_fn(null, ${playlist.id});">filter</button>
      <div class="modified_playlist_item_title"><a href="${playlist.url}">${playlist.title}</a></div>
    </div>
  `;
  return html;
}
