import { Message } from "discord.js";
import parseUser from "./parseUser";
import * as database from "../../../database";
import checkCooldown from "../../general/checkCooldown";
import parseDiscussionPost from "./parseDiscussionPost";

export default async (message: Message) => {
	const links: string[] = [];
	const args = message.content.toLowerCase().trim().split(" ");
	const guild = await database.guilds.findOne({ _id: message.guildId });

	if (guild == null) return;

	if (!(await checkCooldown(guild, "osu", message.channelId, message, true)))
		return;

	args.forEach((arg) => {
		if (arg.startsWith("https://osu.ppy.sh/")) links.push(arg);
	});

	links.forEach((link) => {
		if (link.split("/").includes("users")) return parseUser(link, message);
		if (link.split("/").includes("discussion") && !link.includes("reviews"))
			return parseDiscussionPost(link, message);
	});
};