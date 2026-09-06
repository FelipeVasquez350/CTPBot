import { execute } from "../commands/search";
import dotenv from 'dotenv';
import config from "../config";
dotenv.config();
config

test("Search command", async () => {
  const interaction = {
    options: {
      data: [
        {
          value: "Images"
        },
        {
          value: "Gore_3"
        }
      ],
      get(option: string) {
        return option == "type" ? { value: "Images" } : { value: "Gore_3" };
      }
    },
    isCommand() { return true; },
    isButton() { return false; },
    deferReply: jest.fn(),
    editReply: jest.fn()
  };
  //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.editReply).toHaveBeenCalledWith({
    components: [
      {
        type: 1,
        components: [
          {
            type: 3,
            placeholder: "Select the entity.",
            custom_id: "Search_Select",
            max_values: 1,
            min_values: 1,
            options: [
              {
                description: "Show the entity info",                                  
                emoji: undefined,            
                label: "Doctor Bones",       
                value: "Doctor Bones",
              },
              {
                description: "Show the entity info",
                emoji: undefined,
                label: "The Bride",
                value: "The Bride",
              },
              {
                description: "Show the entity info",
                emoji: undefined,
                label: "The Groom",
                value: "The Groom",
              },
              {
                description: "Show the entity info",
                emoji: undefined,
                label: "Zombie",
                value: "Zombie",
              }
            ]
          }
        ]
      }, 
      {   
        type: 1,
        components: [
          {
            custom_id: "Search_Previous_0_Images_Gore_3",
            disabled: true,
            emoji: undefined,
            label: "Show Previous",
            style: 3,
            type: 2,
          },
          {
            custom_id: "Search_Next_0_Images_Gore_3",
            disabled: true,
            emoji: undefined,
            label: "Show Next",
            style: 3,
            type: 2,
          },  
        ]
      }
    ],
    embeds: [
      {
        color: 2336090,
        description: "Found 4 entities",
        title: "Search results for Gore_3"
      }
    ]
  });
});