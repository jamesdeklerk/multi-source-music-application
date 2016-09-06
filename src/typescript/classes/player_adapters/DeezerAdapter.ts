// tslint:disable-next-line
interface Window {

}

class DeezerAdapter implements IPlayerAdapter {

    public name = `Deezer`;
    private currentPosition = 0;
    private currentDuration = 0;
    private percentageLoaded = 0;
    private trackEnd = false;

    public initialize(): Promise<any> {

        return new Promise((resolve, reject) => {

            let currentContext = this;

            window.dzAsyncInit = function () {
                DZ.init({
                    appId: `190142`,
                    channelUrl: `http://developers.deezer.com/examples/channel.php`,
                    player: {
                        onload: function () {

                            // Subscribe to deezer events.
                            DZ.Event.subscribe(`player_position`, function (array: any[]) {
                                if (!currentContext.trackEnd) {
                                    currentContext.currentPosition = array[0];
                                }
                            });
                            DZ.Event.subscribe(`player_buffering`, function (percentageLoaded: number) {
                                console.log(`Deezer track buffering: ${percentageLoaded}`);
                                currentContext.percentageLoaded = percentageLoaded;
                            });
                            DZ.Event.subscribe(`track_end`, function () {
                                currentContext.trackEnd = true;
                                currentContext.currentPosition = currentContext.currentDuration;
                            });
                            DZ.Event.subscribe(`current_track`, function (e) {
                                console.log(`Deezer track changed!!!!!`);
                                console.log(e);
                            });

                            // Resolve the promise.
                            resolve();
                        },
                    },
                });
            };

            let e = <HTMLScriptElement>document.createElement(`script`);
            e.src = "https://cdns-files.dzcdn.net/js/min/dz.js";
            e.async = true;
            document.getElementById(`dz-root`).appendChild(e);

        });

    }

    public unload(): void {
        console.log(`Deezer Unload.`);
        this.pause();

        // Unload all tracks from Deezer player.
        DZ.player.playTracks([]);
    }

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {

            console.log(`Deezer load was called for ${track.title} (trackId ${track.services[`Deezer`].trackId})!`);

            let currentContext = this;

            // Reset info.
            this.currentPosition = 0;
            this.currentDuration = 0;
            this.percentageLoaded = 0;
            this.trackEnd = false;

            DZ.player.playTracks([track.services[`Deezer`].trackId], function (response: any) {

                // If it returned no tracks then it failed to play the track.
                if (response.tracks.length <= 0) {
                    reject();
                } else {

                    currentContext.currentDuration = response.tracks[0].duration;

                    let tryCount = 0;

                    // Keep trying to see if the track is playable yet.
                    function keepTrying() {
                        if (DZ.player.play() === false) {
                            // The track isn't ready yet.
                            // For some reason, playing and pausing the song gets it to load.
                            DZ.player.pause();

                            tryCount = tryCount + 1;

                            // try every 150 milliseconds.
                            setTimeout(keepTrying, 150);
                        } else {

                            console.log(`tryCount: ${tryCount}`);

                            // The track is now playable, so pause it (as per specification)
                            // and resolve the promise.
                            currentContext.pause();
                            resolve();
                        }
                    }
                    // Initialize the keep trying loop.
                    keepTrying();

                }
            });

        });
    }

    public play(): void {
        DZ.player.play();
    }

    public pause(): void {
        DZ.player.pause();
    }

    public setVolume(volume: number): void {
        DZ.player.setVolume(volume * 100);
    }

    public seekToPercentage(percentage: number): void {
        DZ.player.seek(percentage * 100);
    }

    public getCurrentTime(): number {
        // Current time in milliseconds.
        return this.currentPosition * 1000;
    }

    public getDuration(): number {
        return this.currentDuration * 1000;
    }

    public getPercentageLoaded(): number {
        return this.percentageLoaded / 100;
    }

}
