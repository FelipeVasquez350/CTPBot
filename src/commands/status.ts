import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";
import { Routes } from 'discord-api-types/v9';
import { REST } from '@discordjs/rest';
import config from '../config';
import * as commandModules from "./";

export const data = new SlashCommandBuilder()
  .setName('status')
  .setDescription('To check the bot\s well-being');

function pad(s: number){
  return (s < 10 ? '0' : '') + s;
}

function format(sec: number){
  var hours = Math.floor(sec / (60*60));
  var minutes = Math.floor(sec % (60*60) / 60);
  var seconds = Math.floor(sec % 60);
  
  var string = '';

  if (hours > 0) {
    string += pad(hours) + 'h ';
  }
  if (minutes > 0 || hours > 0) {
    string += pad(minutes) + 'm ';
  }
  string += pad(seconds) + 's';
  
  return string;
}

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
    for(var j=0; j<registeredCommands.length; j++) {
      if (existingCommands[i].data["name"] === registeredCommands[j]["name"]) 
        status.push("✅"); 
      if(registeredCommands[j]["default_member_permissions"] == 0) {
        status.pop();
        status.push("❌");
      }
    }
    if(i>=registeredCommands.length)
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
      { name: "Icons", value: "✅ Command exists and is registered\n☑️ Command exists but isn't registered\n❌ Command is registered but isn't available\n\nIf you see this lil thing ☣️, a command got erased or corrupted,\ntherefore please send help.", inline: false },
      { name: "Ping", value: `${interaction.client.ws.ping} ms`, inline: true },
      { name: "Uptime", value: `${format(process.uptime())}`, inline: true}
    ])
    .toJSON();
  
  await interaction.reply({embeds: [embed]});
}