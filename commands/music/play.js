const { SlashCommandBuilder } = require('@discordjs/builders');
const { getVoiceConnection, createAudioPlayer, createAudioResource, joinVoiceChannel, AudioPlayerStatus } = require('@discordjs/voice');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config({ path: '../../.env' });


const credentials = {
	clientId: process.env.spotifyClientID,
	clientSecret: process.env.spotifyClientSecret,
	redirectUri: 'http://localhost:3000/callback',
};
const spotifyApi = new SpotifyWebApi(credentials);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song')
		.addStringOption((option) =>
			option.setName('query').setDescription('Song name or search query').setRequired(true)),


	async execute(interaction) {
		async function getAccessToken() {
			try {
				const data = await spotifyApi.clientCredentialsGrant();
				const accessToken = data.body['access_token'];
				return accessToken;
			}
			catch (error) {
				console.error('Failed to retrieve access token:', error);
				throw error;
			}
		}
		const accessToken = await getAccessToken();
		spotifyApi.setAccessToken(accessToken);
		const query = interaction.options.getString('query');

		try {
			const { tracks } = await (await spotifyApi.searchTracks(query, { limit: 1 })).body;
			if (tracks && tracks.items && tracks.items.length > 0) {
				const track = tracks.items[0];
				const voiceChannel = interaction.member.voice.channel;
				console.log(track);
				if (voiceChannel) {
					const connection = getVoiceConnection(voiceChannel.guild.id);

					if (connection) {
						connection.destroy();
					}

					const player = createAudioPlayer();
					const resource = createAudioResource(track.uri, { inlineVolume: true });

					player.play(resource);

					const connections = joinVoiceChannel({
						channelId: voiceChannel.id,
						guildId: voiceChannel.guild.id,
						adapterCreator: voiceChannel.guild.voiceAdapterCreator,
						selfDeaf: false,
						selfMute: false,
					});

					connections.subscribe(player);

					player.on(AudioPlayerStatus.Idle, () => {
						connections.destroy();
					});
					await interaction.reply(`Now playing: ${track.name} by ${track.artists[0].name}`);
				}
				else {
					await interaction.reply('You need to join a voice channel first.');
				}
			}
			else {
				await interaction.reply('No matching tracks found');
			}
		}
		catch (error) {
			console.error('Failed to play song:', error);
			await interaction.reply('An error occurred while playing the song');
		}
	},
};

