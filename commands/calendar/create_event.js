const { SlashCommandBuilder } = require('@discordjs/builders');
const { google } = require('googleapis');
const express = require('express');
const opn = require('opn');
require('dotenv').config({ path: '../../.env' });


// Create an OAuth2 client

const client_id = process.env.CAL_CLIENT_ID;
const client_secret = process.env.CAL_CLIENT_SECRET;
const redirect_uris = process.env.CAL_redirect_uri;
const oAuth2Client = new google.auth.OAuth2(
	client_id,
	client_secret,
	redirect_uris,
);
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Store the Discord interaction for later use
let discordInteraction = null;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_event')
		.setDescription('Creates a new event in your Google Calendar.')
		.addStringOption(option =>
			option.setName('summary').setDescription('Event summary').setRequired(true),
		)
		.addStringOption(option =>
			option.setName('start_date').setDescription('Start date (YYYY-MM-DD)').setRequired(true),
		)
		.addStringOption(option =>
			option.setName('end_date').setDescription('End date (YYYY-MM-DD)').setRequired(true),
		),
	token: String,
	async execute(interaction) {
		discordInteraction = interaction;

		// Generate the authorization URL
		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES,
		});

		// Open the authorization URL in the default browser
		opn(authUrl);

		// Start the web server to handle the OAuth2 redirect
		const app = express();
		app.get('/oauth2callback', async (req, res) => {
			const { code } = req.query;

			try {
				// Exchange the authorization code for an access token
				const { tokens } = await oAuth2Client.getToken(code);
				const accessToken = tokens.access_token;

				// Save the access token for the user (e.g., in a database)
				// Replace with your token saving logic
				// saveTokenForUser(interaction.user.id, accessToken);
				this.token = accessToken;
				oAuth2Client.setCredentials({ access_token: accessToken });
				// Close the web server
				server.close();

				// Call the create event logic again
				await this.execute(discordInteraction);
			}
			catch (error) {
				console.error('Error retrieving access token:', error);
				await interaction.reply('An error occurred while retrieving the access token.');
			}
		});
		async function createEvent(eventData) {
			const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

			try {
				const response = await calendar.events.insert({
					// Use 'primary' for the user's primary calendar
					calendarId: 'primary',
					requestBody: eventData,
				});

				console.log('Event created successfully:', response.data);
				return response.data;
			}
			catch (error) {
				console.error('Error creating event:', error);
				throw error;
			}
		}
		const event = {
			summary: 'My Event',
			start: {
				dateTime: '2023-06-13T10:00:00',
				timeZone: 'America/New_York',
			},
			end: {
				dateTime: '2023-06-13T12:00:00',
				timeZone: 'America/New_York',
			},
		};

		const server = app.listen(3000, () => {
			console.log('Web server started on port 3000');
		});

		createEvent(event);
	},
};
