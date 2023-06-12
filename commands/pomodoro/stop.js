const { SlashCommandBuilder } = require('@discordjs/builders');
const { pomodoroTimer } = require('../../util/pomodoroTimer');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the Pomodoro session.'),
	async execute(interaction) {
		const response = 'Stopping your Pomodoro session';
		await interaction.reply(response);
		pomodoroTimer.stopTimer(interaction);
	},
};