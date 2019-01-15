const axios = require("axios");
const get = require("lodash/get");
const normalize = require("./normalize");
const polyfill = require("babel-polyfill");

function getApi() {
  const rateLimit = 500;
  let lastCalled = null;

  const rateLimiter = call => {
    const now = Date.now();
    if (lastCalled) {
      lastCalled += rateLimit;
      const wait = lastCalled - now;
      if (wait > 0) {
        return new Promise(resolve => setTimeout(() => resolve(call), wait));
      }
    }
    lastCalled = now;
    return call;
  };

  const api = axios.create({
    baseURL: "https://www.googleapis.com/youtube/v3/"
  });

  api.interceptors.request.use(rateLimiter);

  return api;
}

async function getVideos(channelId, apiKey) {
  const api = getApi();

  const videos = [];

  try {
    const channelResp = await api.get(
      `channels?part=contentDetails&id=${channelId}&key=${apiKey}`
    );

    const channelData = channelResp.data.items[0];
    if (!!channelData) {
      const uploadsId = get(
        channelData,
        "contentDetails.relatedPlaylists.uploads"
      );
      let pageSize = Math.min(50, maxVideos);

      let videoResp = await api.get(
        `playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=${pageSize}&playlistId=${uploadsId}&key=${apiKey}`
      );
      videos.push(...videoResp.data.items);

      while (videoResp.data.nextPageToken && videos.length < maxVideos) {
        pageSize = Math.min(50, maxVideos - videos.length);
        let nextPageToken = videoResp.data.nextPageToken;
        videoResp = await api.get(
          `playlistItems?part=snippet%2CcontentDetails%2Cstatus&maxResults=${pageSize}&pageToken=${nextPageToken}&playlistId=${uploadsId}&key=${apiKey}`
        );
        videos.push(...videoResp.data.items);
      }
    }

    return videos;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

exports.sourceNodes = async (
  { boundActionCreators, store, cache, createNodeId },
  { channelsIds, apiKey, maxVideos=50 }
) => {
  const { createNode } = boundActionCreators;


  try {

    let videos = await Promise.all(
      channelsIds.map(async channelId => {
        return await getVideos(channelId, apiKey)
      })
    )

    console.log(videos)

    videos = normalize.normalizeRecords(videos);
    videos = normalize.createGatsbyIds(videos, createNodeId);
    videos = await normalize.downloadThumbnails({
      items: videos,
      store,
      cache,
      createNode
    });
    normalize.createNodesFromEntities(videos, createNode);
    return;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
