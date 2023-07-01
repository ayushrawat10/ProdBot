const { SlashCommandBuilder } = require('@discordjs/builders');
const { google } = require('googleapis');
const express = require('express');
const app = express();
const open = require('open');
require('dotenv').config({ path: '../../.env' });
const { saveToken, getToken } = require('../../util/databasemanager/dbcalendar');

const scopes = [
	'https://www.googleapis.com/auth/calendar',
];
const oAuth2Client = new google.auth.OAuth2(
	process.env.CAL_client_id,
	process.env.CAL_client_secret,
	process.env.CAL_redirect_uris,
);
// Create an OAuth2 client
const authorizeUrl = oAuth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: scopes,
	prompt: 'consent',
});

async function getEvents(interaction, refresh_token, authClient) {
	await authClient.setCredentials({
		refresh_token: refresh_token,
	});

	try {
		const calendar = google.calendar({ version: 'v3', auth: authClient });
		const response = await calendar.events.list({
			calendarId: 'primary',
			timeMin: new Date().toISOString(),
			maxResults: 10,
			singleEvents: true,
			orderBy: 'startTime',
		});
		const responsetime = await calendar.calendarList.get({
			calendarId: 'primary',
		});
		const timezone = responsetime.data.timeZone;
		console.log(responsetime.data);
		const events = response.data.items;
		const eventList = events.map((event, index) => {
			let start = event.start.dateTime ? new Date(event.start.dateTime) : null || event.start.date ? new Date(event.start.date) : null;
			start = new Date(start);
			start = (start.getMonth() + 1).toString() + '-' + start.getDate().toString() + '-' + start.getFullYear().toString();
			return `${index + 1}. ${start} - ${event.summary}`;
		});
		return eventList;
	}
	catch (error) {
		console.error('Error fetching events:', error);
	}

}

// Store the Discord interaction for later use
let discordInteraction = null;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list_events')
		.setDescription('Creates a new event in your Google Calendar.'),
	async execute(interaction) {
		discordInteraction = interaction;
		await interaction.deferReply({ ephemeral: true });
		let events;
		let refresh_token = await getToken(interaction.user.id);
		if (refresh_token) {
			refresh_token = refresh_token.tokens;
			events = await getEvents(interaction, refresh_token, oAuth2Client);
		}

		if (!refresh_token) {
			app.get('/', async (req, res) => {
				const code = (req.query.code);
				res.send('You have been logged in, you can go back now!');
				const { tokens } = await oAuth2Client.getToken(code);
				await saveToken(interaction.user.id, tokens.refresh_token);
				events = await getEvents(interaction, tokens.refresh_token, oAuth2Client);
				server.close();
			});
			const server = app.listen(3000, () => {
				console.log('Server running on http://localhost:3000}');
				open(authorizeUrl, { wait: false }).then(cp => cp.unref());
			});
		}
		if (events) {
			await interaction.editReply(`Next 10 events:\n${events.join('\n')}`);
		}
		else {
			await interaction.editReply('Error fetching events. Please try again later.');
		}
	},
};