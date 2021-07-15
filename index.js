const Discord = require("discord.js");
const fs = require("fs");
const { token } = require("./botconfig");
const ytdl = require("ytdl-core");
const getYoutubeTitle = require('get-youtube-title');
const { googletoken } = require("./settings.json")
const { google, jobs_v3p1beta1 } = require("googleapis");
const { MessageButton } = require("discord-buttons");
const bot = new Discord.Client();
require("discord-buttons")(bot);

let openvideobutton;
let firstpage;
let prevpage;
let nextpage;
let lastpage;

last = {};
loop = {};
list = {};
player = {};

connection = {};
collector = {};
queuepos = {};

/*

    Google doc:

    https://developers.google.com/youtube/v3/docs/videos/list

*/

bot.on("ready", () => {
    console.log(`${bot.user.username}`);
});

addMusic = (id, serverId) => {
    if(!list.hasOwnProperty(serverId)) list[serverId] = [];
    if(list[serverId].includes(id)) return;
    list[serverId][list[serverId].length] = id;
}

newQueue = async (page, channel) => {
    queuepos[channel.guild.id] = page;
    out_1 = "";
    size_0 = 10;
    for(i=0;i<10;i++) {
        j = Math.floor(last[channel.guild.id] / size_0);
        j = page;
        pos = size_0*j+i;
        if(size_0*j+size_0-1 > list[channel.guild.id].length-1) pos = list[channel.guild.id].length-size_0+i;
        out_1 += (pos+1) + ".   ";
        out_1 += list[channel.guild.id][pos] + ((pos == last[channel.guild.id]) ? "  <---- now" : "");
        out_1 += "\n";
    }
    msg = await channel.send(out_1, {buttons: [firstpage, openvideobutton]});
    return msg;
}
editQueue = async (page, message) => {
    openvideobutton = new MessageButton().setStyle("url").setLabel("Open Track").setURL("https://youtu.be/"+list[message.guild.id][last[message.guild.id]]);
    queuepos[message.guild.id] = page;
    out_1 = "";
    out_1 = "```glsl\n";
    out_1 += "Queue contains:\n";
    out = out_1;
    size_0 = 10;
    for(i=0;i<10;i++) {
        j = Math.floor(last[message.guild.id] / size_0);
        j = page;
        pos = size_0*j+i;
        if(size_0*j+size_0-1 > list[message.guild.id].length-1) pos = list[message.guild.id].length-size_0+i;
        ii = 0;
        btten = list[message.guild.id].length-1 >= 10;
        names = [];
        for(i_0 = 0; i_0 < ((btten) ? 10 : list[message.guild.id].length); i_0++) names[i_0] = "";
        google.youtube('v3').videos.list({
            key: googletoken,
            id: list[message.guild.id][pos],
            part: 'snippet',
        }).then(async response => {
            ii++;
            ytidtitle = response.data.items[0].snippet.title;
            ytid = response.data.items[0].id;
            start = size_0*j;
            if(start+10 > list[message.guild.id].length) start = list[message.guild.id].length-10;
            idpos = list[message.guild.id].indexOf(ytid)-(start);
            // console.log(idpos);
            // console.log(ytid);
            names[idpos] = ytidtitle;
            if(ii == names.length) {
                if(start > 0) out += start + " before\n";
                for(j_1 = 0; j_1 < names.length; j_1++) {
                    out += (start+j_1+1)+".   " + names[j_1];
                    if(start+j_1 == last[message.guild.id]) out += "    # currently playing";
                    out += "\n";
                }
                if(start+10 < list[message.guild.id].length) out += (list[message.guild.id].length-start-10) + " more";
                out += "\n```";
                await message.edit(out, {buttons: [firstpage, prevpage, nextpage, lastpage, openvideobutton]});
            }
        })
        out_1 += (pos+1) + ".   ";
        out_1 += list[message.guild.id][pos] + ((pos == last[message.guild.id]) ? "  # currently here" : "");
        out_1 += "\n";
    }
    out_1 += "\n```";
    // msg = await message.edit(out_1, {buttons: [firstpage, prevpage, nextpage, lastpage, openvideobutton]});
    // return msg;
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
                    .setColor("#FF0000")
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
    } else if(message.content.toLowerCase().startsWith("?help")) {
        commands= [
            "?play [videourl | playlisturl]",
            "?pause",
            "?queue",
            "?load <name>",
            "?save <name>",
            "?jumpto <position>",
            "?next",
            "?clear",
            "?loop",
            "?stop",
            "?help"
        ];
        out = "Available commands:\n";
        for(elm in commands) {
            out += "  -"+commands[elm] + "\n";
        }
        message.channel.send(out);
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
    } else if(message.content.toLowerCase().startsWith("?jumpto ")) {
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
        number--;
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length <= number) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
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
    } else if(message.content.toLowerCase().startsWith('?next')) {
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(!message.member.voice.channelID) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`You must be in a voice Channel`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Please join a voice to play audio`)
            );
            return;
        }

        connection[message.guild.id] = await message.member.voice.channel.join();
        last[message.guild.id]++;
        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    } else if(message.content.toLowerCase().startsWith("?queue")) {
        // important:  same queue orde as editQueue
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0)  {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        openvideobutton = new MessageButton().setStyle("url").setLabel("Open Track").setURL("https://youtu.be/"+list[message.guild.id][last[message.guild.id]]);
        firstpage = new MessageButton().setStyle("grey").setID("firstPage").setLabel("<<");
        prevpage = new MessageButton().setStyle("grey").setID("lastPage").setLabel(">>");
        nextpage = new MessageButton().setStyle("grey").setID("prevPage").setLabel("<");
        lastpage = new MessageButton().setStyle("grey").setID("nextPage").setLabel(">");
        out = "```glsl\n";
        out += "Queue contains:\n";
        current = "";
        start = 0;
        start = last[message.guild.id]-5;
        start_0 = start;
        start = (start < 0) ? 0 : start;
        // console.log(start);
        // console.log(start_0);
        end = last[message.guild.id]+5-(start_0-start);
        // console.log(end);
        if(end > list[message.guild.id].length) {
            end = list[message.guild.id].length;
            if(list[message.guild.id].length < 10) start = 0;
            start = end-10;
        }
        // end = (end > list[message.guild.id].length-1) ? list[message.guild.id].length-1 : end;
        // console.log(list[message.guild.id].length-1);
        // console.log(end);
        // console.log(start);
        if(start > 0) out += ""+start+" before\n";
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
        ii = 0;
        for(i=0;i<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);i++) {
            google.youtube('v3').videos.list({
                key: googletoken,
                part: 'snippet',
                id: list[message.guild.id][start+i],
                maxResults: 200
            }).then(async response => {
                ii++;
                ytid = response.data.items[0].id;
                ytidindex = list[message.guild.id].indexOf(ytid);
                alltitle[ytidindex-start] = response.data.items[0].snippet.title;
                all[ytidindex-start] = true;
                if(alltitle.includes("")) finished = false;
                // console.log(alltitle.indexOf(""));
                if(ii == 10) finished = true;
                // console.log(alltitle);
                if(finished) {
                    for(j=0;j<((list[message.guild.id].length<10) ? list[message.guild.id].length : 10);j++) {
                        out += (start+j+1)+".   "+alltitle[j];
                        if(j == last[message.guild.id]-start) out += "      # currently here";
                        out += "\n";
                    }
                    // console.log(end);
                    // console.log(list[message.guild.id].length);
                    if(end < list[message.guild.id].length) out += (list[message.guild.id].length-end) + " more\n";
                    buttonlist = [];
                    buttonlist[buttonlist.length] = firstpage;
                    buttonlist[buttonlist.length] = prevpage;
                    buttonlist[buttonlist.length] = nextpage;
                    buttonlist[buttonlist.length] = lastpage;
                    buttonlist[buttonlist.length] = openvideobutton;
                    let msg = await message.channel.send(out+"```", {buttons: buttonlist});
                    possible = list[message.guild.id].length/10;
                    if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
                    else possible = Math.floor(possible);
                    queuepos[message.guild.id] = Math.floor(last[message.guild.id] / 10);
                    if(last[message.guild.id] > list[message.guild.id].length-5) queuepos[message.guild.id] = Math.floor(last[message.guild.id] / 10) + 1;
                    // const msg_0 = await newQueue(Math.floor(last[message.guild.id] / 10), message.channel);
                }
            })
        }
    } else if(message.content.toLowerCase().startsWith('?play')) {
        if(player.hasOwnProperty(message.guild.id)) player[message.guild.id].resume();
        if(!list.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Queue is empty`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(`Add music to queue to play music`)
            );
            return;
        }
        if(!message.member.voice.channelID) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
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
    } else if(message.content.toLowerCase().startsWith("?loop")) {
        if(loop[message.guild.id]) {
            loop[message.guild.id] = false;
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Loop disabled`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        } else {
            loop[message.guild.id] = true;
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#00FF00")
                .setTitle(`Loop Enabled`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        }
    } else if(message.content.toLowerCase().startsWith("?pause")) {
        if(player.hasOwnProperty(message.guild.id))
            player[message.guild.id].pause();
    } else if(message.content.toLowerCase().startsWith("?stop")){
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

bot.on('clickButton', async button => {
    console.log(button.id);
    if(button.id == "firstPage") {
        button.reply.defer();
        // console.log(queuepos[button.message.guild.id]);
        editQueue(0, button.message);
    }
    if(button.id == "lastPage") {
        button.reply.defer();
        possible = list[button.message.guild.id].length/10;
        if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
        else possible = Math.floor(possible);
        // console.log(queuepos[button.message.guild.id]);
        editQueue(possible-1, button.message);
    }
    if(button.id == "nextPage") {
        button.reply.defer();
        possible = list[button.message.guild.id].length/10;
        if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
        else possible = Math.floor(possible);
        // console.log(queuepos);
        pos = queuepos[button.message.guild.id]+1;
        pos = (pos>possible-1) ? possible-1 : pos;
        // console.log(queuepos[button.message.guild.id]);
        // console.log(pos);
        editQueue(pos, button.message);
    }
    if(button.id == "prevPage") {
        button.reply.defer();
        pos = queuepos[button.message.guild.id]-1;
        pos = (pos < 0) ? 0 : pos;
        // console.log(queuepos[button.message.guild.id]);
        // console.log(pos);
        editQueue(pos, button.message);
    }
});

bot.login(token);