const Discord = require("discord.js");
const fs = require("fs");
const { token, prefix } = require("./botconfig");
const ytdl = require("ytdl-core");
const getYoutubeTitle = require('get-youtube-title');
const { googletoken } = require("./settings.json")
const { google } = require("googleapis");
const { MessageButton } = require("discord-buttons");
const bot = new Discord.Client();
require("discord-buttons")(bot);

let openvideobutton;
let firstpage = new MessageButton().setStyle("blurple").setID("firstPage").setLabel("<<");
let prevpage = new MessageButton().setStyle("blurple").setID("prevPage").setLabel("<");
let nextpage = new MessageButton().setStyle("blurple").setID("nextPage").setLabel(">");
let lastpage = new MessageButton().setStyle("blurple").setID("lastPage").setLabel(">>");

// prefix = "?";

last = {};
loop = {};
looptrack = {};
list = {};
player = {};

connection = {};
collector = {};
queuepos = {};

/*

    Google doc:

    https://developers.google.com/youtube/v3/docs/videos/list

*/

/*

    command to list saved queues

*/

bot.on("ready", () => {
    console.log(`${bot.user.username}`);
});

editButtons = (pos, possible) => {
    if(pos == 0) {
        firstpage.setStyle("grey").setDisabled(true);
        prevpage.setStyle("grey").setDisabled(true);
        lastpage.setStyle("blurple").setDisabled(false);
        nextpage.setStyle("blurple").setDisabled(false);
        return;
    }
    if(pos == possible-1) {
        firstpage.setStyle("blurple").setDisabled(false);
        prevpage.setStyle("blurple").setDisabled(false);
        lastpage.setStyle("grey").setDisabled(true);
        nextpage.setStyle("grey").setDisabled(true);
        return;
    }
    firstpage.setStyle("blurple").setDisabled(false);
    prevpage.setStyle("blurple").setDisabled(false);
    lastpage.setStyle("blurple").setDisabled(false);
    nextpage.setStyle("blurple").setDisabled(false);
    return;
}

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
        // j = Math.floor(last[message.guild.id] / size_0);
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
            part: 'snippet,contentDetails',
        }).then(async response => {
            ii++;
            ytidtitle = response.data.items[0].snippet.title;
            ytid = response.data.items[0].id;
            start = size_0*j;
            if(start+10 > list[message.guild.id].length) start = list[message.guild.id].length-10;
            idpos = list[message.guild.id].indexOf(ytid)-(start);
            // console.log(idpos);
            // console.log(ytid);
            time = "";
            rest = response.data.items[0].contentDetails.duration.replace("PT", "");
            if(rest.includes("H")) {
                time += rest.split("H")[0] + ":";
                rest = rest.split("H")[1];
            }
            if(rest.includes("M")) {
                num = rest.split("M")[0];
                if(Number(num)<10) num = "0"+num;
                time += num + ":";
                rest = rest.split("M")[1];
            } else {
                if(time != "") time += "00:";
            }
            if(rest.includes("S")) {
                num = rest.split("S")[0];
                if(Number(num)<10) num = "0"+num;
                time += num;
            } else {
                if(time != "") time += "00";
            }
            names[idpos] = stringsize(30, ytidtitle) + "       " + time;
            if(ii == names.length) {
                if(start > 0) out += start + " before\n";
                for(j_1 = 0; j_1 < names.length; j_1++) {
                    out += (start+j_1+1)+".   " + names[j_1];
                    if(last.hasOwnProperty(message.guild.id)) if(start+j_1 == last[message.guild.id]) out += "    # currently playing";
                    out += "\n";
                }
                if(start+10 < list[message.guild.id].length) out += (list[message.guild.id].length-start-10) + " more";
                out += "\n```";
                await message.edit(out, {buttons: [firstpage, prevpage, nextpage, lastpage, openvideobutton]});
            }
        })
    }
}

