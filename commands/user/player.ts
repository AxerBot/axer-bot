import { Client, CommandInteraction, Message } from "discord.js";
import UserNotFound from "../../responses/embeds/UserNotFound";
import getTraceParams from "../../helpers/commands/getTraceParams";
import osuApi from "../../helpers/osu/fetcher/osuApi";
import checkMessagePlayers from "../../helpers/osu/player/checkMessagePlayers";
import PlayerEmbed from "../../responses/osu/PlayerEmbed";
import checkCommandPlayers from "../../helpers/osu/player/checkCommandPlayers";

export default {
	name: "player",
	help: {
		description: "Check statistics for a player",
		syntax: "{prefix}player `<name|mention>` `<-?mode>`",
		example:
			"{prefix}player `Hivie` `-osu`\n {prefix}player <@341321481390784512> ",
		note: "You won't need to specify your username if you set yourself up with this command:\n`{prefix}osuset user <username>`",
	},
	category: "osu",
	config: {
		type: 1,
		options: [
			{
				name: "user",
				description: "By user mention (This doesn't ping the user)",
				type: 6,
				max_value: 1,
			},
			{
				name: "username",
				description: "By username",
				type: 3,
				max_value: 1,
			},
			{
				name: "mode",
				description: "Game mode info to view",
				type: 3,
				max_value: 1,
				choices: [
					{
						name: "osu",
						value: "osu",
					},
					{
						name: "taiko",
						value: "taiko",
					},
					{
						name: "catch",
						value: "fruits",
					},
					{
						name: "mania",
						value: "mania",
					},
				],
			},
		],
	},
	interaction: true,
	run: async (bot: Client, command: CommandInteraction, args: string[]) => {
		await command.deferReply();

		const modeInput = command.options.get("mode");
		const mode = modeInput ? modeInput.value?.toString() : undefined;

		let { playerName, status } = await checkCommandPlayers(command);

		const player = await osuApi.fetch.user(playerName, mode);

		if (status != 200)
			return command.editReply({
				embeds: [UserNotFound],
				allowedMentions: {
					repliedUser: false,
				},
			});

		if (!player.data.is_active)
			return command.editReply({
				embeds: [
					{
						title: "Umm...",
						description: `This user isn't active on this gamemode.`,
						color: "#ea6112",
					},
				],
				allowedMentions: {
					repliedUser: false,
				},
			});

		return PlayerEmbed.reply(player, command, mode);
	},
};
