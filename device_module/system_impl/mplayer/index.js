var Player = require('./lib/player'),
    EventEmitter = require('events').EventEmitter.prototype,
    _ = require('lodash');

var defaults = {
    verbose: false,
    debug: false
};

var MPlayer = function(options) {
    options = _.defaults(options || {}, defaults);

    this.player = new Player(options);
    this.status = {
        muted: false,
        playing: false,
        volume: 0
    };

    this.player.once('ready', function() {
        if (options.verbose) {
            console.log('player.ready');
        }
        this.emit('ready');
    }.bind(this));

    this.player.on('statuschange', function(status) {
        this.status = _.extend(this.status, status);
        if (options.verbose) {
            console.log('player.status', this.status);
        }
        this.emit('status', this.status);
    }.bind(this));

    this.player.on('playstart', function() {
        this.status.playing = true;
        if (options.verbose) {
            console.log('player.start');
        }
        this.emit('start');
    }.bind(this));

    this.player.on('playstop', function() {
        this.status.playing = false;
        if (options.verbose) {
            console.log('player.stop');
        }
        this.emit('stop')
    }.bind(this));

    this.player.on('playfinished', function() {
        if (options.verbose) {
            console.log('player.finished');
        }
        this.emit('finished')
    }.bind(this));

    var pauseTimeout,
        paused = false;

    this.player.on('timechange', function(time) {
        clearTimeout(pauseTimeout);
        pauseTimeout = setTimeout(function() {
            paused = true;
            this.status.playing = false;
            this.emit('pause');
            if (options.verbose) {
                console.log('player.pause');
            }
        }.bind(this), 100);
        if (paused) {
            paused = false;
            this.status.playing = true;
            this.emit('play');
            if (options.verbose) {
                console.log('player.play');
            }
        }
        this.status.position = time;
        this.emit('time', time);
        if (options.verbose) {
            console.log('player.time', time);
        }
    }.bind(this));
};

MPlayer.prototype = _.extend({
    setOptions: function(options) {
        if (options && options.length) {
            options.forEach(function(value, key) {
                this.player.cmd('set_property', [key, value]);
            }.bind(this));
        }
    },
    openFile: function(file, options) {
        this.player.cmd('stop');

        this.setOptions(options);
        this.player.cmd('loadfile', ['"' + file + '"']);

        this.status.playing = true;
    },
    openPlaylist: function(file, options) {
        this.player.cmd('stop');

        this.setOptions(options);
        this.player.cmd('loadlist', ['"' + file + '"']);

        this.status.playing = true;
    },
    play: function() {
        if (!this.status.playing) {
            this.player.cmd('pause');
            this.status.playing = true;
        }
    },
    pause: function() {
        if (this.status.playing) {
            this.player.cmd('pause');
            this.status.playing = false;
        }
    },
    stop: function() {
        this.player.cmd('stop');
    },
    seek: function(seconds) {
        this.player.cmd('seek', [seconds, 2]);
    },
    seekPercent: function(percent) {
        this.player.cmd('seek', [percent, 1]);
    },
    volume: function(percent) {
        this.status.volume = percent;
        this.player.cmd('volume', [percent, 1]);
    },
    mute: function() {
        this.status.muted = !this.status.muted;
        this.player.cmd('mute');
    },
    fullscreen: function() {
        this.status.fullscreen = !this.status.fullscreen;
        this.player.cmd('vo_fullscreen');
    },
    hideSubtitles: function() {
        this.player.cmd('sub_visibility', [-1]);
    },
    showSubtitles: function() {
        this.player.cmd('sub_visibility', [1]);
    },
    cycleSubtitles: function() {
        this.player.cmd('sub_select');
    },
    speedUpSubtitles: function() {
        this.player.cmd('sub_step', [1]);
    },
    slowDownSubtitles: function() {
        this.player.cmd('sub_step', [-1]);
    },
    adjustSubtitles: function(seconds) {
        this.player.cmd('sub_delay', [seconds]);
    },
    adjustAudio: function(seconds) {
        this.player.cmd('audio_delay', [seconds]);
    }
}, EventEmitter);

module.exports = MPlayer;