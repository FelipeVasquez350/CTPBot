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
          description: "If you're searching on how to use the slash commands refeer to the command self-description, or visit the GitHub page linked down below this message.\n\nIf you come across any errors with the bot, notify either\n @da.im (old daim#6490) or @felipe350 (old Felipe350#5384),\nunless, of course if:\n - during 2-8am gmt+1\n- either Daim or Felipe are gone ~~once again~~\n- you are from the future by at least 20y: <t:1689713400:R>\n- the server is dead",
          fields: [
            {
              inline: true,
              name: "Version",
              value: "2.1.0"
            },
            {
              inline: true,
              name: "GitHub",
              value: "https://github.com/FelipeVasquez350/CTPBot"
            }
          ]
        }
      }
    ]
  });
});
