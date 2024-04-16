# Discord Music Bot

## How to use
```bash
git clone git@github.com:LukasHuth/MusicBot.git
cd MusicBot
npm install
# only update if it doesnt breaks the bot
# if it breaks just redownload and don't update (typical js)
npm update
touch settings.json
touch botconfig.json
```
add followinf data to `settings.json`
```json
{
    "googletoken": "<google api token>"
}
```
add following data to `botconfig.json`
```json
{
    "token": "<discord bot token>",
    "prefix": "<message prefix you want>"
}
```

## Info
This music bot is so old that at the time of creation slash commands didn't exist.
In the meantime the google api changed aswell so that the queue command is currently bugged.

## Commands

### ?play
play music from queue

### ?play <link>
add video or playlist to queue

### ?queue
list next 5 and previous 5 tracks

### ?save <name>
save queue

### ?load <name>
load queue

### ?help
view all commnds

### ?next
play next track

### ?current
list infos about current track

## todo

### ?listsaved alias ?ls
list saved queues
