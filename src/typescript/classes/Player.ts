/**
 * Player
 * The player class adopts some of the naming conventions from
 * - HTML Audio/Video               @see http://www.w3schools.com/tags/ref_av_dom.asp
 * - YouTube IFrame Player API      @see https://developers.google.com/youtube/iframe_api_reference
 * - Deezer Player JavaScript SDK   @see https://developers.deezer.com/sdk/javascript/controls
 */
class Player {

    /**
     * The current music service player being used.
     */
    private currentPlayer: IServicePlayerAdapter;
    /**
     * The queue of tracks in the order they were added.
     */
    private orderedQueue: ITrack[] = [];
    /**
     * The queue of tracks in the shuffled order.
     */
    private shuffledQueue: ITrack[] = [];
    /**
     * The index of the current track in the queue.
     */
    private currentTrackIndex: number = -1;
    /**
     * The paused state of the player.
     */
    private paused: boolean;
    /**
     * The amount of time after which this.previous()
     * won't go to the previous track, but rather restart the current track.
     */
    private timeAfterWhichToRestartTrack: number;
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
            throw new Error(`CONSTANTS.PLAYER is used throughout the Player class and needs to be defined.`);
        }

        // Set the initial servicePlayerAdapter to be used
        this.currentPlayer = servicePlayerAdapter;

        // Set the player defaults
        this.repeat = repeat ? repeat : CONSTANTS.PLAYER.DEFAULTS.REPEAT;
        this.shuffle = shuffle ? shuffle : CONSTANTS.PLAYER.DEFAULTS.SHUFFLE;
        this.muted = muted ? muted : CONSTANTS.PLAYER.DEFAULTS.MUTED;
        this.volume = volume ? volume : CONSTANTS.PLAYER.DEFAULTS.VOLUME;

        // More defaults
        this.timeAfterWhichToRestartTrack = CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK;
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
     * 
     * @param track The track to add to the queue.
     */
    public queue(track: ITrack): void
    /**
     * Queue multiple tracks.
     * 
     * @param tracks The tracks to add to the queue.
     */
    public queue(tracks: ITrack[]): void
    public queue(trackOrTracks: ITrack | ITrack[]): void {

        if (trackOrTracks instanceof Array) {
            // trackOrTracks is multiple tracks,
            // so push each track onto the queue.
            for (let track of trackOrTracks) {
                this.orderedQueue.push(track);
            }
        } else {
            // Else trackOrTracks is a single track, 
            // so just push it onto the queue.
            this.orderedQueue.push(trackOrTracks);
        }
    }

    /**
     * Dequeue track.
     * Then, if the queue is empty, set the current track index to -1.
     * 
     * @param track The track to remove from the queue.
     */
    public dequeue(track: ITrack): void
    /**
     * Dequeue multiple tracks.
     * Then, if the queue is empty, set the current track index to -1.
     * 
     * @param track The tracks to remove from the queue.
     */
    public dequeue(tracks: ITrack[]): void
    public dequeue(trackOrTracks: ITrack | ITrack[]): void {

        let indexOfTrack: number;
        if (trackOrTracks instanceof Array) {
            // trackOrTracks is multiple tracks,
            // so dequeue each track onto the queue.
            for (let track of trackOrTracks) {
                indexOfTrack = this.orderedQueue.indexOf(track);
                this.orderedQueue.splice(indexOfTrack, 1);
            }
        } else {
            // Else trackOrTracks is a single track, 
            // so just push it onto the queue.
            indexOfTrack = this.orderedQueue.indexOf(trackOrTracks);
            this.orderedQueue.splice(indexOfTrack, 1);
        }

        // If the queue is empty, set the current track index to -1.
        if (this.orderedQueue.length <= 0) {
            this.currentTrackIndex = -1;
        }
    }

    /**
     * Dequeues all tracks from the queue.
     * Then sets the current track index to -1 as there are no more tracks.
     */
    public dequeueAll() {
        this.currentTrackIndex = -1;
        this.orderedQueue = [];
    }

    /**
     * Gets the queue.
     * 
     * @return The queue of tracks.
     */
    public getQueue(): ITrack[] {
        if (this.shuffle) {
            return this.shuffledQueue;
        } else {
            return this.orderedQueue;
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
        return this.currentTrackIndex;
    }

    /**
     * Checks if the given index is in the queue (i.e. 0 to playerQueue.length)
     * 
     * @param index The index to check.
     * @return True if the index is in the bounds.
     */
    private isIndexInQueue(index: number): boolean {
        return (index >= 0) && (index <= this.orderedQueue.length);
    }

    /**
     * Sets the current track index and loads that track.
     * 
     * @param index The index of the track in the queue.
     */
    public setCurrentIndex(index: number) {
        if (this.isIndexInQueue(index)) {
            this.currentTrackIndex = index;
            this.load(this.orderedQueue[index]);
        } else {
            throw new Error(`The index given is out of the queue bounds.`);
        }
    }

    /**
     * Gets the current track.
     * 
     * @return The current track in the queue, if there are no tracks, return undefined.
     */
    public getCurrentTrack(): ITrack {
        if (this.isIndexInQueue(this.getCurrentIndex())) {
            return this.orderedQueue[this.getCurrentIndex()];
        } else {
            return undefined;
        }
    }

    /**
     * Go to the next track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public next(): void {
        if (!this.isIndexInQueue(this.getCurrentIndex())) {
            throw new Error(`Cannot get the next track in the queue if the current track isn't in the queue.`);
        }

        if (settings.player.repeat === CONSTANTS.PLAYER.REPEAT.ONE) {
            // Restart track.
            this.seekTo(0);
            return;
        } else if (settings.player.repeat === CONSTANTS.PLAYER.REPEAT.NO) {
            // If it's the last song
            if (this.getCurrentIndex() >= (this.orderedQueue.length - 1)) {
                this.stop();
                return;
            } else {
                this.setCurrentIndex(this.getCurrentIndex() + 1);
            }
        } else {
            this.setCurrentIndex(this.incrementIndex(this.getCurrentIndex(), 1, this.orderedQueue.length));
        }

        // Load the current song.
        this.load(this.orderedQueue[this.getCurrentIndex()]);
    }

    /**
     * Go to the previous track.
     * If repeat === no repeat, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public previous(): void {
        if (!this.isIndexInQueue(this.getCurrentIndex())) {
            throw new Error(`Cannot get the previous track in the queue if the current track isn't in the queue.`);
        }

        if ((settings.player.repeat === CONSTANTS.PLAYER.REPEAT.ONE) ||
            (this.getCurrentTime() > this.timeAfterWhichToRestartTrack)) {
            // Restart track.
            this.seekTo(0);
            return;
        } else if (settings.player.repeat === CONSTANTS.PLAYER.REPEAT.NO) {
            // If it's the first song
            if (this.getCurrentIndex() === 0) {
                this.stop();
                return;
            } else {
                this.setCurrentIndex(this.getCurrentIndex() - 1);
            }
        } else {
            this.setCurrentIndex(this.incrementIndex(this.getCurrentIndex(), -1, this.orderedQueue.length));
        }

        // Load the current song.
        this.load(this.orderedQueue[this.getCurrentIndex()]);
    }

    /**
     * Shuffles a given set of tracks.
     * 
     */
    private shuffleTracks(tracks: ITrack[], currentIndex: number): { shuffledTracks: ITrack[], shuffledIndex: number }  {
        return {

        };
    }

    /**
     * Sets the shuffle value.
     * 
     * @param shuffle If true, the queue is shuffled, if false the queue
     */
    public setShuffle(shuffle: boolean): void {

        this.shuffle = shuffle;

        // if shuffle === true
        // tempQueue = cloned orderedQueue;
        // this.shuffleTracks(tempQueue) (keep track of currentTrackIndex in tempQueue).
        // shuffledQueue = tempQueue;

        // if shuffle === false
        // empty shuffledQueue
        // find and set currentTrack in orderedQueue.

    }

    // -------------------------------------------------------


    // =======================================================
    // Player functionality
    // =======================================================

    /**
     * Loads the specified track, respecting the current paused state.
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
        this.paused = false;
        this.currentPlayer.play();
    }

    /**
     * Pauses the current track.
     */
    public pause(): void {
        this.paused = true;
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
