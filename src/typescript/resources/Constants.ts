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
        EVENTS: {
            /**
             * Published when the player is paused.
             */
            ON_PAUSE: `player-onPause`,
        },
        REGISTERED_SERVICES: [
            /**
             * In order of which the players will be tried.
             * Use IMusicService format.
             */
            {
                adapter: YouTubeAdapter,
                name: `YouTube`,
            },
        ],
        REPEAT: {
            /**
             * Cycle through all the tracks in the queue.
             */
            ALL: `repeat-all`,
            /**
             * When the player gets to the end of the queue,
             * stop playing.
             */
            OFF: `repeat-off`,
            /**
             * Keep repeating the current track.
             */
            ONE: `repeat-one`,
        },
    },
};

CONSTANTS.PLAYER.EVENTS.ON_PAUSE;
