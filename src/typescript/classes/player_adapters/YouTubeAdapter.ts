interface Window {
    onYouTubeIframeAPIReady: any;
}

class YouTubeAdapter implements IPlayerAdapter {

    private youtubePlayer: YT.Player;

    public initialize(): Promise<any> {

        return new Promise((resolve, reject) => {

            // Load the IFrame Player API code asynchronously.
            let tag = <HTMLScriptElement>document.createElement(`script`);
            tag.src = "https://www.youtube.com/iframe_api";
            let firstScriptTag = document.getElementsByTagName(`script`)[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            // Create an <iframe> (and YouTube player) after the API code downloads.
            // tslint:disable-next-line
            let thisYouTubeAdapter = this;
            window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {

                // May not be in the right scope, probably have to use thisYouTubeAdapter.
                console.log(this);

                thisYouTubeAdapter.youtubePlayer = new YT.Player(`youtube-player`, {
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

    public load(track: ITrack): Promise<{}> {
        return new Promise((resolve, reject) => {
            // Get YouTube ID from track then load it.
            // this.youtubePlayer.loadVideoById(...);

            let thisYouTubeAdapter = this;

            function onStateChangeHandler(e: any) {
                if (e.data === 1) {

                    // We're done with the onStateChangeHandler, so get rid of it.
                    publisher.unsubscribe('youtube-onStateChange', onStateChangeHandler);
                    // We're done with the onErrorHandler, so get rid of it.
                    publisher.unsubscribe('youtube-onError', onErrorHandler);

                    // Pause the video (as per interface definition of load)
                    thisYouTubeAdapter.pause();

                    resolve();
                }
            }

            function onErrorHandler(e: any) {

                // We're done with the onStateChangeHandler, so get rid of it.
                publisher.unsubscribe('youtube-onStateChange', onStateChangeHandler);
                // We're done with the onErrorHandler, so get rid of it.
                publisher.unsubscribe('youtube-onError', onErrorHandler);

                reject();
            }

            this.youtubePlayer.loadVideoById(`CR7TN-j4lY4`);
        });
    }

    public play(): void {
        this.youtubePlayer.playVideo();
    }

    public pause(): void {
        this.youtubePlayer.pauseVideo();
    }

    public stop(): void {
        this.youtubePlayer.stopVideo();
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
