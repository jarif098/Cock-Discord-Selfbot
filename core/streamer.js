/**
 * COCK Video Streamer & Go Live Screenshare Controller
 * Powered by @dank074/discord-video-stream and ffmpeg-static
 */

const { Streamer, prepareStream, playStream, Encoders, Utils } = require("@dank074/discord-video-stream");
const { setFFmpegPath } = require("fluent-ffmpeg-simplified");
const ffmpegStatic = require("ffmpeg-static");
const { Ytdl } = require("@distube/ytdl-core");
const yts = require("yt-search");
const logger = require("./logger");

// Automatically configure FFmpeg binary path
try {
  setFFmpegPath(ffmpegStatic);
} catch (e) {
  logger.warn(`Could not set ffmpegStatic path: ${e.message}`);
}

const ytdl = new Ytdl();
let streamerInstance = null;
const activeStreams = new Map();

function getStreamer(client) {
  if (!streamerInstance && client) {
    streamerInstance = new Streamer(client);
  }
  return streamerInstance;
}

/**
 * Resolves any query, YouTube link, or direct video file into playable stream parameters
 */
async function resolveVideoSource(query) {
  const isHttp = /^https?:\/\//i.test(query.trim());
  const isYouTube = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(query.trim());

  if (isYouTube || (!isHttp && query.trim().length > 0)) {
    let videoUrl = query.trim();
    let videoTitle = "YouTube Video";
    let videoAuthor = "YouTube";
    let duration = "Live";

    if (!isYouTube) {
      const search = await yts(query);
      if (!search || !search.videos.length) {
        throw new Error(`No YouTube video found for "${query}"`);
      }
      const top = search.videos[0];
      videoUrl = top.url;
      videoTitle = top.title;
      videoAuthor = top.author?.name || "YouTube";
      duration = top.timestamp || "Standard";
    }

    const info = await ytdl.getInfo(videoUrl);
    videoTitle = info.videoDetails.title || videoTitle;
    videoAuthor = info.videoDetails.author?.name || videoAuthor;

    // Best video format (prefer up to 720p/1080p for stable real-time streaming)
    const videoFormats = info.formats
      .filter(f => f.hasVideo && !f.isLive)
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    // Best audio format
    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

    if (!videoFormats.length) {
      throw new Error("No video stream found for this YouTube video.");
    }

    const selectedVideo = videoFormats.find(f => (f.height || 0) <= 1080) || videoFormats[0];
    const selectedAudio = audioFormats[0];

    return {
      type: "youtube",
      title: videoTitle,
      author: videoAuthor,
      duration,
      url: videoUrl,
      videoUrl: selectedVideo.url,
      audioUrl: selectedAudio ? selectedAudio.url : null,
      width: selectedVideo.width || 1280,
      height: selectedVideo.height || 720
    };
  }

  // Direct MP4 / MKV / WebM or web URL
  return {
    type: "direct",
    title: query.split("/").pop().split("?")[0] || "Direct Video Stream",
    author: "Direct Link / Local File",
    duration: "Unknown",
    url: query,
    videoUrl: query,
    audioUrl: null,
    width: 1280,
    height: 720
  };
}

/**
 * Starts a screenshare / Go Live stream into a Discord voice channel
 */
async function startScreenShare({ client, guildId, channelId, query, textChannel, fps = 30, resolution = 720 }) {
  const streamer = getStreamer(client);
  if (!streamer) throw new Error("Streamer instance is not initialized.");

  // Stop any existing stream for this guild
  await stopScreenShare(guildId);

  const source = await resolveVideoSource(query);
  const abortController = new AbortController();

  logger.info(`Starting ScreenShare: "${source.title}" in guild [${guildId}]`, "STREAM");

  // Join the voice channel
  await streamer.joinVoice(guildId, channelId);

  // Configure video stream options
  const streamOptions = {
    width: resolution === 1080 ? 1920 : 1280,
    height: resolution,
    frameRate: fps,
    bitrateVideo: resolution === 1080 ? 4500 : 2500,
    bitrateVideoMax: resolution === 1080 ? 6000 : 3500,
    videoCodec: Utils.normalizeVideoCodec("H264"),
    encoder: Encoders.software({
      x264: { preset: "veryfast" }
    })
  };

  if (source.audioUrl) {
    // Dual input: map separate video and audio streams
    streamOptions.customInputOptions = ["-i", source.audioUrl];
    streamOptions.customFfmpegFlags = ["-map", "0:v:0", "-map", "1:a:0?"];
  }

  const { command, output } = prepareStream(source.videoUrl, streamOptions, abortController.signal);

  command.on("error", (err) => {
    logger.warn(`FFmpeg Stream notice: ${err?.message || err}`);
  });

  const streamPromise = playStream(output, streamer, {
    type: "go-live"
  });

  activeStreams.set(guildId, {
    source,
    abortController,
    channelId,
    startedAt: Date.now()
  });

  streamPromise
    .then(() => {
      logger.info(`ScreenShare finished: "${source.title}"`, "STREAM");
      if (textChannel) {
        textChannel.send(`📺 ScreenShare stream of **${source.title}** has ended.`).catch(() => {});
      }
      activeStreams.delete(guildId);
    })
    .catch((err) => {
      if (!abortController.signal.aborted) {
        logger.error(`ScreenShare Error: ${err.message}`);
      }
      activeStreams.delete(guildId);
    });

  return source;
}

/**
 * Stops an active screenshare in the given guild
 */
async function stopScreenShare(guildId) {
  const current = activeStreams.get(guildId);
  if (current) {
    try {
      current.abortController.abort();
    } catch (_) {}
    activeStreams.delete(guildId);
  }

  if (streamerInstance) {
    try {
      await streamerInstance.stopStream();
    } catch (_) {}
  }

  return true;
}

/**
 * Returns the current screenshare status for the guild
 */
function getScreenShareStatus(guildId) {
  const current = activeStreams.get(guildId);
  if (!current) return { isStreaming: false };
  return {
    isStreaming: true,
    source: current.source,
    channelId: current.channelId,
    startedAt: current.startedAt
  };
}

module.exports = {
  getStreamer,
  resolveVideoSource,
  startScreenShare,
  stopScreenShare,
  getScreenShareStatus
};
