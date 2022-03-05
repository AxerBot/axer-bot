import { Client, Message, MessageEmbed } from "discord.js";
import UserNotFound from "../../data/embeds/UserNotFound";
import osuApi from "../../utils/osu/osuApi";
import getMappingAge from "./utils/getMappingAge";
import getUserGroup from "./utils/getUserGroup";
import UserNotMapper from "../../data/embeds/UserNotMapper";
import * as database from "./../../database";

export default {
	name: "mapper",
	run: async (bot: Client, message: Message, args: Array<string>) => {
		let mapper_name = args.join("_");

		message.channel.sendTyping();

		if (message.mentions.users.size != 1) {
			if (args.length < 1) {
				const u = await database.users.findOne({
					_id: message.author.id,
				});

				if (u != null) mapper_name = u.osu.username;
			}
		} else {
			const user = message.mentions.users.first();
			const u = await database.users.findOne({
				_id: user?.id,
			});

			if (u != null) mapper_name = u.osu.username;
		}

		if (mapper_name.trim() == "")
			return message.channel.send("Provide a valid user.");

		const mapper_user = await osuApi.fetch.user(mapper_name);

		if (mapper_user.status != 200)
			return message.channel.send({
				embeds: [UserNotFound],
			});

		const mapper_beatmaps = await osuApi.fetch.userBeatmaps(
			mapper_user.data.id
		);

		if (mapper_beatmaps.status != 200) return;

		if (mapper_beatmaps.data.sets.length < 1)
			return message.channel.send({
				embeds: [UserNotMapper],
			});

		const usergroup = getUserGroup(mapper_user.data);

		let e = new MessageEmbed({
			thumbnail: {
				url: `https://a.ppy.sh/${mapper_user.data.id}`,
			},
			color: usergroup.colour,
			fields: [
				{
					name: "Mapping for",
					value: getMappingAge(mapper_beatmaps.data),
				},
				{
					name: "Mapset Count",
					inline: true,
					value: `🗺️ ${mapper_beatmaps.data.sets.length} ✅ ${
						mapper_user.data.ranked_and_approved_beatmapset_count
					} ❤ ${mapper_user.data.loved_beatmapset_count} ❓ ${
						Number(mapper_user.data.pending_beatmapset_count) +
						Number(mapper_user.data.graveyard_beatmapset_count)
					}
					`,
				},
				{
					name: "Playcount & Favorites",
					inline: true,
					value: `▶ ${
						mapper_beatmaps.data.sets_playcount.toLocaleString("en-US")
					} 💖 ${
						mapper_beatmaps.data.sets_favourites.toLocaleString("en-US")
					}`,
				},
				{
					name: "Latest Map",
					value: `[${mapper_beatmaps.data.last.artist} - ${mapper_beatmaps.data.last.title}](https://osu.ppy.sh/s/${mapper_beatmaps.data.last.id})`,
				},
			],
			author: {
				name: `${mapper_user.data.username} ${usergroup.name}`,
				url: `https://osu.ppy.sh/users/${mapper_user.data.id}`,
				iconURL: usergroup.icon,
			},
			image: {
				url: mapper_beatmaps.data.last.covers["cover@2x"],
			},
		});

		message.channel.send({
			embeds: [e],
		});
	},
};
