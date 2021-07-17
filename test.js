
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

console.log(stringsize(15, "this is a test string"));