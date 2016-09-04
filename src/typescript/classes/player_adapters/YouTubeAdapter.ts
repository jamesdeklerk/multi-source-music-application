// tslint:disable-next-line
interface Window {
    onYouTubeIframeAPIReady: any;
}

class YouTubeAdapter implements IPlayerAdapter {

    private youtubePlayer: YT.Player;

    constructor() {

        // =======================================================
        // Registering Events
        // =======================================================

        publisher.register(`youtube-onStateChange`);
        publisher.register(`youtube-onError`);

        // -------------------------------------------------------

    }

    public initialize(): Promise<any> {

        return new Promise((resolve, reject) => {

            // Load the IFrame Player API code asynchronously.
            let tag = <HTMLScriptElement> document.createElement(`script`);
            tag.src = "https://www.youtube.com/iframe_api";
            let firstScriptTag = document.getElementsByTagName(`script`)[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Create an <iframe> (and YouTube player) after the API code downloads.
            // tslint:disable-next-line
            let thisContext = this;
            window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
                thisContext.youtubePlayer = new YT.Player(`youtube-player`, {
                    events: {
                        "onReady": function () {
                            // We don't have a "reject" because YouTube API doesn't
                            // have a failed to load event...
                            resolve();
                        },
                        "onStateChange": function (e) {

                            console.log(`onStateChange: ` + e.data);

                            // Have to use publisher to mimic the events fired.
                            // This is because the YouTube APIs removeEventListener
                            // function doesn't work.
                            publisher.publish(`youtube-onStateChange`, e);
                        },
                        "onError": function (e) {
                            // Have to use publisher to mimic the events fired.
                            // This is because the YouTube APIs removeEventListener
                            // function doesn't work.
                            publisher.publish(`youtube-onError`, e);
                        },
                    },
                    height: `300`,
                    playerVars: {
                        "controls": 1,
                    },
                    videoId: ``, // Set as none to start.
                    width: `600`,
                });
            };

        });

    }

    public unload(): void {
        this.youtubePlayer.stopVideo();
    }

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {

            console.log(`YouTube load(track) was called!`);

            let thisYouTubeAdapter = this;

            function onStateChangeHandler(e: any) {
                // If the state changes to playing (i.e. 1),
                // then from the YouTube API we know it's the track is loaded.
                if (e.data === 1) {

                    console.log(`Track loaded!!!!!!!!!!!!!!!!`);

                    // We're done with the onStateChangeHandler, so get rid of it.
                    publisher.unsubscribe(`youtube-onStateChange`, onStateChangeHandler);
                    // We're done with the onErrorHandler, so get rid of it.
                    publisher.unsubscribe(`youtube-onError`, onErrorHandler);

                    // Pause the video (as per interface definition of load)
                    thisYouTubeAdapter.pause();

                    resolve();
                }
            }

            function onErrorHandler(e: any) {

                // We're done with the onStateChangeHandler, so get rid of it.
                publisher.unsubscribe(`youtube-onStateChange`, onStateChangeHandler);
                // We're done with the onErrorHandler, so get rid of it.
                publisher.unsubscribe(`youtube-onError`, onErrorHandler);

                reject();
            }

            publisher.subscribe(`as`, onStateChangeHandler);
            publisher.subscribe(`ds`, onErrorHandler);

            // Get YouTube ID from track then load it.
            this.youtubePlayer.loadVideoById(`CR7TN-j4lY4`);
        });
    }

    public play(): void {
        this.youtubePlayer.playVideo();
    }

    public pause(): void {
        this.youtubePlayer.pauseVideo();
    }

    public setVolume(volume: number): void {
        this.youtubePlayer.setVolume(volume * 100);
    }

    public seekTo(milliseconds: number): void {
        this.youtubePlayer.seekTo(milliseconds / 1000, true);
    }

    public getCurrentTime(): number {
        return this.youtubePlayer.getCurrentTime() * 1000;
    }

    public getDuration(): number {
        return this.youtubePlayer.getDuration() * 1000;
    }

    public getPercentageLoaded(): number {
        return this.youtubePlayer.getVideoLoadedFraction();
    }

}
