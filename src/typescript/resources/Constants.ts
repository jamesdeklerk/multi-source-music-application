// tslint:disable-next-line
let CONSTANTS = {
    PLAYER: {
        DEFAULTS: {
            MUTED: false,
            PAUSED: false,
            PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT: `maintain-current`,
            REPEAT: `repeat-all`,
            SHUFFLE: false,
            TIME_AFTER_WHICH_TO_RESTART_TRACK: 3000, // in milliseconds
            VOLUME: 1,
        },
        EVENTS: {
            /**
             * Published when the player is paused.
             */
        },
        REGISTERED_SERVICES: [
            /**
             * In order of which the players will be tried.
             * Use IMusicService format.
             */
            {
                adapter: SoundCloudAdapter,
                name: `SoundCloud`,
            },
            {
                adapter: YouTubeAdapter,
                name: `YouTube`,
            },
            // {
            //     adapter: DeezerAdapter,
            //     name: `Deezer`,
            // },
        ],
    },
};
