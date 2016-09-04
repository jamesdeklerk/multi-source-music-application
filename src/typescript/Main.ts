// =======================================================
// The main class starts the application
// =======================================================
class Main {
    constructor() {

        // Create a new player object.
        let player = new Player();
        window.player = player;

        // Create some tracks.
        let track0: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `FJt7gNi3Nr4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `0. No Church In The Wild`,
            uuid: `1`,
        };
        let track1: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `R594fw8I2a4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `1. Get Low`,
            uuid: `1`,
        };
        let track2: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `GZSsOEqgm0c`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `2. Be Together feat. Wild Belle`,
            uuid: `1`,
        };
        let track3: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `KVAoKBfFkwg`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `3. THIS TRACK ISN'T AVAILABLE (This video is private.)`,
            uuid: `1`,
        };
        let track4: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `1ekZEVeXwek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `4. Into You`,
            uuid: `1`,
        };
        let track5: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `viimfQi_pUw`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `5. Ocean Eyes`,
            uuid: `1`,
        };
        let track6: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `4pflhw9QItc`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `6. Hypnotize`,
            uuid: `1`,
        };
        let track7: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `Bm5iA4Zupek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `7. Runaway (Video Version) ft. Pusha T`,
            uuid: `1`,
        };

        // Queue multiple tracks.
        player.queue([
            track0,
            track1,
            track2,
            track3,
            track4,
            track5,
            track6,
            track7,
        ]);

        // After this the queue should look like this [track3, track1, track3, track4]
        console.log(player.getQueue());

        // Set repeat to false (for testing cycling through all tracks causes an infinite loop).
        player.setRepeat(player.REPEAT.OFF);

        // Play the 2nd track in the queue, this should play track1. 
        player.loadTrackFromQueue(0);

    }
}

// tslint:disable-next-line
let main = new Main();
