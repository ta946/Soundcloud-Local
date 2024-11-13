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
  if (isSEARCH) {
    const track_id = get_track_id_by_index(state.index);
    const el = $(`#${track_id}`).prev(".track");
    if (el.length == 0) {
      return;
    }
    const new_track_id = parseInt(el.attr("id"));
    focus_to_like(new_track_id);
    return;
  }
  move_to_like(n);
}

function next_like(n = 1) {
  if (isSEARCH) {
    const track_id = get_track_id_by_index(state.index);
    const el = $(`#${track_id}`).next(".track");
    if (el.length == 0) {
      return;
    }
    const new_track_id = parseInt(el.attr("id"));
    focus_to_like(new_track_id);
    return;
  }
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
    let index = state.likes_ids_unfiltered.indexOf(id);
    state.likes_ids_unfiltered.splice(index, 1);
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
  const el = $(`#${id}`);
  el.addClass("active");
  if (isSEARCH) {
    if (el.length > 0) {
      el[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

function update_indexes() {
  $(".track").each(function () {
    let id = parseInt($(this).prop("id"));
    let index = state.likes_ids.indexOf(id);
    $(this).find(".index").text(index);
  });
}

function next_unassigned_fn() {
  if (isSEARCH) return;
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
  if (state.likes === null) {
    alert_show("load/reset state to search!", true);
    return;
  }

  const is_search_title = $("#chk_search_title").is(":checked");
  const is_search_artist = $("#chk_search_artist").is(":checked");
  const is_search_tags = $("#chk_search_tags").is(":checked");
  if (!is_search_title && !is_search_artist && !is_search_tags) {
    alert_show("title, artist and/or tags must be checked to search!", true);
    return;
  }

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
  const search_title_key = "track.title";
  const search_artist_key = "track.user.username";
  const search_genre_key = "track.genre";
  const search_tags_key = "track.tag_list";
  let keys = [];
  if (is_search_title) {
    keys.push(search_title_key);
  }
  if (is_search_artist) {
    keys.push(search_artist_key);
  }
  if (is_search_tags) {
    keys.push(search_genre_key);
    keys.push(search_tags_key);
  }
  const results = fuzzysort.go(search_text, state.likes, {
    keys: keys,
    limit: 0,
    threshold: 0.5, // don't return bad results
  });
  loaded();
  console.log(results);
  for (let i in results) {
    if (i === "total") {
      break;
    }
    let result = results[i];
    let highlight_title = null;
    let highlight_artist = null;
    let highlight_genre = null;
    let highlight_tags = null;
    if (is_search_title) {
      const title_index = keys.indexOf(search_title_key);
      highlight_title = result[title_index].highlight(
        "<fuzzy_sr>",
        "</fuzzy_sr>",
      );
    }
    if (is_search_artist) {
      const title_artist = keys.indexOf(search_artist_key);
      highlight_artist = result[title_artist].highlight(
        "<fuzzy_sr>",
        "</fuzzy_sr>",
      );
    }
    if (is_search_tags) {
      const title_genre = keys.indexOf(search_genre_key);
      highlight_genre = result[title_genre].highlight(
        "<fuzzy_sr>",
        "</fuzzy_sr>",
      );
      const title_tags = keys.indexOf(search_tags_key);
      highlight_tags = result[title_tags].highlight(
        "<fuzzy_sr>",
        "</fuzzy_sr>",
      );
    }
    if (highlight_title === null) {
      highlight_title = result.obj.track.title;
    }
    if (highlight_artist === null) {
      highlight_artist = result.obj.track.user.username;
    }
    if (highlight_title === null) {
      highlight_genre = result.obj.track.genre;
    }
    if (highlight_artist === null) {
      highlight_tags = result.obj.track.tag_list;
    }
    let track_id = result.obj.track.id;
    let idx = get_track_index_by_id(track_id);
    // let html = create_search_html(track_id, highlight_title, highlight_artist);
    let html = create_like_html(
      state.likes[idx],
      idx,
      highlight_title,
      highlight_artist,
      highlight_genre,
      highlight_tags,
    );
    $("#content").append(html);
  }
  if (results.length > 0) {
    const first_track_id = parseInt($(".track").eq(0).attr("id"));
    focus_to_like(first_track_id);
    set_volume(true);
  } else {
    $("#content").html(
      `<div style="text-align: center;">no results for <b>${search_text}</b></div>`,
    );
  }
}
