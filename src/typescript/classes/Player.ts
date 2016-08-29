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
     * 
     */
    private currentTrackIndex: number = -1;
    /**
     * Queue of tracks.
     */
    private playerQueue: Array<ITrack> = [];
    /**
     * Repeat can be:
     * - no repeat, don't cycle through queue.
     * - repeat one, restart current track.
     * - repeat all, cycle through queue.
     */
    private repeat: string;
    private shuffle: boolean;
    private muted: boolean;
    private volume: number;

    /**
     * Creates the music player.
     * 
     * @param servicePlayerAdapter The adapter for the music service player one wants to start with.
     * @param repeat The repeat setting @see CONSTANTS.PLAYER.REPEAT
     */
    constructor(servicePlayerAdapter: IServicePlayerAdapter,
        repeat?: string, shuffle?: boolean, muted?: boolean, volume?: number) {

        if (!CONSTANTS.PLAYER) {
            throw new Error("CONSTANTS.PLAYER is used throughout the Player class and needs to be defined.");
        }

        // Set the initial servicePlayerAdapter to be used
        this.currentPlayer = servicePlayerAdapter;
        // Set the player defaults
        this.repeat = repeat ? repeat : CONSTANTS.PLAYER.DEFAULTS.REPEAT;
        this.shuffle = shuffle ? shuffle : CONSTANTS.PLAYER.DEFAULTS.SHUFFLE;
        this.muted = muted ? muted : CONSTANTS.PLAYER.DEFAULTS.MUTED;
        this.volume = volume ? volume : CONSTANTS.PLAYER.DEFAULTS.VOLUME;
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
            // trackOrTracks is multiple tracks,
            // so push each track onto the queue.
            for (let track of trackOrTracks) {
                this.playerQueue.push(track);
            }
        } else {
            // Else trackOrTracks is a single track, 
            // so just push it onto the queue.
            this.playerQueue.push(trackOrTracks);
        }
    }

    /**
     * Dequeue track.
     */
    public dequeue(track: ITrack): void
    /**
     * Dequeue multiple tracks.
     */
    public dequeue(tracks: Array<ITrack>): void
    public dequeue(trackOrTracks: ITrack | Array<ITrack>): void {

        let indexOfTrack: number;
        if (trackOrTracks instanceof Array) {
            // trackOrTracks is multiple tracks,
            // so dequeue each track onto the queue.
            for (let track of trackOrTracks) {
                indexOfTrack = this.playerQueue.indexOf(track);
                this.playerQueue.splice(indexOfTrack, 1);
            }
        } else {
            // Else trackOrTracks is a single track, 
            // so just push it onto the queue.
            indexOfTrack = this.playerQueue.indexOf(trackOrTracks);
            this.playerQueue.splice(indexOfTrack, 1);
        }
    }

    /**
     * Gets the queue.
     * 
     * @return The queue of tracks.
     */
    public getQueue(): Array<ITrack> {
        return this.playerQueue;
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
     * Checks if the given index is in the queue (i.e. 0 to playerQueue.length)
     * 
     * @param index The index to check.
     * @return True if the index is in the bounds.
     */
    private isIndexInQueue(index: number): boolean {
        return (index >= 0) && (index <= this.playerQueue.length);
    }

    /**
     * Sets the current track index and loads that track.
     * 
     * @param index The index of the track in the queue.
     */
    public setCurrentIndex(index: number) {
        if (this.isIndexInQueue(index)) {
            // @NB if the currentTrackIndex isn't set in this.load, set it here.
            // this.currentTrackIndex = index;
            this.load(this.playerQueue[index]);
        } else {
            throw new Error("The index given is out of the queue bounds.");
        }
    }

    /**
     * Gets the current track.
     * 
     * @return The current track
     */
    public getCurrentTrack(): ITrack {

    }

    /**
     * Go to the next track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public next(): void {
        if (settings.player.repeat === CONSTANTS.PLAYER.REPEAT.NO) {

        } else if (settings.player.repeat === CONSTANTS.PLAYER.REPEAT.ONE) {

        } else {

        }
    }

    /**
     * Go to the previous track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public previous(): void {

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
        // update current track index.
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
     * Get the players volume percentage.
     * 
     * @return The percentage (0 to 1) volume.
     */
    public getVolume(): number {
        return this.volume;
    }

    /**
     * Sets the players volume percentage.
     * When the volume is set, the player is automatically unMuted
     * 
     * @param volume The percentage (0 to 1) volume to set the player to.
     */
    public setVolume(volume: number): void {
        this.volume = volume;

        this.currentPlayer.setVolume(this.volume);
    }

    /**
     * Sets the muted state.
     * 
     * @param muted If true, the player will be muted.
     */
    public setMute(muted: boolean): void {
        this.muted = muted;

        if (this.muted) {
            // Must use the currentPlayer.setVolume
            // else it will override the player volume (i.e. this.volume)
            this.currentPlayer.setVolume(0);
        } else {
            this.currentPlayer.setVolume(this.volume);
        }
    }

    /**
     * Toggles the muted state.
     * 
     * @return The current muted state.
     */
    public toggleMuted(): boolean {
        this.setMute(!this.muted);
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
