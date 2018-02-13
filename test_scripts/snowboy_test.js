const config = require("../config").getAll();

const snowboy = require("../snowboy/snowboy.js");
const Recorder = require("../device_module/system_impl/recorder");

let recorder = new Recorder();
snowboy.on("hotword", (index, hotword, buffer) => {
    console.log("hotword ", index, hotword);
});
snowboy.start(recorder.start().out());