import { execute } from "../commands/status";
import dotenv from 'dotenv';
dotenv.config();

test("Status command", async () => {
  const interaction = {
    client: {
      ws: {
        ping: 0
      }
    },
    reply: jest.fn()
  };

  //@ts-ignore // I'm not going to mock the whole interaction object. fuck that
  await execute(interaction);
  expect(interaction.reply).toHaveBeenCalledWith({
    embeds: [
      {
        title: "Status",
        color: 2336090,
        fields: [
          {
            inline: true,
            name: "Commands",
            value: "help\ninfo\nrandom\nsearch\nstats\nstatus"
          },
          {
            inline: true,
            name: 'Status',
            //depends on what is registered on the guild
            value: expect.any(String)
          },
          {
            inline: false,
            name: 'Icons',
            value: "✅ Command exists and is registered\n☑️ Command exists but isn't registered\n❌ Command is registered but isn't available\n\nIf you see this lil thing ☣️, a command got erased or corrupted,\ntherefore please send help."
          },
          {
            inline: true,
            name: 'Ping',
            value: "0 ms"
          },
          {
            inline: true,
            name: 'Uptime',
            value: expect.any(String)
          }
        ]
      }
    ]
  });
});
