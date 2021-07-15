queue = [
    "qMsP2j83av8",
    "V6wWRU6G58U",
    "AufydOsiD6M",
    "ix9nEjSxgeo",
    "NocXEwsJGOQ",
    "AYUNaQaDfa8",
    "ohbSbLRJFeE",
    "ZUuNiq2HATI",
    "RFBDmwFxVr0",
    "yXVnap7Zb2o",
    "QAdvDmhE2fg",
    "ZDk8G4Q9Z68",
    "d7nl_pS4iEA",
    "A6l8THwbcfY",
    "HrkFQAQyFGc",
    "DeGw8-KwxM4",
    "eszN0xTFBv8",
    "wki1FI-kGis",
    "9jrO58mg-Qg",
    "h6DNdop6pD8",
    "TdcDT8Y7d9k",
    "ZUXLzuxt7PM",
    "vQiodbKEW6s",
    "5TGgJQgDf68",
    "vsIWN3QSp8Y",
    "5y3xh8gs24c",
    "VUkxwUhoOSU",
    "aIYWJuNy6y0",
    "Orb6mvWMyAs",
    "e3flZulF_M0",
    "xLk4iBXWg58",
    "GrH3OrZU6Ek"
]

position = 15;

out = "";

send = msg => {
    out += msg+"\n";
}

size = 10;

possible = (queue.length) / size;

send(possible);

if(Math.floor(possible) != possible) possible = Math.floor(possible)+1;
else possible = Math.floor(possible);

send(possible);

send("now: " + queue[position]);

page = 2;

for(i=0;i<10;i++) {
    j = Math.floor(position / size);
    j = page;
    pos = size*j+i;
    if(size*j+size-1 > queue.length-1) pos = queue.length-size+i;
    send(queue[pos] + ((pos == position) ? "  <---- now" : ""));
}

console.log(out);