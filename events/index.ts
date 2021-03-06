import guildCreate from "./guildCreate";
import guildMemberAdd from "./guildMemberAdd";
import guildMemberRemove from "./guildMemberRemove";
import interactionCreate from "./interactionCreate";
import messageCreate from "./messageCreate";
import messageDelete from "./messageDelete";
import messageUpdate from "./messageUpdate";
import ready from "./ready";

export default [
	guildCreate,
	guildMemberAdd,
	guildMemberRemove,
	messageCreate,
	messageDelete,
	messageUpdate,
	interactionCreate,
	ready,
];
