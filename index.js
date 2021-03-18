"use strict";

require('dotenv').config();

const http = require('http');
const express = require('express');
const converter = require('json-2-csv');
const fs = require('fs');

const {
    getPlaylists,
    getPlaylistItems,
    getVideos
} = require('./utils/youtube');

const server = express();

server.get('/', async (req, res) => {
    const channelPlaylists = await getPlaylists(process.env.CHANNEL_ID)

    let videoIds = [];
    let videoIdsCount = 0;
    const videosInfo = [];

    for (let playlist of channelPlaylists.items) {

        const videos = await getPlaylistItems(playlist.id);

        for (let video of videos.items) {
            videoIds.push(video.snippet.resourceId.videoId);
            videoIdsCount++;

            if (videoIdsCount > 49) {
                let { items } = await getVideos(videoIds.join(','));
                videosInfo.push(...items.map(el => ({ ...el, playlist: playlist.snippet.title })));

                videoIds = [];
                videoIdsCount = 0;
            }
        }

        let { items } = await getVideos(videoIds.join(','));
        videosInfo.push(...items.map(el => ({ ...el, playlist: playlist.snippet.title })));

        videoIds = [];
        videoIdsCount = 0;
    }

    const info = [];

    for (let video of videosInfo) {
        const {
            playlist,
            snippet: {
                title,
                publishedAt
            },
            statistics: {
                viewCount,
                likeCount,
                dislikeCount,
                favoriteCount,
                commentCount
            },
            contentDetails: {
                duration
            }
        } = video;

        const days = duration.match(/([0-9]+)D/);
        const hours = duration.match(/([0-9]+)H/);
        const minutes = duration.match(/([0-9]+)M/);
        const seconds = duration.match(/([0-9]+)S/);
        let _duration = 0;

        if (days) _duration += Number(days[1]) * 24 * 60 * 60;
        if (hours) _duration += Number(hours[1]) * 60 * 60;
        if (minutes) _duration += Number(minutes[1]) * 60;
        if (seconds) _duration += Number(seconds[1]);

        info.push({
            playlist,
            title,
            publishedAt,
            viewCount,
            likeCount,
            dislikeCount,
            favoriteCount,
            commentCount,
            duration: _duration
        })
    }

    try {
        const csv = await converter.json2csvAsync(info);
        fs.writeFileSync('videos.csv', csv);
    } catch (err) {
        console.error(err);
    }

    res.json({ info });
})

http.createServer(server).listen(process.env.PORT, () => {
    console.log(`Serever started on port: ${process.env.PORT}`);
})