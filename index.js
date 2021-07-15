const Discord = require("discord.js");
const fs = require("fs");
const { token } = require("./botconfig");
const ytdl = require("ytdl-core");
const getYoutubeTitle = require('get-youtube-title');
const { googletoken } = require("./settings.json")
const { google } = require("googleapis");
const bot = new Discord.Client();

last = {};
loop = {};
list = {};
player = {};

connection = {};

bot.on("ready", () => {
    // console.log(`${bot.user.username}`);
});

addMusic = (id, serverId) => {
    if(!list.hasOwnProperty(serverId)) list[serverId] = [];
    if(list[serverId].includes(id)) return;
    list[serverId][list[serverId].length] = id;
}

bot.on("message", async message => {
    if(message.author.bot) return;
    if(message.content.toLowerCase().startsWith('?play ')) {
        link = message.content.replace("?play ", "");
        if(!link.startsWith('https://youtu') && !link.startsWith('https://www.youtu')) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`You have to use a youtube link.`)
                .setThumbnail(message.author.displayAvatarURL())
            );
            return;
        }
        id = link.split("//")[1];
        if(!id.includes("playlist")) {
            if(id.startsWith("youtu.be")) {
                id = id.split("?")[0];
                if(id.includes("&")) id = id.split("&")[0];
                id = id.replace("youtu.be/", "");
                // console.log(id);
            } else {
                id = id.split("?")[1];
                if(id.includes("&")) id = id.split("&")[0];
                id = id.replace("v=", "");
                // console.log(id);
            }
            addMusic(id, message.guild.id);
            // if(!list.hasOwnProperty(message.guild.id)) list[message.guild.id] = [];
            // list[message.guild.id][list[message.guild.id].length] = id;
            if(!message.member.voice.channelID) {
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("red")
                    .setTitle(`You must be in a voice Channel`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(`Please join a voice to play audio`)
                );
                return;
            }
            // console.log(list[message.guild.id]);
            if(!connection.hasOwnProperty(message.guild.id)) {
                connection[message.guild.id] = await message.member.voice.channel.join();
                last[message.guild.id] = 0;
                play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
            }
        } else {
            id = id.split("list=")[1];
            // console.log(googletoken);
            google.youtube('v3').playlistItems.list({
                key: googletoken,
                part: 'snippet',
                playlistId: id,
                maxResults: 200
            }).then(async response => {
                for(elm in response.data.items) {
                    // console.log(response.data.items[elm].snippet.resourceId.videoId);
                    addMusic(response.data.items[elm].snippet.resourceId.videoId, message.guild.id);
                }
                if(!connection.hasOwnProperty(message.guild.id)) {
                    connection[message.guild.id] = await message.member.voice.channel.join();
                    last[message.guild.id] = 0;
                    play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
                }
            })
        }
    } else if(message.content.toLowerCase().startsWith("?save")) {
        // console.log("test");
        queuename = message.content.toLowerCase().replace("?save ", "");
        // console.log(queuename);
        let rawdata = fs.readFileSync('queue.json');
        let data = JSON.parse(rawdata);
        // console.log(data);
        if(!data.queues.hasOwnProperty(message.guild.id)) {
            data.servers[message.guild.id] = [];
            data.queues[message.guild.id] = {};
        }
        if(!data.servers[message.guild.id].includes(queuename)) data.servers[message.guild.id][data.servers[message.guild.id].length] = queuename;
        data.queues[message.guild.id][queuename] = list[message.guild.id];
        // console.log(data);
        fs.writeFileSync('queue.json', JSON.stringify(data));
    } else if(message.content.toLowerCase().startsWith("?load ")) {
        queuename = message.content.toLowerCase().replace("?load ", "");
        let rawdata = fs.readFileSync('queue.json');
        let data = JSON.parse(rawdata);
        if(data.queues.hasOwnProperty(message.guild.id)) {
            if(data.servers[message.guild.id].includes(queuename)) {
                list[message.guild.id] = data.queues[message.guild.id][queuename];
            }
        }
    }
    else if(message.content.toLowerCase().startsWith("?jumpto ")) {
        number = message.content.toLowerCase().replace("?jumpto ", "");
        if(isNaN(number)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Please use a Number`)
                .setThumbnail(message.author.displayAvatarURL())
            );
            return;
        }
        number = Number(number);
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length <= number) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is not that large`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        last[message.guild.id] = number;
        connection[message.guild.id] = await message.member.voice.channel.join();
        // last[message.guild.id] = 0;
        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    }
    else if(message.content.toLowerCase().startsWith("?queue")) {
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0)  {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        out = "```glsl\n";
        out += "Queue contains:\n";
        current = "";
        start = 0;
        start = last[message.guild.id]-5;
        start_0 = start;
        start = (start < 0) ? 0 : start;
        end = last[message.guild.id]+5-(start_0-start);
        // console.log(start);
        // console.log(end);
        getYoutubeTitle(list[message.guild.id][last[message.guild.id]], function (err, title) {
            if(err) return console.log(err);
            current = title;
            // console.log(current);
        });
        finished = false;
        all = [];
        alltitle = [];
        for(i=0;i<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);i++) {
            alltitle[i] = "";
        }
        for(i=0;i<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);i++) {
            all[i] = false;
        }
        for(i=0;i<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);i++) {
            google.youtube('v3').videos.list({
                key: googletoken,
                part: 'snippet',
                id: list[message.guild.id][i],
                maxResults: 200
            }).then(async response => {
                ytid = response.data.items[0].id;
                ytidindex = list[message.guild.id].indexOf(ytid);
                alltitle[ytidindex-start] = response.data.items[0].snippet.title;
                all[ytidindex-start] = true;
                if(alltitle.includes("")) finished = false;
                // console.log(alltitle.indexOf(""));
                if(alltitle.indexOf("") == -1) finished = true;
                // console.log(alltitle);
                if(finished) {
                    for(j=0;j<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);j++) {
                        out += "- "+alltitle[j];
                        if(j == last[message.guild.id]-start) out += "      # currently here";
                        out += "\n";
                    }
                    message.channel.send(out+"```");
                }
            })
        }
    }
    else if(message.content.toLowerCase().startsWith('?play')) {
        if(player.hasOwnProperty(message.guild.id)) player[message.guild.id].resume();
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(!message.member.voice.channelID) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`You must be in a voice Channel`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Please join a voice to play audio`)
            );
            return;
        }

        connection[message.guild.id] = await message.member.voice.channel.join();
        last[message.guild.id] = 0;
        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    } else if(message.content.toLowerCase().startsWith("?clear")){
        if(list.hasOwnProperty(message.guild.id)) {
            list[message.guild.id] = [];
        }
    }
    else if(message.content.toLowerCase().startsWith("?loop")) {
        if(loop[message.guild.id]) {
            loop[message.guild.id] = false;
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("red")
                .setTitle(`Loop disabled`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        } else {
            loop[message.guild.id] = true;
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("green")
                .setTitle(`Loop Enabled`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        }
    }
    else if(message.content.toLowerCase().startsWith("?pause")) if(player.hasOwnProperty(message.guild.id)) player[message.guild.id].pause();
    else if(message.content.toLowerCase().startsWith("?stop")){
        if(connection.hasOwnProperty(message.guild.id)) {
            last[message.guild.id] = 0;
            connection[message.guild.id].channel.leave();
        }
    }
})

play = async (url, connection, serverId) => {
    // console.log(url);
    const stream = await ytdl(url, {filter:'audioonly'});
    player[serverId] = connection.play(stream, {seek: 0, volume: 0.5})
        .on('finish', () => {
            last[serverId]++;
            if(loop[serverId]) {
                if(last[serverId] == list[serverId].length) last[serverId] = 0;
                play(list[serverId][last[serverId]], connection, serverId);
            } else {
                if(last[serverId] != list[serverId].length) {
                    play(list[serverId][last[serverId]], connection, serverId);
                } else {
                    connection.channel.leave();
                }
            }
        });
}

bot.login(token);