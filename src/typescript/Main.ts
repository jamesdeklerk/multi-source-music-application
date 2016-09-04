// =======================================================
// The main class starts the application
// =======================================================
class Main {
    constructor() {

        // Create a new player object.
        let player = new Player();
        window.player = player;

        // Create some tracks.
        let track1: ITrack = {
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
            title: `1. No Church In The Wild`,
            uuid: `1`,
        };
        let track2: ITrack = {
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
            title: `2. Get Low`,
            uuid: `1`,
        };
        let track3: ITrack = {
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
            title: `3. Be Together feat. Wild Belle`,
            uuid: `1`,
        };
        let track4: ITrack = {
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
            title: `4. Ocean Eyes`,
            uuid: `1`,
        };
        let track5: ITrack = {
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
            title: `5. Into You`,
            uuid: `1`,
        };
        let track6: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": undefined,
                "YouTube": {
                    videoId: `aaaaa`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `3. Stubborn Love - THIS TRACK ISN'T AVAILABLE`,
            uuid: `1`,
        };

        // Queue multiple tracks.
        player.queue([track1, track2, track3]);

        // Dequeue multiple tracks.
        player.dequeue([track2, track1]);

        // Queue single track.
        player.queue(track3);
        player.queue(track1);
        player.queue(track6);
        player.queue(track5);
        player.queue(track4);

        // Dequeue single track.
        player.dequeue(track3);

        // After this the queue should look like this [track3, track1, track3, track4]
        console.log(player.getQueue());

        // Set repeat to false (for testing cycling through all tracks causes an infinite loop).
        player.setRepeat(player.REPEAT.OFF);

        // Play the 2nd track in the queue, this should play track1. 
        player.loadTrackFromQueue(1);

    }
}

// tslint:disable-next-line
let main = new Main();