bot.on("message", async message => {
    if(message.author.bot) return;
    if(message.content.toLowerCase().startsWith(prefix+'play ')) {
        link = message.content.replace(prefix+"play ", "");
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
                maxResults: 500
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
    } else if(message.content.toLowerCase().startsWith(prefix+"help")) {
        commands= [
            prefix+"play [videourl | playlisturl]",
            prefix+"pause",
            prefix+"queue",
            prefix+"load <name>",
            prefix+"save <name>",
            prefix+"jumpto <position>",
            prefix+"next   alias  "+prefix+"skip",
            prefix+"back",
            prefix+"shuffle",
            prefix+"listqueues   alias  "+prefix+"ls",
            prefix+"clear",
            prefix+"loop",
            prefix+"stop",
            prefix+"help"
        ];
        out = "Available commands:\n";
        for(elm in commands) {
            out += "  -"+commands[elm] + "\n";
        }
        message.channel.send(out);
    } else if(message.content.toLowerCase().startsWith(prefix+"save")) {
        // console.log("test");
        queuename = message.content.toLowerCase().replace(prefix+"save ", "");
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
    } else if(message.content.toLowerCase().startsWith(prefix+"load ")) {
        queuename = message.content.toLowerCase().replace(prefix+"load ", "");
        let rawdata = fs.readFileSync('queue.json');
        let data = JSON.parse(rawdata);
        if(data.queues.hasOwnProperty(message.guild.id)) {
            if(data.servers[message.guild.id].includes(queuename)) {
                list[message.guild.id] = data.queues[message.guild.id][queuename];
            }
        }
    } else if(message.content.toLowerCase().startsWith(prefix+"listqueues") || message.content.toLowerCase().startsWith(prefix+"ls")) {
        let rawdata = fs.readFileSync('queue.json');
        let data = JSON.parse(rawdata);
        out = "```";
        out += "Saved Queues:\n"
        if(data.queues.hasOwnProperty(message.guild.id)) {
            if(data.servers[message.guild.id].includes(queuename)) {
                for(item in data.servers[message.guild.id]) {
                    out += data.servers[message.guild.id][item] + "    ("+data.queues[message.guild.id][data.servers[message.guild.id][item]].length+" tracks)\n";
                }
            }
        }
        out += "```";
        message.channel.send(out);
    } else if(message.content.toLowerCase().startsWith(prefix+"jumpto ")) {
        number = message.content.toLowerCase().replace(prefix+"jumpto ", "");
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
    } else if(message.content.toLowerCase().startsWith(prefix+'next') || message.content.toLowerCase().startsWith(prefix+'skip')) {
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
        var_play = true;
        if(last[message.guild.id]+1 < list[message.guild.id].length) last[message.guild.id]++;
        else{
            if(!loop.hasOwnProperty(message.guild.id)) {
                message.channel.send("```Reaced end of queue and stopped playing!```");
                connection[message.guild.id].channel.leave();
                return;
            }
            if(loop[message.guild.id] == false) {
                message.channel.send("```Reaced end of queue and stopped playing!```");
                connection[message.guild.id].channel.leave();
                return;
            }
            last[message.guild.id]=0;
        }
        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    } else if(message.content.toLowerCase().startsWith(prefix+'back')) {
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
        var_play = true;
        if(last[message.guild.id]-1 != 0) last[message.guild.id]--;
        else{
            if(!loop.hasOwnProperty(message.guild.id)) {
                message.channel.send("```Reaced start of queue and stopped playing!```");
                connection[message.guild.id].channel.leave();
                return;
            }
            if(loop[message.guild.id] == false) {
                message.channel.send("```Reaced start of queue and stopped playing!```");
                connection[message.guild.id].channel.leave();
                return;
            }
            last[message.guild.id]=list[message.guild.id].length-1;
        }
        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    } else if(message.content.toLowerCase().startsWith(prefix+'shuffle')) {
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

        shuffle(list[message.guild.id]);

        play(list[message.guild.id][last[message.guild.id]], connection[message.guild.id], message.guild.id);
    } else if(message.content.toLowerCase().startsWith(prefix+"queue")) {
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
        playing = true;
        if(!last.hasOwnProperty(message.guild.id)) playing = false;
        openvideobutton = new MessageButton().setStyle("url").setLabel("Open Track").setURL("https://youtu.be/"+list[message.guild.id][last[message.guild.id]]);
        firstpage = new MessageButton().setStyle("blurple").setID("firstPage").setLabel("<<");
        prevpage = new MessageButton().setStyle("blurple").setID("prevPage").setLabel("<");
        nextpage = new MessageButton().setStyle("blurple").setID("nextPage").setLabel(">");
        lastpage = new MessageButton().setStyle("blurple").setID("lastPage").setLabel(">>");
        out = "```glsl\n";
        out += "Queue contains:\n";
        // current = "";
        start = 0;
        if(playing)
            start = last[message.guild.id]-5;
        start_0 = start;
        start = (start < 0) ? 0 : start;
        if(playing) if(start > 0) out += ""+(start+1)+" before\n";
        if(playing)
            page_0 = Math.floor(last[message.guild.id] / 10);
        else
            page_0 = 0;
        if(playing) if(last[message.guild.id] > list[message.guild.id].length-5) page_0 = Math.floor(list[message.guild.id].length/10)+1;
        ii = 0;
        btten = list[message.guild.id].length-1 >= 10;
        names = [];
        for(i_0 = 0; i_0 < ((btten) ? 10 : list[message.guild.id].length); i_0++) names[i_0] = "";
        start = 10*page_0;
        if(start+10 > list[message.guild.id].length) start = list[message.guild.id].length-10;
        for(i=0;i<names.length;i++) {
            google.youtube('v3').videos.list({
                key: googletoken,
                part: 'snippet,contentDetails',
                id: list[message.guild.id][start+i]
            }).then(async response => {
                ii++;
                ytid = response.data.items[0].id;
                ytidindex = list[message.guild.id].indexOf(ytid);
                rindex = ytidindex-start;
                time = "";
                rest = response.data.items[0].contentDetails.duration.replace("PT", "");
                if(rest.includes("H")) {
                    time += rest.split("H")[0] + ":";
                    rest = rest.split("H")[1];
                }
                if(rest.includes("M")) {
                    num = rest.split("M")[0];
                    if(Number(num)<10) num = "0"+num;
                    time += num + ":";
                    rest = rest.split("M")[1];
                } else {
                    if(time != "") time += "00:";
                }
                if(rest.includes("S")) {
                    num = rest.split("S")[0];
                    if(Number(num)<10) num = "0"+num;
                    time += num;
                } else {
                    if(time != "") time += "00";
                }
                names[rindex] = stringsize(30, response.data.items[0].snippet.title) + "       " + time;
                if(ii==names.length) {
                    for(j=0;j<names.length;j++) {
                        out += (start+j+1)+".   " + names[j];
                        if(playing) if(j == last[message.guild.id]-start) out += "      # currently here";
                        out += "\n";
                    }
                    // console.log(end);
                    // console.log(list[message.guild.id].length);
                    end = start+10;
                    if(end < list[message.guild.id].length) out += (list[message.guild.id].length-end) + " more\n";
                    buttonlist = [];
                    buttonlist[buttonlist.length] = firstpage;
                    buttonlist[buttonlist.length] = prevpage;
                    buttonlist[buttonlist.length] = nextpage;
                    buttonlist[buttonlist.length] = lastpage;
                    buttonlist[buttonlist.length] = openvideobutton;
                    possible = list[message.guild.id].length/10;
                    if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
                    else possible = Math.floor(possible);
                    if(playing)
                        queuepos[message.guild.id] = Math.floor(last[message.guild.id] / 10);
                    else
                        queuepos[message.guild.id] = 0;
                    if(playing) if(last[message.guild.id] > list[message.guild.id].length-5) queuepos[message.guild.id] = Math.floor(last[message.guild.id] / 10) + 1;
                    editButtons(queuepos[message.guild.id], possible);
                    let msg = await message.channel.send(out+"```", {buttons: buttonlist});
                    // const msg_0 = await newQueue(Math.floor(last[message.guild.id] / 10), message.channel);
                }
            })
        }
    } else if(message.content.toLowerCase().startsWith(prefix+'play')) {
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
    } else if(message.content.toLowerCase().startsWith(prefix+"clear")){
        if(list.hasOwnProperty(message.guild.id)) {
            list[message.guild.id] = [];
        }
    } else if(message.content.toLowerCase().startsWith(prefix+"loop")) {
        if(!message.content.toLowerCase().includes(" ") || message.content.toLowerCase().includes("queue")) {
            if(!loop.hasOwnProperty(message.guild.id)) {
                loop[message.guild.id] = true;
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`Loop Enabled`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(``)
                );
                return;
            }
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
        } else if(message.content.toLowerCase().includes("track")) {
            if(!looptrack.hasOwnProperty(message.guild.id)) {
                loop[message.guild.id] = true;
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`Loop Enabled`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(``)
                );
                return;
            }
            if(looptrack[message.guild.id]) {
                looptrack[message.guild.id] = false;
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("#FF0000")
                    .setTitle(`Loop disabled`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(``)
                );
            } else {
                looptrack[message.guild.id] = true;
                message.channel.send(
                    new Discord.MessageEmbed()
                    .setColor("#00FF00")
                    .setTitle(`Loop Enabled`)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(``)
                );
            }
        }
    } else if(message.content.toLowerCase().startsWith(prefix+"pause")) {
        if(player.hasOwnProperty(message.guild.id))
            player[message.guild.id].pause();
    } else if(message.content.toLowerCase().startsWith(prefix+"stop")) {
        if(connection.hasOwnProperty(message.guild.id)) {
            last[message.guild.id] = 0;
            connection[message.guild.id].channel.leave();
        }
    } else if(message.content.toLowerCase().startsWith(prefix+"current")) {
        if(!last.hasOwnProperty(message.guild.id)) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Nothing playing right now!`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        }
        if(list[message.guild.id].length == 0) {
            message.channel.send(
                new Discord.MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`Nothing playing right now!`)
                .setThumbnail(message.author.displayAvatarURL())
                .setDescription(``)
            );
        }
        // console.log(list[message.guild.id][last[message.guild.id]]);
        google.youtube('v3').videos.list({
            key: googletoken,
            part: 'snippet,contentDetails,statistics',
            id: list[message.guild.id][last[message.guild.id]]
        }).then(response => {
            res = response;
            data = res.data;
            // console.log(data);
            item = data.items[0];
            let videoLink = new MessageButton().setStyle("url").setLabel("Open Video").setURL("https://youtu.be/"+item.id);
            let channelLink = new MessageButton().setStyle("url").setLabel("View Channel").setURL("https://www.youtube.com/channel/"+item.snippet.channelId);
            out = "```Currently Playing:\n";
            out += "title: " + item.snippet.title + "\n";
            time = "";
            rest = item.contentDetails.duration.replace("PT", "");
            if(rest.includes("H")) {
                time += rest.split("H")[0] + ":";
                rest = rest.split("H")[1];
            }
            if(rest.includes("M")) {
                num = rest.split("M")[0];
                if(Number(num)<10) num = "0"+num;
                time += num + ":";
                rest = rest.split("M")[1];
            } else {
                if(time != "") time += "00:";
            }
            if(rest.includes("S")) {
                num = rest.split("S")[0];
                if(Number(num)<10) num = "0"+num;
                time += num;
            } else {
                if(time != "") time += "00";
            }
            out += "duration: " + time + "\n";
            out += "Channel: " + item.snippet.channelTitle + "\n";
            out += "Views: " + splitnum(item.statistics.viewCount) + "\n";
            out += "Likes: " + splitnum(item.statistics.likeCount) + "\n";
            out += "Dislikes: " + splitnum(item.statistics.dislikeCount) + "\n";
            out += "```";
            buttons = [];
            buttons[buttons.length] = videoLink;
            buttons[buttons.length] = channelLink;
            message.channel.send(out, {buttons: buttons});
        })
        /*
            Currently Playing:
            title:【AMV】- Toca Toca HD
            duration: 3:42
            Channel: Như Huỳnh
            views: 924,576
            likes: 22,164
            dislikes: 318
        */
    }
})

