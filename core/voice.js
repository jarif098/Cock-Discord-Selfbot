/**
 * JARiF Voice Channel & Audio Player Controller
 * Powered by @discordjs/voice & ffmpeg-static
 */

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = require("@discordjs/voice");
const prism = require("prism-media");
const ffmpegPath = require("ffmpeg-static");
const logger = require("./logger");

const connections = new Map();
const players = new Map();
const queues = new Map();
const currentTracks = new Map();

/**
 * Connect to a Discord voice channel
 */
async function joinChannel({ channel, selfDeaf = false, selfMute = false }) {
  if (!channel || !channel.guild) {
    throw new Error("Invalid voice channel provided.");
  }

  const guildId = channel.guild.id;

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guildId,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf,
    selfMute
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    connections.set(guildId, connection);

    // Create player if not already existing
    if (!players.has(guildId)) {
      const player = createAudioPlayer();
      players.set(guildId, player);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        playNext(guildId);
      });

      player.on("error", (error) => {
        logger.error(`Audio player error in guild [${guildId}]: ${error.message}`);
        playNext(guildId);
      });
    } else {
      connection.subscribe(players.get(guildId));
    }

    return connection;
  } catch (err) {
    connection.destroy();
    connections.delete(guildId);
    throw new Error(`Failed to establish voice connection: ${err.message}`);
  }
}

/**
 * Disconnect and cleanup voice resources for a guild
 */
function leaveChannel(guildId) {
  const connection = connections.get(guildId);
  if (connection) {
    try {
      connection.destroy();
    } catch (_) {}
    connections.delete(guildId);
  }

  const player = players.get(guildId);
  if (player) {
    try {
      player.stop(true);
    } catch (_) {}
    players.delete(guildId);
  }

  queues.delete(guildId);
  currentTracks.delete(guildId);
}

/**
 * Create a resilient FFmpeg raw PCM audio resource from URL or stream
 */
function createFFmpegResource(audioUrl) {
  const ffmpegStream = new prism.FFmpeg({
    ffmpegPath,
    args: [
      "-reconnect", "1",
      "-reconnect_streamed", "1",
      "-reconnect_delay_max", "5",
      "-i", audioUrl,
      "-analyzeduration", "0",
      "-loglevel", "0",
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2"
    ]
  });

  return createAudioResource(ffmpegStream, {
    inputType: StreamType.Raw,
    inlineVolume: true
  });
}

/**
 * Play a track or enqueue it if already playing
 */
async function enqueueTrack({ guildId, channel, track, textChannel }) {
  if (!connections.has(guildId)) {
    await joinChannel({ channel });
  }

  if (!queues.has(guildId)) {
    queues.set(guildId, []);
  }

  const queue = queues.get(guildId);
  const player = players.get(guildId);
  const isPlaying = player && player.state.status === AudioPlayerStatus.Playing;

  track.textChannel = textChannel;

  if (isPlaying) {
    queue.push(track);
    return { enqueued: true, position: queue.length };
  } else {
    currentTracks.set(guildId, track);
    const resource = createFFmpegResource(track.streamUrl || track.download_url);
    player.play(resource);
    return { enqueued: false, track };
  }
}

/**
 * Play the next track from the queue
 */
function playNext(guildId) {
  const queue = queues.get(guildId);
  const player = players.get(guildId);

  if (!queue || queue.length === 0) {
    currentTracks.delete(guildId);
    return null;
  }

  const nextTrack = queue.shift();
  currentTracks.set(guildId, nextTrack);

  try {
    const resource = createFFmpegResource(nextTrack.streamUrl || nextTrack.download_url);
    player.play(resource);

    if (nextTrack.textChannel) {
      nextTrack.textChannel.send(`🎶 Now playing: **${nextTrack.title}** (\`${nextTrack.duration}\`)`).catch(() => {});
    }
    return nextTrack;
  } catch (err) {
    logger.error(`Error playing next track: ${err.message}`);
    return playNext(guildId);
  }
}

function pausePlayback(guildId) {
  const player = players.get(guildId);
  if (!player) return false;
  return player.pause();
}

function resumePlayback(guildId) {
  const player = players.get(guildId);
  if (!player) return false;
  return player.unpause();
}

function skipTrack(guildId) {
  const player = players.get(guildId);
  if (!player) return false;
  player.stop();
  return true;
}

function stopPlayback(guildId) {
  const queue = queues.get(guildId);
  if (queue) queue.length = 0;
  currentTracks.delete(guildId);

  const player = players.get(guildId);
  if (player) {
    player.stop(true);
    return true;
  }
  return false;
}

function getVoiceStatus(guildId) {
  const connection = connections.get(guildId);
  const player = players.get(guildId);
  const current = currentTracks.get(guildId);
  const queue = queues.get(guildId) || [];

  return {
    isConnected: !!connection,
    status: player ? player.state.status : "disconnected",
    currentTrack: current,
    queue: [...queue]
  };
}

module.exports = {
  joinChannel,
  leaveChannel,
  enqueueTrack,
  playNext,
  pausePlayback,
  resumePlayback,
  skipTrack,
  stopPlayback,
  getVoiceStatus
};
