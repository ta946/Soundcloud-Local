function request(url, method, data, async, _param) {
  if (async === undefined || async === null) async = false;
  let res = $.ajax(url, {
    method: method,
    cache: false,
    async: async,
    contentType: "application/json",
    data: data,
    _param: _param,
  });
  return res;
}

function get_paged(route, next_href = null) {
  let url;
  if (!!next_href) {
    url = next_href.replace(sc_host, host);
  } else {
    url = `${host}/users/${user_id}/${route}?limit=999&offset=0`;
  }
  url = `${url}&client_id=${client_id}`; //"&linked_partitioning=1&app_version=1590668951&app_locale=en"
  let res = request(url, "GET");
  let status = res.status;
  if (status != 200) {
    // error
    console.warn("ERROR", status, res.statusText, url);
    return false;
  }
  let data = res.responseJSON;
  if (!("collection" in data)) {
    return false;
  } // error
  if (!("next_href" in data)) {
    return false;
  } // error
  return [data.collection, data.next_href];
}

function parallel(route, key, array, done_fn, fail_fn, cb) {
  let deferreds = [];
  let results = [];
  let failed = [];
  for (let i = 0; i < array.length; i++) {
    let value = array[i];
    let deferrer = $.Deferred();
    deferreds.push(deferrer);
    let url = `${host}/${route}?client_id=${client_id}&${key}=${value}`;
    let res = request(url, "GET", null, true, i);
    res
      .done(function (data) {
        if (done_fn == null) {
          results.push(data);
        } else {
          done_fn(data);
        }
      })
      .fail(function () {
        if (fail_fn == null) {
          let failed_value = this.url.slice(this.url.indexOf("&url=") + 5);
          failed.push(failed_value);
        } else {
          fail_fn(this);
        }
      })
      .always(function () {
        deferreds[this._param].resolve();
      });
  }
  $.when.apply($, deferreds).then(function () {
    cb(results, failed);
  });
}

function test(asdf) {
  console.log(asdf);
}

function get_all(route) {
  let next_href = null;
  let list = [];
  do {
    console.log("getting " + route + " " + next_href);
    let data = get_paged(route, next_href);
    // console.log(data);
    if (!data) {
      // error
      log("Error getting " + route + "!\n" + next_href, (error = true));
      return false;
    }
    list = list.concat(data[0]);
    next_href = data[1];
  } while (!!next_href);
  console.log("finished getting " + route);
  // console.log(list);
  return list;
}

function get_playlist_tracks_chunked(ids_chunk_arr, cb) {
  let array = [];
  for (ids_chunk of ids_chunk_arr) {
    array.push(ids_chunk.join("%2C"));
  }
  parallel("tracks", "ids", array, null, null, cb);
}

function get_likes() {
  loading();
  let route = "track_likes";
  let list = get_all(route);
  loaded();
  if (!list) {
    return false;
  }
  ISUNSAVED = true;
  state.likes = list;
  let likes_ids = list.map((x) => x.track.id);
  state.likes_ids = likes_ids;
  update_index(list.length - 1);
  return true;
}

function get_playlists() {
  loading();
  let route = "playlists";
  let list = get_all(route);
  loaded();
  if (!list) {
    return false;
  }
  ISUNSAVED = true;
  let playlists = [];
  list.forEach(function (item) {
    let playlist = {};
    playlist.id = item.id;
    playlist.title = item.title;
    playlist.track_ids = item.tracks.map((x) => x.id);
    playlist.last_modified = item.last_modified;
    playlist.created_at = item.created_at;
    playlist.url = item.permalink_url;
    playlist.secret_token = item.secret_token;
    playlist.public = item.public;
    playlists.push(playlist);
  });
  state.playlists = playlists;
  return true;
}

function get_playlist_tracks(playlist_id, cb) {
  loading();
  let playlist = state.playlists.find((x) => x.id == playlist_id);
  let ids = playlist.track_ids;
  let ids_chunk_arr = [];
  let ids_chunk = [];
  let chunk = 26;
  let i, j;
  for (i = 0, j = ids.length; i < j; i += chunk) {
    ids_chunk = ids.slice(i, i + chunk);
    ids_chunk_arr.push(ids_chunk);
  }
  get_playlist_tracks_chunked(ids_chunk_arr, function (results, failed) {
    let tracks = [];
    for (let result of results) {
      for (let r of result) {
        let track = { track: r };
        tracks.push(track);
      }
    }
    cb(playlist_id, tracks);
  });
  // loaded()
}