splitnum = num => {
    nstr = "";
    for(i=0;i<num.length;i++) {
        if((i)%3 == 0 && i != 0) nstr += ",";
        // console.log(i);
        // console.log((i)%3 == 0);
        nstr += num[num.length-1-i];
    }
    o = "";
    for(i=0;i<nstr.length;i++) {
        o += nstr[nstr.length-1-i];
    }
    // console.log(o);
    return o;
}

stringsize = (size, str) => {
    if(str.length < size) {
        for(i=0;i<(size-str.length);i++) {
            str += " ";
        }
    } else if(str.length > size) {
        buf = str;
        str = "";
        for(i=0;i<size;i++) {
            if(i<size-3) {
                str += buf[i];
            } else {
                str += ".";
            }
        }
    }
    return str;
}

shuffle = array => {
    var currentIndex = array.length,  randomIndex;
    while (0 !== currentIndex) {
  
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
  
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  
    return array;
}
  
play = async (url, connection, serverId) => {
    // console.log(url);
    const stream = await ytdl(url, {filter:'audioonly'});
    player[serverId] = connection.play(stream, {seek: 0, volume: 0.9})
        .on('finish', () => {
            if(!looptrack.hasOwnProperty(serverId)) last[serverId]++;
            if(looptrack.hasOwnProperty(serverId)) if(!looptrack[serverId]) last[serverId]++;
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
    // console.log(button.id);
    possible = list[button.message.guild.id].length/10;
    if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
    else possible = Math.floor(possible);
    if(button.id == "firstPage") {
        button.reply.defer();
        // console.log(queuepos[button.message.guild.id]);
        pos = 0;
        editButtons(pos, possible);
        editQueue(pos, button.message);
    }
    if(button.id == "lastPage") {
        button.reply.defer();
        // console.log(queuepos[button.message.guild.id]);
        pos = possible-1;
        editButtons(pos, possible);
        editQueue(pos, button.message);
    }
    if(button.id == "nextPage") {
        button.reply.defer();
        // console.log(queuepos);
        pos = queuepos[button.message.guild.id]+1;
        pos = (pos>possible-1) ? possible-1 : pos;
        // console.log(queuepos[button.message.guild.id]);
        // console.log(pos);
        editButtons(pos, possible);
        editQueue(pos, button.message);
    }
    if(button.id == "prevPage") {
        button.reply.defer();
        pos = queuepos[button.message.guild.id]-1;
        pos = (pos < 0) ? 0 : pos;
        // console.log(queuepos[button.message.guild.id]);
        // console.log(pos);
        editButtons(pos, possible);
        editQueue(pos, button.message);
    }
});

bot.login(token);