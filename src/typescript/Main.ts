// =======================================================
// The main class starts the application
// =======================================================
class Main {
    constructor() {

        // Create a new player object.
        let AP = new Player();
        window.AP = AP;

        // Create some tracks.
        let track0: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `FJt7gNi3Nr4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `0. No Church In The Wild`,
            uuid: `0`,
        };
        let track1: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `R594fw8I2a4`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": {
                    trackPath: `/tracks/282422837`,
                },
            },
            title: `1. Get Low`,
            uuid: `1`,
        };
        let track2: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 113524324,
                },
                "YouTube": {
                    videoId: `GZSsOEqgm0c`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": {
                    trackPath: `/tracks/208199477`, // not available outside of SoundCloud.
                },
            },
            title: `2. Be Together feat. Wild Belle`,
            uuid: `2`,
        };
        let track3: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 126534877,
                },
                "YouTube": {
                    videoId: `KVAoKBfFkwg`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `3. The Longest Wave (only available on Deezer)`,
            uuid: `3`,
        };
        let track4: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `1ekZEVeXwek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `4. Into You`,
            uuid: `4`,
        };
        let track5: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 890897887898798,
                },
                "YouTube": {
                    videoId: `KVAoKBfFkwg`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `5. THIS TRACK ISN'T AVAILABLE ANYWHERE`,
            uuid: `5`,
        };
        let track6: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `viimfQi_pUw`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": {
                    trackPath: `/tracks/233719633`,
                },
            },
            title: `6. Ocean Eyes`,
            uuid: `6`,
        };
        let track7: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `4pflhw9QItc`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `7. Hypnotize`,
            uuid: `7`,
        };
        let track8: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `Bm5iA4Zupek`,
                },
                // The service will have an undefined object if it hasn't been searched,
                // and marked as false if the service has been searched but no track was found.
                "SoundCloud": false,
            },
            title: `8. Runaway (Video Version) ft. Pusha T`,
            uuid: `8`,
        };
        let track9: ITrack = {
            artist: undefined,
            duration: 9769,
            services: {
                "Deezer": {
                    trackId: 1,
                },
                "YouTube": {
                    videoId: `Bm5iAaaupek`,
                },
                "SoundCloud": {
                    trackPath: `/tracks/47580057`,
                },
            },
            title: `9. Another Ordinary Day (SoundCloud Only)`,
            uuid: `9`,
        }

        // Queue multiple tracks.
        AP.queue([
            track0,
            track1,
            track2,
            track3, // Not available on YouTube
            track4,
            track5, // Not available on YouTube or Deezer
            track6,
            track7,
            track8,
            track9,
        ]);

        // After this the queue should look like this [track3, track1, track3, track4]
        console.log(AP.getQueue());

        // Set repeat to false (for testing cycling through all tracks causes an infinite loop).
        AP.setRepeat(AP.REPEAT_STATES.OFF);

        // Play the 2nd track in the queue, this should play track1. 
        //abstractPlayer.load(0);

        window.displayTracks = function (tracks: ITrack[]) {
            for (let track of tracks) {
                console.log(track.title);
            }
        };

        // Dealing with the seek bar
        let seekBar = <HTMLInputElement>document.getElementById(`seek-bar`);
        let bufferingBar = <HTMLInputElement>document.getElementById(`buffering-bar`);
        let userMovingSeekBar = false;

        seekBar.addEventListener(`mousedown`, function () {
            userMovingSeekBar = true;
        });

        seekBar.addEventListener(`change`, function () {
            userMovingSeekBar = false;

            AP.seekToPercentage(parseFloat(seekBar.value));
        });

        // tslint:disable-next-line
        publisher.subscribe(AP.EVENTS.ON_TIME_UPDATE, function (time: number, duration: number, percentage: number, percentageLoaded: number) {
            if (!userMovingSeekBar) {
                seekBar.value = percentage.toString();
            }
            bufferingBar.value = percentageLoaded.toString();
        });

        // Logging track status.
        publisher.subscribe(AP.EVENTS.ON_TRACK_LOADING, function (track: ITrack, musicServiceName: string) {
            console.log(`LOADING (${musicServiceName}) - ${track.title}.`);
        });
        publisher.subscribe(AP.EVENTS.ON_TRACK_LOADED, function (track: ITrack, musicServiceName: string) {
            console.log(`SUCCESS (${musicServiceName}) - ${track.title}.`);
        });
        publisher.subscribe(AP.EVENTS.ON_TRACK_LOAD_FAILED, function (track: ITrack, musicServiceName: string) {
            console.log(`FAILED (${musicServiceName}) - ${track.title}.`);
        });

        // Buffering events
        publisher.subscribe(AP.EVENTS.ON_TRACK_BUFFERING, function () {
            console.log(`BUFFERING`);
        });
        publisher.subscribe(AP.EVENTS.ON_TRACK_FINISHED_BUFFERING, function () {
            console.log(`FINISHED BUFFERING`);
        });

    }
}

// tslint:disable-next-line
let main = new Main();
