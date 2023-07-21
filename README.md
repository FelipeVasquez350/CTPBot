# CTPBot 2.0


Remake of the [original Calamity Texture Pack Bot](https://github.com/daim0/CTPBot) (aka sprite look up bot) that was originally created by:
- Daim (aka GitHub: [daim0](https://github.com/daim0) Discord: da.im)


and with contributions from:
- Void (aka Discord: kyx_001)
- Me (Disclaimer: I didn't have mental health insurance during those 3 Summer months of json-list writing and i still haven't recovered, neither v has and the fact this is even possible is the proof)


>Scope: Having an utility discord bot that simplifies the process of looking up the sprites and other useful info about a certain "Entity" in the game's files.
<details>
 <summary>2nd Disclaimer:</summary>
With "Entity" i'm referring to an abstract group of all the assets that are related to smth that is objectively referrable as a "single and the same thing" (for example all the images, and other assets (look at Contributing) from different NPCs, Items that are all part of smth that in-game, like variants of Zombies, Skeletons, etc but they're actually different NPCsIds, ItemIds, Gores etc...)
</details>


## Bot Commands
The bot as by today's standards uses slash commands instead of the message pattern matching with prefixes like !command.
The commands currently available are:


### Info
> /info [name] [internal_name]


Using the autocomplete function search for the desired entity and receive a list of helpful information like Images, Sounds, Music and Localizations <details>
 <summary>about the parameters</summary>(name and internal_name are optional, but for the command to work you need to choose one of them, specifically using internal_name will let you get only the info of a specific variant instead of the general group)</details>




### Search
>/search [type] [input]


If you cannot recall what a certain image you found while fumbling in your folder correlates to, you can search for it's corresponding type (in this case image) and put the filename as the input (without the .png part)


### Random
> /random [filter]


Same as info but the choice is randomized and you have a filter for the query


### Status
> /status

Details about the current status of the bot


### Stats
> /stats

Details regarding the pack version, completion rate and file errors (names, size)


### Update
> /fetchupdate


In the not-unlikely case I disappear *again* or just very lazy, this command will automatically download the latest version of the texture pack from GitHub (if you guys somehow change place again idk what to do about it you're just looking for problems ig), update the database and commit the changes to this repo (yes this means it could end up killing itself somehow but if it happens then there's no hope in making this last much longer)


### Help
> /help


Sends a message explaining in short how to use the bot


## NEW Features!
From the switch from the old 1.1.0 version to the new 2.0 apart from slash commands there are some new improvements


- Project structure went from a monolithic index.js file to a proper TypeScript project (*node modules enjoyers screaming out loud rn*)


- Moved from a JSON file dump to a sqlite database (thx prisma)


- Now the but updates automatically from github instead of an obscure and unsafe dynamic link to a file shared on discord (yeah that's how it worked before no joke)


- In case of multiple exceptions thrown from commands the bot will automatically disable them globally to avoid a complete crash, also jest tests for each command are provided (not sure if as a status command output or not V please intervene)


- Deployment moved from Heroku (bye bye free dynos) to Fly.io (how does it stay up is unknown so whenever you use it either pray/thank the devs or make a donation). This means now the bot can be self-deployed as a Docker Container! (Disclaimer: i have no idea how to make them, or even if this part i'm writing gets released alongside a public release)

## Deployment
There are two main ways to run the bot locally on your machine:

### A) Clone the repo
   These instructions assume you're operating through the command line (preferably in a GNU/Linux enviroment) but they can be done manually with the Windows file explorer or in any GUI-provided OS.

   Also you'll be required to have installed [NodeJS](https://nodejs.org/en) v20.4.0 or older in your machine, and also having the Node Package Manager aka npm installed too in the case it doesn't come pre-installed in your NodeJS installation  (as of writing v9.8.0)

1) clone/(fork for contributing) this repository
   
   (can also be done by clicking con the (only) green Code button and selecting "Download ZIP")
   > git clone https://github.com/FelipeVasquez350/CTPBot.git

2) Enter the directory
   >cd CTPBot

   2.1 If you're trying to use a fork of the project (currently this v2.0) the also run
   > git checkout v2.0

3) Copy the enviroment variables file in order to configure the bot (required in order to continue)
   >cp example.env .env

4) Open the terminal (if you haven't yet) and run the following in order to generate the bot build files.
   >npm run build

5) Once it has finished without errors (it may give warning on some packages) run the bot:

   a. in Production
   > npm start

   b. in Developement
   > npm run dev
