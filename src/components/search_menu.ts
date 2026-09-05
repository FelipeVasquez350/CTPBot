import { Entity } from '../generated/prisma/client';
import { ActionRowBuilder, APISelectMenuOption, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,  } from 'discord.js';

function isEntity(value: Entity[] | APISelectMenuOption[]): value is Entity[] {
  return (value as Entity[])[0].name !== undefined ;
}

function SearchMenu(values: Entity[] | APISelectMenuOption[], currentOptions: string = "") {
  var options: APISelectMenuOption[] = [];

  if (isEntity(values)) {
    values.map((value) => {
      options.push({
        label: value.name,
        description: 'Show the entity info',
        value: value.name,
      })
    })
  }
  else {
    values.map((value) => {
      if(value.label == currentOptions) 
        value.default = true;
      else
        value.default = false;
    })
    options = values;
  } 

  return new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('Search_Select')
        .setPlaceholder('Select the entity.')
        .setMinValues(1)
        .setMaxValues(1)
        .setOptions(options),
    )
    .toJSON();
}

export default SearchMenu;