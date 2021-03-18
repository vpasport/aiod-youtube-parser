"use strict";

const fetch = require('node-fetch');

async function get(method, query) {
    query.key = process.env.API_KEY;

    const url = `https://youtube.googleapis.com/youtube/v3/${method}?${(new URLSearchParams(query)).toString()}`;

    const response = await fetch(url);
    const json = await response.json();

    return json;
}

async function getPlaylists(channelId) {
    const playlists = await get('playlists', {
        part: 'snippet',
        channelId: channelId,
        maxResults: 50
    });

    return playlists;
}

async function getPlaylistItems(playlistId) {
    const videos = await get('playlistItems', {
        part: 'snippet',
        playlistId: playlistId,
        maxResults: 50
    });

    return videos;
}

async function getVideos(videoId) {
    const video = await get('videos', {
        part: 'contentDetails,snippet,statistics',
        id: videoId,
    });

    return video;
}

module.exports = {
    get,
    getPlaylists,
    getPlaylistItems,
    getVideos
}