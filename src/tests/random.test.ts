import { execute } from "../commands/random";
import dotenv from 'dotenv';
dotenv.config();

test("Help command", async () => {
  const interaction = {
    options: {
      data: [
        {
        }
      ]
    },
    isCommand() { return true; },
    deferReply: jest.fn(),
    editReply: jest.fn()
  };

  //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.editReply).toHaveBeenCalledWith({
    components: [
      {
        components: [
          {
            custom_id: "Random_ReRoll_undefined",
            emoji: undefined,
            label: "Re-Roll",
            style: 2,
            type: 2,
          },
          {
            custom_id: "Random_ShowInfo",
            emoji: undefined,
            label: "Show Info",
            style: 3,
            type: 2,
          }
        ],
        type: 1
      }
    ],
    embeds: [
      {
        data: {
          color: 2336090,
        }
      }
    ]
  });
});