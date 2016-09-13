// tslint:disable-next-line
interface Window {
    onYouTubeIframeAPIReady: any;
}

class YouTubeAdapter implements IPlayerAdapter {

    public name = `YouTube`;
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
                        "controls": 0,
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

            function onStateChangeHandler(e: any) {
                // If the state changes to playing (i.e. 1),
                // then from the YouTube API we know it's the track is loaded.
                if (e.data === 1) {

                    // We're done with the onStateChangeHandler, so get rid of it.
                    publisher.unsubscribe(`youtube-onStateChange`, onStateChangeHandler);
                    // We're done with the onErrorHandler, so get rid of it.
                    publisher.unsubscribe(`youtube-onError`, onErrorHandler);

                    // The track is now playable,
                    // so resolve the promise.
                    resolve();

                }
            }

            function onErrorHandler(e: any) {

                // We're done with the onStateChangeHandler, so get rid of it.
                publisher.unsubscribe(`youtube-onStateChange`, onStateChangeHandler);
                // We're done with the onErrorHandler, so get rid of it.
                publisher.unsubscribe(`youtube-onError`, onErrorHandler);

                reject(e);
            }

            publisher.subscribe(`youtube-onStateChange`, onStateChangeHandler);
            publisher.subscribe(`youtube-onError`, onErrorHandler);

            // Get YouTube ID from track then load it.
            this.youtubePlayer.loadVideoById(track.services[`YouTube`].videoId);
        });
    }

    public play(): void {
        this.youtubePlayer.playVideo();
    }

    public pause(): void {
        this.youtubePlayer.pauseVideo();
    }

    public getPaused(): boolean {
        // 2 is the paused state for YouTube.
        return this.youtubePlayer.getPlayerState() === 2;
    }

    public setVolume(volume: number): void {
        this.youtubePlayer.setVolume(volume * 100);
    }

    public seekToPercentage(percentage: number): void {
        // The YouTube player works in seconds,
        // so the percentage has to be converted to seconds.
        this.youtubePlayer.seekTo(this.youtubePlayer.getDuration() * percentage, true);
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
