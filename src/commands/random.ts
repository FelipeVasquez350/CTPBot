import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ButtonInteraction } from "discord.js";
import prisma from '../prisma';
import RandButtons from "../components/random_buttons";

export const data = new SlashCommandBuilder()
  .setName('random')
  .setDescription('It\'s random!')
  .addStringOption(option =>
    option.setName('filter')
      .setDescription('The type of sprites to search for')
      .addChoices(
        { name: 'Sprited', value: 'Sprited' },
        { name: 'Not Sprited', value: 'NotSprited' },
        { name: 'Incomplete', value: 'Incomplete' },
        { name: 'Anythin\' Goes !', value: 'AnythingGoes' }
      )
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction | ButtonInteraction) {
  var input: string;

  if(interaction.isCommand()) 
    input = interaction.options.data[0].value?.toString()!;
  else
    input = interaction.message.components[0].components[0].customId!.split('_')[2];

  const embed = new EmbedBuilder()
    .setColor('#23a55a');
  
  if(input === 'Sprited' || input === 'NotSprited') {
    const entity = await prisma.internalNames.findMany({
      where: {
        Images: {
          some: {},
          every: { 
            status: input === 'Sprited' ? true : false
          },
        }
      }     
    });
    const rand = Math.floor(Math.random() * entity.length);
    embed.setTitle(`${entity[rand].name}`)
  
  }

  else if(input === 'Incomplete') {
    const entity = await prisma.internalNames.findMany({
      where: {
        OR: [ 
          {
            Images: { 
              some: { status: true },
            }
          },
          {
            Images: {
              some: { status: false },
            }
          }
        ],
        NOT: {
          OR: [
            {
              Images: {
                every: { status: true },
              }
            },
            {
              Images: {
                every: { status: false },
              }
            }
          ]
        }
      }
    });
    const rand = Math.floor(Math.random() * entity.length);
    embed.setTitle(`${entity[rand].name}`)
  }

  else if(input === 'AnythingGoes') {
    const entity = await prisma.entity.findMany();
    const rand = Math.floor(Math.random() * entity.length);
    embed.setTitle(`${entity[rand].name}`)
  }
  
  if(interaction.isCommand())
    interaction.reply({ embeds: [embed], components: [RandButtons(input)] });  
  else
    interaction.update({ embeds: [embed], components: [RandButtons(input)] });
} 