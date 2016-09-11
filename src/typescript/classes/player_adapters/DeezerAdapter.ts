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
    }

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {

            let currentContext = this;

            // Reset info.
            this.currentPosition = 0;
            this.currentDuration = 0;
            this.percentageLoaded = 0;
            this.trackEnd = false;

            window.DZ.player.playTracks([track.services[`Deezer`].trackId], function (response: any) {

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

                            // The track is now playable,
                            // so resolve the promise.
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
        this.trackEnd = false;
        window.DZ.player.play();
    }

    public pause(): void {
        window.DZ.player.pause();
    }

    public getPaused(): boolean {
        return !window.DZ.player.isPlaying();
    }

    public setVolume(volume: number): void {
        window.DZ.player.setVolume(volume * 100);
    }

    public seekToPercentage(percentage: number): void {
        window.DZ.player.seek(percentage * 100);
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
