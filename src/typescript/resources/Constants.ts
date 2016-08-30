// tslint:disable-next-line
let CONSTANTS = {
    PLAYER: {
        DEFAULTS: {
            MUTED: false,
            REPEAT: `repeat-all`,
            SHUFFLE: false,
            TIME_AFTER_WHICH_TO_RESTART_TRACK: 3000, // in milliseconds
            VOLUME: 1,
        },
        REPEAT: {
            /**
             * Cycle through all the tracks in the queue.
             */
            ALL: `repeat-all`,
            /**
             * When the player gets to the end of the queue,
             * stop playing.
             */
            NO: `no-repeat`,
            /**
             * Keep repeating the current track.
             */
            ONE: `repeat-one`,
        },
        EVENTS: {
            /**
             * Published when the player is paused.
             */
            ON_PAUSE: `player-onPause`,
        }
    },
};

CONSTANTS.PLAYER.EVENTS.ON_PAUSE;
