interface Window {
    onYouTubeIframeAPIReady: any;
}

class YouTubeAdapter implements IPlayerAdapter {

    private youtubePlayer: YT.Player;

    public initialize(): void {

        // Load the IFrame Player API code asynchronously.
        let tag = <HTMLScriptElement> document.createElement(`script`);
        tag.src = "https://www.youtube.com/iframe_api";

        let firstScriptTag = document.getElementsByTagName(`script`)[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        function onPlayerReady() {
            // window.youtubePlayer = this.youtubePlayer;
            console.log("Hey! I'm ready! :)");
        }

        // Create an <iframe> (and YouTube player) after the API code downloads.
        // tslint:disable-next-line
        let _this = this;
        window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {

            // May not be in the right scope, probably have to use _this.
            console.log(this);

            _this.youtubePlayer = new YT.Player(`youtube-player`, {
                events: {
                    "onReady": onPlayerReady,
                },
                height: `300`,
                playerVars: {
                    "controls": 0,
                },
                videoId: ``, // CTB0rm_Figk
                width: `600`,
            });
        };

    }

    public load(track: ITrack): void {

        // Get YouTube ID from track then load it.
        // this.youtubePlayer.loadVideoById(...);

        throw `Not Implemented`;
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
