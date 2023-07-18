import { execute } from "../commands/help";
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
    reply: jest.fn()
  };

  //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({
    embeds: [
      {
        data: {
          title: "Help",
          color: 2336090,
          description: "If you come across any errors with the bot, notify either\n @da.im (old daim#6490) or @felipe350 (old Felipe350#5384),\nunless, of course if:\n - during 2-8am gmt+1\n- either Daim or Felipe are gone ~~once again~~\n- you are from the future by at least 20y: <t:1689713400:R>\n- the server is dead",
          fields: [
            {
              inline: true,
              name: "Version",
              value: "pre-alpha 2.0.0"
            },
            {
              inline: true,
              name: 'GitHub', 
              value: "https://github.com/daim0/CTPBot/tree/v2.0"
            }
          ]
        }
      }
    ]
  });
});