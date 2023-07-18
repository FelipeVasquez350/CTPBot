import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, APIActionRowComponent, APIMessageActionRowComponent, StringSelectMenuInteraction, Message, AutocompleteInteraction, ChannelType, ButtonInteraction } from "discord.js";
import { InfoButton, ImageMenu, SearchMenu } from '../components';
import { FetchMessageRef } from '../utils/fetch_message_reference';
import prisma from '../prisma';
import { AsciiTable3 } from "ascii-table3";
import fuzzysort from "fuzzysort";
import { Images, LocalizationTexts, Music, Sounds } from "@prisma/client";

export const data = new SlashCommandBuilder()
  .setName('info')
  .setDescription('Get info about an entity.')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('The entity name')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption(option =>
    option.setName('internal_name')
      .setDescription('The entity internal name')
      .setRequired(false)
      .setAutocomplete(true)
  );

/**
 * Executes the interaction's command code.
 * @param {CommandInteraction} interaction The istance of the interaction.
 */
export async function execute(interaction: CommandInteraction | StringSelectMenuInteraction | ButtonInteraction, message: Message<boolean> | null = null) { 
  var input = "";

  if(interaction.isCommand()) {
    if(interaction.options.data.length == 0) {
      const errorEmbed = new EmbedBuilder()
      .setColor('#D70022')
      .setTitle(`Error`)
      .setDescription(`An error has okuued.\nNo input found.`)
      .toJSON();
      interaction.reply({embeds: [errorEmbed]});            
      return;
    }
    else
    input = `${interaction.options.data[0].value}`

  }
  else if(interaction.isAnySelectMenu())
    input = interaction.values[0];
  else if(interaction.isButton())
    input = interaction.message.embeds[0].title!;

  //The prisma query structure
  const entities = await prisma.internalNames.findMany({
    where: {
      OR: [
        {name: input},
        {internal_name: input}
      ]
    },
    include: {
      Images: true,
      Sounds: true,
      Music: true,
      LocalizationTexts: true,
    }
  });

  //IF the query returns a result
  if (input != undefined && entities.length != 0) {

    var images: Images[] = [];
    var sounds: Sounds[] = [];
    var music: Music[] = [];
    var localizations: LocalizationTexts[] = [];

    // Maps to avoid duplicates
    var imagesMap: { [key: string]: boolean } = {}; 
    var soundsMap: { [key: string]: boolean } = {};
    var musicMap: { [key: string]: boolean } = {};
    var localizationsMap: { [key: string]: boolean } = {};

    for (var ent of entities) {
      for (var img of ent.Images) {
        var key = img.filename! + img.path!;
        if (!imagesMap[key]) {
          images.push(img);
          imagesMap[key] = true;
        }
      }

      for (var snd of ent.Sounds) {
        var key = snd.sound_internal_name!;
        if (!soundsMap[key]) {
          sounds.push(snd);
          soundsMap[key] = true;
        }
      }
      
      for (var msc of ent.Music) {
        var key = msc.music_title!;
        if (!musicMap[key]) {
          music.push(msc);
          musicMap[key] = true;
        }
      }

      for (var loc of ent.LocalizationTexts) {
        var key = loc.localization_id! + loc.localization_type!;
        if (!localizationsMap[key]) {
          localizations.push(loc);
          localizationsMap[key] = true;
        }
      }
    }

    const entity = {
      name: entities[0].name,
      internal_name: [ ...entities.map((entity) => entity.internal_name) ],
      Images: images,
      Sounds: sounds,
      Music: music,
      LocalizationTexts: localizations,
    }

    //If the entity has no images
    if (entity.Images.length == 0) {
      console.log(entity)
      const errorEmbed = new EmbedBuilder()
      .setColor('#D70022')
      .setTitle(`${input}`)
      .setDescription(`An error has okuued.\nNo image found.`)
      .toJSON();

      interaction.reply({content: '\n<@318776123540504577>', embeds: [errorEmbed]});            
    }
    else {
      const entityFields = [
        { name: 'Name', value: entity.name, inline: true },
        { name: 'InternalName', value: entity.internal_name.join(", "), inline: true  },
      ];

      var imageTable = new AsciiTable3().setHeading("Filename","Path","Status").setAlignCenter(0).setStyle("unicode-mix");
      var musicTable = new AsciiTable3().setHeading("Music_id").setAlignCenter(0).setStyle("unicode-mix");
      var soundTable = new AsciiTable3().setHeading("Sound_id").setAlignCenter(0).setStyle("unicode-mix");
      var localizationTable = new AsciiTable3().setHeading("Localization_id","Localization_Type").setAlignCenter(0).setStyle("unicode-mix");
      var stringTable = "```";

      var HasImages = false;
      entity.Images.map((image) => {
        if (image.status == true) {
          HasImages = true;
        }
        imageTable.addRow(image.filename, image.path, image.status);
        imageTable.toString
      }); 
      stringTable += imageTable;

      //If the entity has a music file
      if (entity.Music.length != 0) {
        entity.Music.map((music) => {
          musicTable.addRow(music.music_id);
        });
        stringTable += musicTable;
      }

      //If the entity has a sound file
      if (entity.Sounds.length != 0) {
        entity.Sounds.map((sound) => {
          soundTable.addRow(sound.sound_name);
        });
        stringTable += soundTable;
      }

      //If the entity has a localization
      if (entity.LocalizationTexts.length != 0) {
        entity.LocalizationTexts.map((localization) => {
          localizationTable.addRow(localization.localization_id, localization.localization_type);
        });
        stringTable += localizationTable;
      }
      stringTable += "```";

      if(stringTable.length > 1024) {
        const tableParts = [];
        const tableRows = stringTable.split("\n");
        let tablePart = "";
        for (const row of tableRows) {
          if (tablePart.length + row.length > 1024) {
            tablePart+= "```";
            tableParts.push(tablePart);
            tablePart = "```";
          }
          tablePart += row + "\n";
        }
        if (tablePart.length > 0) {
          tableParts.push(tablePart);
        }

        for (let i = 0; i < tableParts.length; i++) {
          entityFields.push({ name: `Data_${i}`, value: tableParts[i], inline: false });
        }

        /*
        ### FOR FUTURE REFERENCE ###
        Discord has a limit of 6000 characters per Embed
        In the very dubious and very questionable case that the table is longer than 6000 characters,
        you might want the bot to split the table in multiple Embeds
        i think, i'm not sure
        End report.
        ~ v
        */
      } else {
        entityFields.push({ name: 'Data', value: stringTable, inline: false });
      }



      const components: APIActionRowComponent<APIMessageActionRowComponent>[] = [InfoButton(entity.name.replaceAll(" ", "-"))];
      if (HasImages) 
        components.push(ImageMenu(entity.Images));

      const entityEmbed = new EmbedBuilder()
        .setColor('#23a55a')
        .setTitle(`${input}`)
        .addFields(entityFields)
        .toJSON();

      if(message != null) {

        //if the message has a reply with images, remove it
        if(message.channel.type ==  ChannelType.GuildText) {
          var messageHasReference = await FetchMessageRef(message.channel, message.id);
          if (messageHasReference != "") {
            var imageMessage = await message.channel.messages.fetch(messageHasReference);
            imageMessage.delete();
          }
          if(interaction.isAnySelectMenu())
            message.edit({ embeds: [entityEmbed], components: components });
          else
            message.delete();
        }

        //resolve the interaction request
        if(interaction.isAnySelectMenu()) {
          interaction.update({components: [SearchMenu(interaction.component.options, input), interaction.message.components[1]]});
        }
        else 
          interaction.reply({ embeds: [entityEmbed], components: components });
      }
      else interaction.reply({ embeds: [entityEmbed], components: components });  
    }
  }
  //IF the query returns no results
  else {
    const errorEmbed = new EmbedBuilder()
      .setColor('#D70022')
      .setTitle('Fail')
      .setDescription('There was no entry corresponding inside the database')
      .toJSON()
    interaction.reply({ embeds: [errorEmbed] });
  }
}

/**
 * Implementation of the autocomplete feature.
 * @param {AutocompleteInteraction} interaction The istance of the interaction.
 */
export async function autocomplete(interaction: AutocompleteInteraction) {
  const focusedValue = interaction.options.getFocused();

  var names;
  var choices: string[];

  if (interaction.options.getString('internal_name') != null) {
    names = await prisma.internalNames.findMany({
      select: {
        internal_name: true
      }
    });
    choices = fuzzysort.go(focusedValue, names, { key: 'internal_name' }).map(({ obj }) => obj.internal_name);
  }
  else {
    names = await prisma.entity.findMany({
      select: {
        name: true
      }
    });
    choices = fuzzysort.go(focusedValue, names, { key: 'name' }).map(({ obj }) => obj.name);
  }

  const filteredArray = choices.slice(0, 25);

  await interaction.respond(
    filteredArray.map(choice => ({ name: choice, value: choice })),
  );
}