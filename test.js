
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

splitnum("217792");
splitnum("21779");