6) After making sure the bot works remember the slash commands are per guild-only, so you'll need to run the following to make them apprear in your server (given you have put the correct GUILD_ID in the .env file)
   > npm run deploy

   To remove them you can also run
   > npm run withdraw

7) Remember the Vanilla images folder is not included with this repo, so you'll need to get them by yourself (Google TConvert)


### B) Through the Docker Image
To avoid any kind of (works on my machine, on yours does not) you can use the Docker engine to run a preconfigured enviroment to run the bot in without having to install any dependencies (apart from docker itself obviously)

Running one for the first time may seem confusing so i'm going to explain it as much as possible.

1) Make sure you have Docker installed and running, see https://docs.docker.com/engine/install/

2) Pull the image from the repository
   > docker pull ghcr.io/felipevasquez350/ctpbot:v2.0

3) Once downloaded the image there's the hard part, making sure it runs correctly, the command is the following
   > docker run -it --env-file .env -v {path_to_your_parent_images_folder}:{TERRARIA_VANILLA_FILES_PATH} ctpbot-v2
   
   Here's the breakdown
   - docker run: the base command to run an image

   - -it this will allow you to see the output of the bot in the current terminal, in case you don't want to and made sure it works use -d instead

   - --env-file .env: Here we're specifying the file to read the enviroment variables from

   - -v {path_to_your_parent_images_folder}:{TERRARIA_VANILLA_FILES_PATH}: this specifies which folder docker will mount inside the running image from your local machine (the path before ":" ) and the path it will find inside said running image (the path after ":" ). The former has to refelect the path inside the .env file for the Vanilla Images folder 

   - ctpbot-v2: the name of the image
 

## Contributing
<details>
 <summary>:)</summary>
 PLEASE SEND HELP


In the unlikely and very questionable case you wanted to contribute to this project (first of all, thank you, secondly, you might wanna go and talk to a therapist first cuz you don't know what's waiting for you) there are 2 main things that hold it back from it's original inception (even back to the v1.0).
1)  The incompleteness of the database:
For how much I would like to be able to write all of it on my own like the last time, I simply am not. As of my own stupidity and stubbornness i wanted to not just categorize and group a bunch of images to some abstract "entities" [what a reasonable and well-minded person would do :) ], but instead decided to throw also Sounds, Music and LOCALIZATIONS, let's break them down just a sec:
   - Sounds: There aren't many but they're spread across multiple entities more broadly than the butter on a piece of bread, so that's already too much
   - Music: This is actually easy, few, and fewer instances of them being used on multiple entities, so ***technically*** i could have done them but the migration part was already enough for the life of me
   - LocalizaAHAHAHAAHHAAHAHAHHAAHAHAHAHAHAHAH WHAT THE HELL WAS I THINKING


   If someone was mad enough to help with it i would be ***immensely and very passionately grateful***


2) Maintainability: While i would say  i've put a discrete amount of effort in avoiding the previous version not to tragically die every second while also trying to keep itself up with updates BY ITSELF, i will once again probably not be able to keep on working on it on the long run. It has improved stability and a much faster and simpler update process but if there's something new added there's not much to think about it, ***someone's gotta gets the hands dirty***


Any kind of genuine contributions are welcome (even if they don't address the 2 main issues above)
</details>




## License
CTPBot 2.0 is available under the MIT License, except for some Third-Party software available under other licenses (i think)
