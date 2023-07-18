import config from "../config";
import { REST } from '@discordjs/rest';
import { Routes, CacheType, Interaction, InteractionType } from 'discord.js';
import * as commandModules from '../commands';

async function disableCommand(interaction: Interaction<CacheType>) {
  console.log("Disabling command due to error");
  const commands = [];
  if (interaction.type == InteractionType.ApplicationCommand) {
    const { commandName } = interaction;
    for (const module of Object.values(commandModules)) {
      // @ts-ignore: Idk why this is needed
      if(module["default"] != undefined && Object.keys(module["default"]).length == 0)
        console.log("error")

      else {
        if(commandName == module.data.name) 
          module.data.setDefaultMemberPermissions(0);
        commands.push(module.data);
      }
    }
    const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);
    rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: [] })
	    .then(() => console.log('Successfully deleted all guild commands.'))
	    .catch(console.error);

    rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: commands })
      .then(() => console.log('Successfully registered guild commands.'))
      .catch(console.error);
  } 
}

export default disableCommand;