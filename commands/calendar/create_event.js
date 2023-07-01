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

async function getUserTimezone(authClient) {
	const calendar = google.calendar({ version: 'v3', auth: authClient });
	const responsetime = await calendar.calendarList.get({
		calendarId: 'primary',
	});
	return responsetime.data.timeZone;
}
async function getTimeZoneOffset(authClient) {
	try {
		const calendar = google.calendar({ version: 'v3', auth: authClient });
		const response = await calendar.calendarList.get({ calendarId: 'primary' });
		const timeZone = response.data.timeZone;
		const timezoneOffset = new Date().toLocaleTimeString('en', { timeZoneName: 'short' }).split(' ')[2];
		console.log(`${timeZone} ${timezoneOffset}`);
		return `${timeZone} ${timezoneOffset}`;
	}
	catch (error) {
		console.error('Error getting time zone offset:', error);
	}
}

function parseMilitaryTime(militaryTime) {
	const hour = parseInt(militaryTime.slice(0, 2), 10);
	const minute = parseInt(militaryTime.slice(2), 10);

	return { hour, minute };
}

// Store the Discord interaction for later use
let discordInteraction = null;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_event')
		.setDescription('Creates a new event in your Google Calendar.')
		.addStringOption(option =>
			option.setName('summary')
				.setDescription('Event summary')
				.setRequired(true),
		)
		.addStringOption(option =>
			option.setName('event_date')
				.setDescription('Event date (YYYY-MM-DD)')
				.setRequired(false),
		)
		.addStringOption(option =>
			option.setName('start_time')
				.setDescription('Start Time (Military Time)')
				.setRequired(false),
		)
		.addStringOption(option =>
			option.setName('end_time')
				.setDescription('End Time (Military Time)')
				.setRequired(false),
		).addStringOption(option =>
			option.setName('attendees')
				.setDescription('Add these attendees to the event')
				.setRequired(false),
		),
	async execute(interaction) {
		discordInteraction = interaction;
		await interaction.deferReply({ ephemeral: true });
		let refresh_token = await getToken(interaction.user.id);
		if (refresh_token) {
			refresh_token = refresh_token.tokens;
		}
		if (!refresh_token) {
			app.get('/', async (req, res) => {
				const code = (req.query.code);
				res.send('You have been logged in, you can go back now!');
				const { tokens } = await oAuth2Client.getToken(code);
				refresh_token = tokens.refresh_token;
				await saveToken(interaction.user.id, tokens.refresh_token);
				server.close();
			});
			const server = app.listen(3000, () => {
				console.log('Server running on http://localhost:3000}');
				open(authorizeUrl, { wait: false }).then(cp => cp.unref());
			});
		}
		oAuth2Client.setCredentials({
			refresh_token: refresh_token,
		});
		const date = interaction.options.getString('event_date') || new Date().toISOString().slice(0, 10);
		const startTime = interaction.options.getString('start_time');
		const endTime = interaction.options.getString('end_time');
		const description = interaction.options.getString('summary');
		const attendees = interaction.options.getString('attendees');
		const event = {
			summary: description,
			start: {},
			end: {},
			attendees: [],
		};
		if (attendees) {
			const attendeeList = attendees.split(',').map((attendee) => attendee.trim());
			event.attendees = attendeeList.map((attendee) => ({ email: attendee }));
		}
		console.log(event.attendees);

		const timeZone = await getUserTimezone(oAuth2Client);
		if (startTime && endTime) {
			event.start.timeZone = timeZone;
			event.end.timeZone = timeZone;
			const startMilitaryTime = startTime.replace(/:/g, '');
			const endMilitaryTime = endTime.replace(/:/g, '');
			const startTimeObj = parseMilitaryTime(startMilitaryTime);
			const endTimeObj = parseMilitaryTime(endMilitaryTime);
			event.start.dateTime = `${date}T${startTimeObj.hour.toString().padStart(2, '0')}:${startTimeObj.minute.toString().padStart(2, '0')}:00`;
			event.end.dateTime = `${date}T${endTimeObj.hour.toString().padStart(2, '0')}:${endTimeObj.minute.toString().padStart(2, '0')}:00`;
		}
		else {
			event.start.date = date;
			event.end.date = date;
		}
		const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
		calendar.events.insert({
			calendarId: 'primary',
			resource: event,
		}, (err, res) => {
			if (err) {
				console.error('Error creating event:', err);
				interaction.editReply('An error occurred while creating the event. Please try again.');
			}
			else {
				console.log('Event created:', res.data);
				interaction.editReply(`Event created successfully! Here's the link: ${res.data.htmlLink}`);
			}
		});
	},
};