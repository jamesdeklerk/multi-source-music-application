// tslint:disable-next-line
interface Window {
    dzAsyncInit: any;
    DZ: any;
}

class DeezerAdapter implements IPlayerAdapter {

    public name = `Deezer`;
    private currentPosition = 0;
    private currentDuration = 0;
    private percentageLoaded = 0;
    private trackEnd = false;
    private currentPlayer: any;
    private unloaded: any = true;

    public initialize(): Promise<any> {

        return new Promise((resolve, reject) => {

            let currentContext = this;

            window.dzAsyncInit = function () {
                window.DZ.init({
                    appId: `190142`,
                    channelUrl: `http://developers.deezer.com/examples/channel.php`,
                    player: {
                        onload: function () {

                            // Subscribe to deezer events.
                            window.DZ.Event.subscribe(`player_position`, function (array: any[]) {
                                if (!currentContext.trackEnd) {
                                    currentContext.currentPosition = array[0];
                                }
                            });
                            window.DZ.Event.subscribe(`player_buffering`, function (percentageLoaded: number) {
                                currentContext.percentageLoaded = percentageLoaded;
                            });
                            window.DZ.Event.subscribe(`track_end`, function () {
                                currentContext.trackEnd = true;
                                currentContext.currentPosition = currentContext.currentDuration;
                            });

                            // Resolve the promise.
                            resolve();
                        },
                    },
                });
            };

            let e = <HTMLScriptElement> document.createElement(`script`);
            e.src = "https://cdns-files.dzcdn.net/js/min/dz.js";
            e.async = true;
            document.getElementById(`dz-root`).appendChild(e);

            // Keep making sure it's in the correct paused state.
            function keepTrying() {

                // If it is unloaded, make sure it's in the paused state.
                if (currentContext.unloaded) {
                    if (window.DZ.player.isPlaying()) {
                        window.DZ.player.pause();
                    }
                }

                setTimeout(keepTrying, 500); // Every half a second.
            }
            keepTrying();

        });

    }

    public unload(): void {
        this.pause();

        this.currentPosition = 0;
        this.currentDuration = 0;
        this.percentageLoaded = 0;
        this.trackEnd = false;

        // Unload all tracks from Deezer player.
        window.DZ.player.playTracks([]);

        this.unloaded = true;

        // Clear the current player.
        this.currentPlayer = undefined;
    }

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {

            let currentContext = this;

            currentContext.unloaded = false;

            // Reset info.
            this.currentPosition = 0;
            this.currentDuration = 0;
            this.percentageLoaded = 0;
            this.trackEnd = false;

            let trackId: string;
            if (track.services[this.name]) {
                trackId = track.services[this.name].trackId;
            }

            if (trackId) {
                window.DZ.player.playTracks([trackId], function (response: any) {

                    // If it returned no tracks then it failed to play the track.
                    if (response.tracks.length <= 0) {
                        reject();
                    } else {

                        currentContext.currentDuration = response.tracks[0].duration;

                        // Keep trying to see if the track is playable yet.
                        function keepTrying() {
                            if (window.DZ.player.play() === false) {

                                // The track isn't ready yet.
                                // For some reason, playing and pausing the song gets it to load.
                                window.DZ.player.pause();

                                // try every 150 milliseconds.
                                setTimeout(keepTrying, 150);
                            } else {

                                // Set the current player.
                                currentContext.currentPlayer = window.DZ.player;

                                // The track is now playable,
                                // so resolve the promise.
                                resolve();
                            }
                        }
                        // Initialize the keep trying loop.
                        keepTrying();

                    }
                });
            } else {
                reject();
            }


        });
    }

    public play(): void {
        if (this.currentPlayer) {
            this.trackEnd = false;
            this.currentPlayer.play();
        }
    }

    public pause(): void {
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
    }

    public getPaused(): boolean {
        if (this.currentPlayer) {
            return !(this.currentPlayer.isPlaying());
        } else {
            return true;
        }
    }

    public setVolume(volume: number): void {
        if (this.currentPlayer) {
            this.currentPlayer.setVolume(volume * 100);
        }
    }

    public seekToPercentage(percentage: number): void {
        if (this.currentPlayer) {
            this.currentPlayer.seek(percentage * 100);
        }
    }

    public getCurrentTime(): number {
        if (this.currentPlayer) {
            // Current time in milliseconds.
            return this.currentPosition * 1000;
        } else {
            return 0;
        }
    }

    public getDuration(): number {
        if (this.currentPlayer) {
            return this.currentDuration * 1000;
        } else {
            return 0;
        }
    }

    public getPercentageLoaded(): number {
        if (this.currentPlayer) {
            return this.percentageLoaded / 100;
        } else {
            return 0;
        }
    }

}