function add_to_playlist_fn(track_id, playlist_id) {
  track_id = parseInt(track_id);
  let exists = exists_in_playlist(track_id, playlist_id);
  if (!exists) {
    add_to_playlist(track_id, playlist_id);
  } else {
    remove_from_playlist(track_id, playlist_id);
  }
}

function add_to_playlist(track_id, playlist_id) {
  if (track_id == -1) {
    return;
  }
  track_id = parseInt(track_id);
  if (!state.playlists) {
    let ret = get_playlists();
    if (!ret) {
      return;
    }
  }
  loading();
  let playlist = state.playlists.find((x) => x.id == playlist_id);
  let idx = playlist.track_ids.indexOf(track_id);
  let track_name = state.likes[state.likes_ids.indexOf(track_id)].track.title;
  if (idx != -1) {
    log(
      "track already in playlist.\n" +
        track_name +
        "\n" +
        track_id +
        " in " +
        playlist_id +
        " " +
        state.playlists.find((x) => x.id == playlist_id).title,
      (error = false),
    );
    return;
  }
  let track_ids = playlist.track_ids.slice();
  track_ids.push(track_id);

  let url = `${host}/playlists/${playlist_id}?client_id=${client_id}`;
  let data = JSON.stringify({ playlist: { tracks: track_ids } });
  let res = request(url, "PUT", data, true);
  res
    .fail(function (xhr, status, err) {
      log(
        "Error adding track to playlist!\n" +
          track_name +
          "\n" +
          track_id +
          " in " +
          playlist_id +
          " " +
          state.playlists.find((x) => x.id == playlist_id).title,
        (error = true),
      );
      return;
    })
    .done(function (data) {
      ISUNSAVED = true;
      let playlist = state.playlists.find((x) => x.id == playlist_id);
      playlist.track_ids.push(track_id);
      toggle_track_playlist_button(track_id, playlist_id, true);
      toggle_track_playlist_text(track_id, playlist_id, true);
      log(
        "Added track to playlist.\n" +
          track_name +
          "\n" +
          track_id +
          " in " +
          playlist_id +
          " " +
          state.playlists.find((x) => x.id == playlist_id).title,
        (error = false),
      );
    });
  loaded();
}

function remove_from_playlist(track_id, playlist_id) {
  if (track_id == -1) return;
  track_id = parseInt(track_id);
  if (!state.playlists) {
    let ret = get_playlists();
    if (!ret) {
      return;
    }
  }
  loading();
  let playlist = state.playlists.find((x) => x.id == playlist_id);
  let track_name = state.likes[state.likes_ids.indexOf(track_id)].track.title;
  let idx = playlist.track_ids.indexOf(track_id);
  if (idx == -1) {
    log(
      "track not in playlist.\n" +
        track_name +
        "\n" +
        track_id +
        " in " +
        playlist_id +
        " " +
        playlist.title,
      (error = false),
    );
    return;
  }
  let track_ids = playlist.track_ids.slice();
  track_ids.splice(idx, 1);

  let url = `${host}/playlists/${playlist_id}?client_id=${client_id}`;
  let data = JSON.stringify({ playlist: { tracks: track_ids } });
  let res = request(url, "PUT", data, true);
  res
    .fail(function (xhr, status, err) {
      log(
        "Error removing track from playlist!\n" +
          track_name +
          "\n" +
          track_id +
          " in " +
          playlist_id +
          " " +
          playlist.title,
        (error = true),
      );
      return;
    })
    .done(function (data) {
      ISUNSAVED = true;
      playlist.track_ids.splice(playlist.track_ids.indexOf(track_id), 1);
      toggle_track_playlist_button(track_id, playlist_id, false);
      toggle_track_playlist_text(track_id, playlist_id, false);
      log(
        "Removed track from playlist.\n" +
          track_name +
          "\n" +
          track_id +
          " in " +
          playlist_id +
          " " +
          playlist.title,
        (error = false),
      );
    });
  loaded();
}

