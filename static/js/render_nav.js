function goto_like(index) {
  if (state.likes == null) {
    return;
  }
  pause();
  loading();
  if (index === undefined) {
    index = state.index;
  }
  render_likes(index);
  update_index(index);
  if (autoplay) {
    play();
  }
  loaded();
}

function move_to_like(n) {
  pause();
  let next_index = state.index + n;
  if (next_index < 0) next_index = 0;
  if (next_index >= state.likes.length) next_index = state.likes.length - 1;
  if (next_index === state.index) return;
  render_likes(next_index);
  update_index(next_index);
  if (autoplay) {
    play();
  }
}

function prev_like(n = 1) {
  move_to_like(n);
}

function next_like(n = 1) {
  move_to_like(-n);
}

function focus_to_like(id) {
  let index = get_track_index_by_id(id);
  let offset = index - state.index;
  if (offset === 0) return;
  move_to_like(offset);
}

function render_unlike(id) {
  if (!!state.is_filtered) {
    let index = state.likes_ids_filtered.indexOf(id);
    state.likes_ids_filtered.splice(index, 1);
    $(`#${id} > .buttons > .btn_unlike`).addClass("none");
    $(`#${id} > .buttons > .btn_like`).removeClass("none");
  } else {
    let index = get_track_index_by_id(id);
    $(`#${id}`).remove();
    state.likes.splice(index, 1);
    state.likes_ids.splice(index, 1);
    if (index == state.index) {
      state.index--;
    }
    render_likes(state.index);
    update_indexes();
    update_index();
    focusiFrame = -1;
    if (autoplay) {
      play();
    }
  }
}

function exists_in_playlist(id, playlist_id) {
  id = parseInt(id);
  let playlist = state.playlists.find((x) => x.id == playlist_id);
  if (playlist === undefined) return false;
  let idx = playlist.track_ids.indexOf(id);
  let exists = idx != -1;
  return exists;
}

function update_index(index) {
  if (index != undefined && 0 <= index && index <= state.likes.length - 1) {
    state.index = index;
  }
  $("#index").text(state.index);
  $("#index_reverse").text(state.likes.length - state.index);
  $("#likes_length").text(state.likes.length - 1);
  $(".track.active").removeClass("active");
  let id = get_track_id_by_index(state.index);
  $(`#${id}`).addClass("active");
}

function update_indexes() {
  $(".track").each(function () {
    let id = parseInt($(this).prop("id"));
    let index = state.likes_ids.indexOf(id);
    $(this).find(".index").text(index);
  });
}

function next_unassigned_fn() {
  let idx = next_unassigned(state.index - 1);
  if (idx === undefined) return;
  goto_like(idx);
}

function next_unassigned(idx) {
  if (idx === undefined) idx = state.likes_ids.length - 1;
  for (; idx >= 0; idx--) {
    let id = state.likes_ids[idx];
    let [playlist_ids_w_track, playlist_names_w_track] =
      get_playlists_with_track(id);
    if (playlist_ids_w_track.length === 0) {
      return idx;
    }
  }
}

function next_assigned_fn() {
  let idx = next_assigned(state.index - 1);
  if (idx === undefined) return;
  goto_like(idx);
}

function next_assigned(idx) {
  if (idx === undefined) idx = state.likes_ids.length - 1;
  for (; idx >= 0; idx--) {
    let id = state.likes_ids[idx];
    let [playlist_ids_w_track, playlist_names_w_track] =
      get_playlists_with_track(id);
    if (playlist_ids_w_track.length !== 0) {
      return idx;
    }
  }
}

function get_track_id_by_index(index) {
  let id = state.likes_ids[index];
  return id;
}

function get_track_index_by_id(id) {
  let index = state.likes_ids.indexOf(id);
  return index;
}

function get_start_and_end_track_indexes_from_index(index) {
  let overflow_positive = index + nitems_prev + 1 - state.likes.length;
  let overflow_negative = index - nitems_next;
  let overflow = 0;
  if (overflow_positive > 0) {
    overflow = -overflow_positive;
  } else if (overflow_negative < 0) {
    overflow = -overflow_negative;
  }
  let start = index + nitems_prev + overflow;
  let end = index - nitems_next + overflow;
  return [start, end];
}

function get_rendered_tracks() {
  let ids = [];
  let indexes = [];
  for (let item of $(".track")) {
    let id = parseInt(item.id);
    ids.push(id);
    let index = get_track_index_by_id(id);
    indexes.push(index);
  }
  return [ids, indexes];
}

function check_track_rendered(id) {
  let rendered = !!$(`#${id}`).length;
  return rendered;
}

function get_iframe_by_id(id) {
  let iframe = $(`#${id}`).find("iframe")[0];
  return iframe;
}

function get_sc_widget_by_index(index) {
  let id = get_track_id_by_index(index);
  let iframe = get_iframe_by_id(id);
  if (iframe == undefined) return;
  let sc_widget = SC.Widget(iframe);
  return sc_widget;
}

function get_playlists_with_track(id) {
  let playlist_ids_w_track = [];
  let playlist_names_w_track = [];
  for (let playlist of state.playlists) {
    if (playlist.track_ids.indexOf(id) === -1) continue;
    playlist_ids_w_track.push(playlist.id);
    playlist_names_w_track.push(playlist.title);
  }
  return [playlist_ids_w_track, playlist_names_w_track];
}

// unused
// function get_track_ids() {
//     track_ids = $(".track").map(function(){return this.id;}).get();
// }

function search_likes() {
  pause();
  $("#content").empty();
  const search_text = $("#search_likes").val();
  $("#search_likes").val("");
  if (!search_text) {
    isSEARCH = false;
    render_likes(state.index);
    return;
  }
  isSEARCH = true;
  loading();
  const results = fuzzysort.go(search_text, state.likes, {
    keys: ["track.title", "track.user.username"],
    limit: 100, // don't return more results than you need!
    threshold: -10000, // don't return bad results
  });
  loaded();
  console.log(results);
  for (i in results) {
    if (i === "total") {
      break;
    }
    let result = results[i];
    let highlight_title = fuzzysort.highlight(
      result[0],
      "<fuzzy_sr>",
      "</fuzzy_sr>",
    );
    let highlight_artist = fuzzysort.highlight(
      result[1],
      "<fuzzy_sr>",
      "</fuzzy_sr>",
    );
    if (highlight_title === null) {
      highlight_title = result.obj.track.title;
    }
    if (highlight_artist === null) {
      highlight_artist = result.obj.track.user.username;
    }
    let track_id = result.obj.track.id;
    let idx = get_track_index_by_id(track_id);
    // let html = create_search_html(track_id, highlight_title, highlight_artist);
    let html = create_like_html(
      state.likes[idx],
      idx,
      highlight_title,
      highlight_artist,
    );
    $("#content").append(html);
  }
  set_volume(true);
}
