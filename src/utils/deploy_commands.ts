import config from "../config";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import * as commandModules from "../commands";

const commands = [];

for (const module of Object.values(commandModules)) {
	commands.push(module.data);
}

const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);
rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: commands })
	.then(() => console.log('Successfully registered guild commands.'))
	.catch(console.error);

