import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import config from '../config';
import * as commandModules from "./";

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('To check the bot\s well-being');

export async function execute(interaction: CommandInteraction) {
  const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);
  const registeredCommands = await Object(rest.get(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID)));
  const existingCommands = Object.values(commandModules);

  const status: string[] = [];
  const commands: string[] = [];

  for (var i=0; i<existingCommands.length; i++) {
    // @ts-ignore: Idk why this is needed
    if(existingCommands[i]["default"] != undefined && Object.keys(existingCommands[i]["default"]).length == 0) {
      status.push("☣️");
      commands.push("UNKNOWN");
      continue;
    }  
    if(i<registeredCommands.length) {
      if (existingCommands[i].data["name"] === registeredCommands[i]["name"]) 
        status.push("✅"); 
      if(registeredCommands[i]["default_member_permissions"] == 0) {
        status.pop();
        status.push("❌");
      }
    }
    else 
      status.push("☑️");
    commands.push(existingCommands[i].data["name"]);
  }

  registeredCommands.forEach((command: { [x: string]: string; }) => {
    if(!commands.includes(command["name"])) {
      status.push("☣️");
      commands.push(command["name"]);
    } 
  });
  
  const embed = new EmbedBuilder()
    .setColor('#23a55a')
    .setTitle('Status')
    .addFields([
      { name: 'Commands', value: commands.join('\n'), inline: true },
      { name: 'Status', value: status.join('\n'), inline: true },
      { name: "Icons", value: "✅ Command exists and is registered\n☑️ Command exists but isn't registered\n❌ Command is registered but it's not available\n\nIf you see this lil thing ☣️, a command got erased or corrupted", inline: false },
      { name: "Ping", value: `${interaction.client.ws.ping} ms`, inline: false }
    ])
    .toJSON();
  
  interaction.reply({embeds: [embed]});
}