function unlike(track_id) {
  if (track_id == -1) return;
  pause();
  track_id = parseInt(track_id);
  loading();
  let url = `${host}/users/${user_id}/track_likes/${track_id}?client_id=${client_id}`;
  let res = request(url, "DELETE");
  // console.log(res.responseText,res.status)
  let track_name = state.likes[state.likes_ids.indexOf(track_id)].track.title;
  if (res.responseText == "OK" || res.status == 404) {
    // success
    ISUNSAVED = true;
    log("unliked.\n" + track_name + "\n" + String(track_id), (error = false));
    render_unlike(track_id);
  } else {
    // error
    log(
      "Error unliking!\n" + track_name + "\n" + String(track_id),
      (error = true),
    );
  }
  loaded();
}

function like(track_id) {
  if (!state.is_filtered) return;
  if (track_id == -1) return;
  // pause()
  track_id = parseInt(track_id);
  loading();
  let url = `${host}/users/${user_id}/track_likes/${track_id}?client_id=${client_id}`;
  let res = request(url, "PUT");
  // console.log(res.responseText,res.status)
  let track_name = state.likes[state.likes_ids.indexOf(track_id)].track.title;
  if (res.responseText == '"OK"') {
    // success
    ISUNSAVED = true;
    log("liked.\n" + track_name + "\n" + String(track_id), (error = false));
    state.likes_ids_unfiltered.push(track_id);
    $("#" + String(track_id) + " > .buttons > .btn_like").addClass("none");
    $("#" + String(track_id) + " > .buttons > .btn_unlike").removeClass("none");
  } else {
    // error
    log(
      "Error liking!\n" + track_name + "\n" + String(track_id),
      (error = true),
    );
  }
  loaded();
}

// function append_playlist(playlist_id, ids) {
//   get_playlists();
//   if (!playlist_id) {
//     playlist_id = listen_later_id;
//   }
//   let playlist = state.playlists.find((x) => x.id == playlist_id);
//   let track_ids = playlist.track_ids.slice();
//   for (id of ids) {
//     track_ids.push(id);
//   }
//   let url = `${host}/playlists/${playlist_id}?client_id=${client_id}`;
//   let data = JSON.stringify({ playlist: { tracks: track_ids } });
//   let res = request(url, "PUT", data, true);
//   res
//     .fail(function (xhr, status, err) {
//       log(
//         "Error adding tracks to playlist!\n in " + playlist_id,
//         (error = true),
//       );
//       return;
//     })
//     .done(function (data) {
//       ISUNSAVED = true;
//       log("Added tracks to playlist.\n in " + playlist_id, (error = false));
//     });
// }

function get_playlist_by_name(name) {
  const playlists = state.playlists.filter(function (item) {
    if (item["title"] === name) return item;
  });
  if (playlists.length == 0) {
    console.log(`playlist not found! ${name}`);
    return false;
  }
  if (playlists.length > 1) {
    console.log(`multiple playlists found! ${name}`);
    return false;
  }
  return playlists[0];
}

function get_quick_playlists_ids() {
  for (var i = 0; i < quick_playlists.length; i++) {
    const name = quick_playlists[i];
    const playlist = get_playlist_by_name(name);
    if (!playlist) {
      throw `could not get quick playlists id ${name}`;
    }
  }
}

function load_state_fn() {
  if (confirm("Are you sure you want to load an older state?")) {
    setTimeout(load_state, 200);
  }
}

function load_state() {
  loading();
  const url = `${host}/load_state`;
  let res = $.ajax(url, {
    method: "GET",
    cache: false,
    async: false,
  });
  loaded();
  let data = res.responseJSON;
  try {
    state = JSON.parse(data);
  } catch (err) {
    log("Error loading state!", (error = true));
    return;
  }
  init();
}

function save_state_fn() {
  if (
    confirm(
      "Are you sure you want to save the current state?\nThis will overwrite the old state",
    )
  ) {
    setTimeout(save_state, 200);
  }
}

function save_state() {
  const url = `${host}/save_state`;
  const data = JSON.stringify(state);
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
  ISUNSAVED = false;
  return true;
}
