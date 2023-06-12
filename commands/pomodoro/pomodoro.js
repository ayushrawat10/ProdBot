const { SlashCommandBuilder } = require('@discordjs/builders');
const { pomodoroTimer } = require('../../util/pomodoroTimer');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pomodoro')
		.setDescription('Starts a Pomodoro session.')
		.addIntegerOption(option => option.setName('focus_time').setDescription('The duration of focus time in minutes.').setRequired(false))
		.addIntegerOption(option => option.setName('break_time').setDescription('The duration of break time in minutes.').setRequired(false)),
	async execute(interaction) {
		const focusTime = interaction.options.getInteger('focus_time') || 25;
		const breakTime = interaction.options.getInteger('break_time') || 5;
		const focusMinutesText = focusTime === 1 ? 'minute' : 'minutes';
		const breakMinutesText = breakTime === 1 ? 'minute' : 'minutes';
		const response = `Starting a Pomodoro session with ${focusTime} ${focusMinutesText} of focus time and ${breakTime} ${breakMinutesText} of break time.`;

		// Start the Pomodoro timer
		pomodoroTimer.startTimer(interaction, focusTime, breakTime);

		return await interaction.reply(response);

	},
};