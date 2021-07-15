const Youtube = require("youtube-api");
const { token } = require("./settings")
const { google } = require("googleapis");

google.youtube('v3').playlistItems.list({
    key: token,
    part: 'snippet',
    playlistId: "PLnDgk3m4GyVfOpDIOLN5mLrtVdH7lcBdD",
    maxResults: 200
}).then(response => {
    for(elm in response.data.items) {
        console.log(response.data.items[elm].snippet.resourceId.videoId);
    }
})