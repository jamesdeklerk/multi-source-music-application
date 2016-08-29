/**
 * Player
 * The player class adopts some of the naming conventions from
 * - HTML Audio/Video               @see http://www.w3schools.com/tags/ref_av_dom.asp
 * - YouTube IFrame Player API      @see https://developers.google.com/youtube/iframe_api_reference
 * - Deezer Player JavaScript SDK   @see https://developers.deezer.com/sdk/javascript/controls
 */
class Player {

    /**
     * 
     */
    private currentPlayer: IServicePlayerAdapter;
    /**
     * 
     */
    private currentTrack: ITrack;

    /**
     * Creates the music player.
     * 
     * @param servicePlayerAdapter The adapter for the music service player one wants to start with.
     */
    constructor(servicePlayerAdapter: IServicePlayerAdapter) {
        // Set the initial servicePlayerAdapter to be used
        this.currentPlayer = servicePlayerAdapter;
    }

    /**
     * Switches to a new music service.
     * 
     * @param servicePlayerAdapter The adapter for the music service player one wants to switch to.
     */
    public switchPlayer(servicePlayerAdapter: IServicePlayerAdapter) {

    }


    // =======================================================
    // Queue functionality
    // =======================================================

    /**
     * Queue track.
     */
    public queue(track: ITrack): void
    /**
     * Queue multiple tracks.
     */
    public queue(tracks: Array<ITrack>): void
    public queue(trackOrTracks: ITrack | Array<ITrack>): void {
        if (trackOrTracks instanceof Array) {

        }
    }

    /**
     * Increments the index given.
     * The function cycles from 0 to length (i.e. never going out of bounds).
     * 
     * @param index The current index.
     * @param increment The number to increment by (can be negative).
     * @param length The length of the Array.
     * @return The new index.
     */
    private incrementIndex(index: number, increment: number, length: number): number {
        if (length <= 0) {
            return -1;
        }

        let position = (index + increment) % length;
        position = position >= 0 ? position : (length + position);

        return Math.abs(position);
    }

    /**
     * Gets the index in the queue of the current track
     * 
     * @return The index in the queue of the current track.
     */
    public getCurrentIndex(): number {
        return 0; // @NB
    }

    /**
     * Go to the next track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat all, cycle through queue.
     * If repeat === repeat one, restart current track.
     */
    public next() {

    }

    /**
     * Go to the previous track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat all, cycle through queue.
     * If repeat === repeat one, restart current track.
     */
    public previous() {

    }

    // -------------------------------------------------------


    // =======================================================
    // Player functionality
    // =======================================================

    /**
     * Loads and plays the specified track.
     * 
     * @param track The track to be played (@NB: this is set as the current track).
     */
    public load(track: ITrack): void {
        // update current track.
        this.currentPlayer.load(track).then(
            // then once loaded, play track.
            // actually no, the servicePlayerAdapter should play automatically.
            // returning a promise
        );
    }

    /**
     * Plays the current track.
     * If it fails to play, it switches to the next servicePlayerAdapter
     * and loads the track.
     */
    public play(): void {
        this.currentPlayer.play();
    }

    /**
     * Pauses the current track.
     */
    public pause(): void {
        this.currentPlayer.pause();
    }

    /**
     * Plays or pauses the current track depending on its paused state.
     */
    public playPause(): void {
        this.currentPlayer.paused ? this.play() : this.pause();
    }

    /**
     * Stops the current track and resets it to be played from the beginning.
     */
    public stop(): void {
        this.currentPlayer.stop();
    }

    /**
     * Gets the duration of the current track.
     * 
     * @return The duration of the current track in milliseconds.
     */
    public getDuration(): number {
        return this.currentPlayer.getDuration();
    }

    /**
     * Seeks to a specified time in the current track.
     * If the player is paused it will remain paused.
     * If the player is in another state it will play the current track.
     * 
     * @param milliseconds The time in milliseconds to which the player should advance.
     */
    public seekTo(milliseconds: number): void {
        this.currentPlayer.seekTo(milliseconds);
    }

    /**
     * Seeks to a specified percentage in the current track.
     * If the player is paused it will remain paused.
     * If the player is in another state it will play the current track.
     * 
     * @param percentage The percentage (0 to 1) to which the player should advance.
     */
    public seekToPercentage(percentage: number): void {
        this.seekTo(percentage * this.getDuration());
    }

    /**
     * Gets the current time of the track.
     * 
     * @return The current time of the track in milliseconds.
     */
    public getCurrentTime(): number {
        return this.currentPlayer.getCurrentTime();
    }

    /**
     * Gets the current percentage played of the track.
     * 
     * @return The current percentage (0 to 1) played of the track.
     */
    public getCurrentPercentage(): number {
        return this.getCurrentTime() / this.getDuration();
    }

    /**
     * Gets the percentage that the track has loaded
     * 
     * @return The percentage (0 to 1) that the track has loaded
     */
    public getPercentageLoaded(): number {
        return this.currentPlayer.getPercentageLoaded();
    }

    // -------------------------------------------------------


}
