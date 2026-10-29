/**
 * @English
 * Sing / Music Player Command
 * Searches or takes YouTube URL, converts via YMCDN scraper, and sends as native voice mail.
 * Author: Romeo Calyx / JARiF
 */

const ymcdn = require('../helpers/ymcdn');

module.exports = {
	config: {
		name: "sing",
		version: "1.0",
		author: "JARiF",
		countDown: 5,
		role: 0,
		shortDescription: {
			en: "Play music directly as a voice message from YouTube"
		},
		description: {
			en: "Converts YouTube video or song name to MP3 and sends directly as voice note, auto-deleting the wait prompt"
		},
		category: "music",
		guide: {
			en: "{p}sing <song name or YouTube URL>"
		}
	},

	langs: {
		en: {
			missingQuery: "🎵 Please provide a song name or YouTube link!\nExample: {p}sing cupid",
			wait: "⏳ Searching and converting your song, please wait...",
			caption: "🎶 Title: %1\n👤 Artist: %2\n⏱️ Duration: %3",
			error: "⚠️ Failed to fetch or convert the song: %1"
		}
	},

	onStart: async function ({ api, args, message, event, role, commandName, getLang, commands, prefix, utils }) {
		if (!args || args.length === 0) {
			return message.reply(getLang("missingQuery"));
		}

		const query = args.join(' ').trim();

		// 1. Send "please wait" message
		const waitMsg = await message.reply(getLang("wait"));

		try {
			// 2. Scrape & convert YouTube audio via YMCDN
			const songData = await ymcdn.scrape(query, { type: 'mp3' });
			if (!songData || !songData.download_url) {
				throw new Error("Could not obtain audio download URL from converter service");
			}

			// 3. Obtain audio stream using getStreamFromURL (or download buffer)
			const getStream = (global.utils && global.utils.getStreamFromURL) || (utils && utils.getStreamFromURL);
			let audioAttachment;
			if (typeof getStream === 'function') {
				try {
					audioAttachment = await getStream(songData.download_url);
				} catch (streamErr) {
					audioAttachment = songData.download_url;
				}
			} else {
				audioAttachment = songData.download_url;
			}

			const captionText = getLang(
				"caption",
				songData.title || "YouTube Audio",
				songData.author || "YouTube Artist",
				songData.duration || "Standard"
			);

			// 4. If in a voice channel or VC text chat, stream directly to voice!
			let targetVoice = null;
			if (
				message.channel.type === "GUILD_VOICE" ||
				message.channel.type === "GUILD_STAGE_VOICE" ||
				(typeof message.channel.isVoice === "function" && message.channel.isVoice())
			) {
				targetVoice = message.channel;
			} else if (message.member?.voice?.channel) {
				targetVoice = message.member.voice.channel;
			}

			const voiceController = global.GoatBot.voice || (global.JARiF && global.JARiF.voice);
			if (voiceController && message.guild) {
				const status = voiceController.getVoiceStatus(message.guild.id);
				if (targetVoice || status.isConnected) {
					try {
						await voiceController.enqueueTrack({
							guildId: message.guild.id,
							channel: targetVoice,
							textChannel: message.channel,
							track: {
								title: songData.title,
								author: songData.author,
								duration: songData.duration,
								url: songData.url,
								download_url: songData.download_url,
								streamUrl: songData.streamUrl,
								requestedBy: message.author.tag
							}
						});
					} catch (vcErr) {}
				}
			}

			// 5. Send directly as voice mail / audio attachment with caption in one message.reply({ body, attachment })
			try {
				await message.reply({
					body: captionText,
					attachment: audioAttachment,
					isAudio: true
				});
			} catch (_) {
				await message.reply(captionText);
			}

			// 6. Delete the "please wait" message (safely caught so it never triggers false error)
			try {
				if (waitMsg && typeof waitMsg.unsend === 'function') {
					await waitMsg.unsend();
				} else if (waitMsg && (waitMsg.id || waitMsg.messageID)) {
					await api.unsendMessage(waitMsg.id || waitMsg.messageID);
				}
			} catch (unsendErr) {
				// Silently catch unsend limitation without failing command
			}

		} catch (err) {
			// In case of error, update or delete wait message and inform user
			try {
				if (waitMsg && typeof waitMsg.unsend === 'function') {
					await waitMsg.unsend();
				}
			} catch (e) {}

			return message.reply(getLang("error", err.message));
		}
	}
};
