/**
 * YMCDN Helper - YouTube Music Extractor & Converter Scraper
 * Author: Romeo Calyx / JARiF
 */

const yts = require("yt-search");
const { Ytdl } = require("@distube/ytdl-core");

const ytdl = new Ytdl();

const ymcdn = {
  /**
   * Scrapes YouTube song info and returns direct audio download/stream URL
   * @param {string} query - Video URL or search query
   * @param {object} options - Conversion options (e.g., { type: 'mp3' })
   * @returns {Promise<object>}
   */
  scrape: async function (query, options = { type: "mp3" }) {
    if (!query || typeof query !== "string") {
      throw new Error("Invalid query provided to ymcdn.scrape");
    }

    let videoUrl = query.trim();
    let previewData = null;

    const isUrl = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(videoUrl);

    if (!isUrl) {
      const searchResult = await yts(videoUrl);
      if (!searchResult || !searchResult.videos || searchResult.videos.length === 0) {
        throw new Error(`No YouTube results found for "${query}"`);
      }
      const topVideo = searchResult.videos[0];
      videoUrl = topVideo.url;
      previewData = {
        title: topVideo.title,
        author: topVideo.author?.name || "Unknown Artist",
        duration: topVideo.timestamp || "Standard",
        thumbnail: topVideo.thumbnail,
        url: topVideo.url
      };
    }

    const info = await ytdl.getInfo(videoUrl);
    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    if (!audioFormats.length) {
      throw new Error("No suitable audio streams available for this video.");
    }

    const bestAudio = audioFormats[0];
    const durationSec = parseInt(info.videoDetails.lengthSeconds, 10) || 0;
    const formattedDuration = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, "0")}`;

    return {
      title: previewData?.title || info.videoDetails.title || "YouTube Audio",
      author: previewData?.author || info.videoDetails.author?.name || "YouTube Artist",
      duration: previewData?.duration || formattedDuration,
      download_url: bestAudio.url,
      streamUrl: bestAudio.url,
      url: videoUrl,
      thumbnail: previewData?.thumbnail || info.videoDetails.thumbnails?.[0]?.url,
      getStream: () => ytdl.download(videoUrl, { filter: { hasAudio: true, hasVideo: false } })
    };
  }
};

module.exports = ymcdn;
