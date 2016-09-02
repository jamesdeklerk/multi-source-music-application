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
    private currentPlayer: IPlayerAdapter;
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
     * - repeat off, don't cycle through queue.
     * - repeat one, restart current track.
     * - repeat all, cycle through queue.
     */
    private repeat: string;
    private shuffle: boolean = false;
    private volume: number = 1;
    private muted: boolean = false;

    /**
     * Creates the music player.
     * 
     * @param repeat The repeat setting @see CONSTANTS.PLAYER.REPEAT
     */
    constructor(repeat?: string, shuffle?: boolean, volume?: number, muted?: boolean) {

        if (!CONSTANTS.PLAYER) {
            throw new Error(`CONSTANTS.PLAYER is used throughout the Player class and needs to be defined.`);
        }

        if (!publisher) {
            throw new Error(`The publish-subscribe library is used through the Player class ` +
            `and should be instantiated before the Player class is instantiated.`);
        }

        // Instantiate all the music service player adapters.
        // for each registered music service player adapter... 
        // playerAdapters = {
        //    "deezer": Initialized DeezerAdapter,
        //    "youtube": Initialized YouTubeAdapter,
        //    "soundcloud": Initialized SoundCloudAdapter
        //}

        // Initialize all the music service player adapters for use.

        // Set the initial playerAdapter to be used
        // using this.switchPlayer();

        // Set the player defaults
        this.setRepeat(repeat ? repeat : CONSTANTS.PLAYER.DEFAULTS.REPEAT);
        this.setShuffle(shuffle ? shuffle : CONSTANTS.PLAYER.DEFAULTS.SHUFFLE);
        this.setVolume(volume ? volume : CONSTANTS.PLAYER.DEFAULTS.VOLUME);
        this.setMuted(muted ? muted : CONSTANTS.PLAYER.DEFAULTS.MUTED);

        // More defaults
        this.timeAfterWhichToRestartTrack = CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK;
    }


    // =======================================================
    // Registering events to be published by the player
    // (i.e. an instance of this class).
    // =======================================================

    private registerPlayerEvents(): void {

        // publisher.register(CONSTANTS.PLAYER.EVENTS)

    }

    // -------------------------------------------------------


    // =======================================================
    // Registering events for music service adapters
    // to implement.
    // =======================================================

    /**
     * Registers the events to be published by the music service adapters.
     */
    private registerPlayerAdapterEvents(): void {



    }

    // -------------------------------------------------------


    // =======================================================
    // Dealing with music service player adapters.
    // =======================================================

    /**
     * Switches to a new music service.
     * 
     * @param playerAdapter The adapter for the music service player one wants to switch to.
     */
    public switchPlayer(playerAdapter: IPlayerAdapter): void {

        // @NB Unload old player

        // Switch to the new music service player.
        this.currentPlayer = playerAdapter;

        // Reset the current player volume and muted state since
        // the new music service player adapter might not have the latest values.
        this.setVolume(this.getVolume());
        this.setMuted(this.getMuted());

        // Load the current track.
        this.load(this.getCurrentTrack());
    }

    // -------------------------------------------------------


    // =======================================================
    // Queue functionality
    // =======================================================

    /**
     * Gets the players shuffle state.
     * 
     * @return The shuffle state. 
     */
    public getShuffle(): boolean {
        return this.shuffle;
    }

    /**
     * Shuffles a given set of tracks using the Fisher–Yates shuffle.
     * It keeps the original set of tracks in order.
     * @see http://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     * @see https://github.com/coolaj86/knuth-shuffle
     * 
     * @param tracks The array of tracks to shuffle.
     * @return An object containing the shuffled tracks and the shuffle index of the index given.
     */
    private shuffleTracks(tracks: ITrack[]): ITrack[] {

        // Clone the array of tracks in order to not alter the original array.
        // @see https://davidwalsh.name/javascript-clone-array
        let shuffledTracks = tracks.slice(0);

        let currentIndex = shuffledTracks.length;
        let randomIndex: number;
        let temporaryValue: ITrack;

        // Shuffle the tracks.
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex = currentIndex - 1;

            // And swap it with the current element.
            temporaryValue = shuffledTracks[currentIndex];
            shuffledTracks[currentIndex] = shuffledTracks[randomIndex];
            shuffledTracks[randomIndex] = temporaryValue;
        }

        return shuffledTracks;
    }

    /**
     * Sets the shuffle value.
     * 
     * @param shuffle If true, the queue is shuffled, if false the queue
     */
    public setShuffle(shuffle: boolean): void {

        // Get the current track before setting the shuffle value.
        // If we don't do this before setting the shuffle value,
        // we won't get the correct track 
        // (because the currentTrackIndex will be for the wrong queue).
        let currentTrack = this.getCurrentTrack();
        let currentTrackIndex: number;

        if (shuffle) {
            this.shuffledQueue = this.shuffleTracks(this.orderedQueue);
            // Get the index of the current track in the current (shuffled) queue.
            currentTrackIndex = this.shuffledQueue.indexOf(currentTrack);
        } else {
            this.shuffledQueue = [];
            // Get the index of the current track in the current (ordered) queue.
            currentTrackIndex = this.orderedQueue.indexOf(currentTrack);
        }

        // Update the current track index to the index in the current queue.
        // We don't use this.setCurrentIndex(currentTrackIndex);
        // Because that would load the track when we just want to update the index.
        // to be correct for the current queue.
        this.currentTrackIndex = currentTrackIndex;

        // Finally we can set the shuffled state
        this.shuffle = shuffle;
    }

    /**
     * Toggles the shuffle state.
     * 
     * @return The current shuffle state.
     */
    public toggleShuffle(): boolean {
        let shuffle = !this.getShuffle();

        this.setShuffle(shuffle);

        return shuffle;
    }

    /**
     * Gets the players repeat state.
     * 
     * @return The repeat state. 
     */
    public getRepeat(): string {
        return this.repeat;
    }

    /**
     * Sets the repeat value.
     * If the value given is not a valid repeat value, it sets it to all by default.
     * - repeat off, don't cycle through queue.
     * - repeat one, restart current track.
     * - repeat all, cycle through queue.
     * 
     * @param value The value to set repeat to.
     */
    public setRepeat(value: string): void {

        if (value === CONSTANTS.PLAYER.REPEAT.OFF ||
            value === CONSTANTS.PLAYER.REPEAT.ONE ||
            value === CONSTANTS.PLAYER.REPEAT.ALL) {
                this.repeat = value;
        } else {
            this.repeat = CONSTANTS.PLAYER.REPEAT.ALL;
        }
    }

    /**
     * Cycles through the repeat values.
     * 
     * @return The current repeat value.
     */
    public cycleRepeat(): string {
        // Cycle order
        let cycleOrder = [
            CONSTANTS.PLAYER.REPEAT.OFF,
            CONSTANTS.PLAYER.REPEAT.ALL,
            CONSTANTS.PLAYER.REPEAT.ONE,
        ];

        let currentIndex = cycleOrder.indexOf(this.getRepeat());

        // Set the new value.
        this.setRepeat(cycleOrder[this.incrementIndex(currentIndex, 1, cycleOrder.length)]);

        return this.getRepeat();
    }

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
            // trackOrTracks is multiple tracks.

            // Push each track onto the orderedQueue.
            for (let track of trackOrTracks) {
                this.orderedQueue.push(track);
            }

            // If the queue is shuffled,
            // push each track onto the shuffledQueue.
            if (this.getShuffle()) {
                for (let track of trackOrTracks) {
                    this.shuffledQueue.push(track);
                }
            }
        } else {
            // Else trackOrTracks is a single track.

            // Push the track onto the orderedQueue.
            this.orderedQueue.push(trackOrTracks);

            // If the queue is shuffled,
            // push the track onto the shuffledQueue.
            if (this.getShuffle()) {
                this.shuffledQueue.push(trackOrTracks);
            }
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
            // trackOrTracks is multiple tracks.

            // Dequeue each track on the from the orderedQueue.
            for (let track of trackOrTracks) {
                indexOfTrack = this.orderedQueue.indexOf(track);
                this.orderedQueue.splice(indexOfTrack, 1);
            }

            // If the queue is shuffled,
            // dequeue each track on the from the shuffledQueue.
            if (this.getShuffle()) {
                for (let track of trackOrTracks) {
                    indexOfTrack = this.shuffledQueue.indexOf(track);
                    this.shuffledQueue.splice(indexOfTrack, 1);
                }
            }
        } else {
            // Else trackOrTracks is a single track.

            // Dequeue track from the orderedQueue.
            indexOfTrack = this.orderedQueue.indexOf(trackOrTracks);
            this.orderedQueue.splice(indexOfTrack, 1);

            // If the queue is shuffled,
            // dequeue track from the shuffledQueue.
            if (this.getShuffle()) {
                indexOfTrack = this.shuffledQueue.indexOf(trackOrTracks);
                this.shuffledQueue.splice(indexOfTrack, 1);
            }
        }

        // If the queue is empty, set the current track index to -1.
        if (this.orderedQueue.length <= 0) {
            // @NB rather than this.currentTrackIndex = -1; 
            // maybe call this.stop(); or maybe create an unload function...
            this.currentTrackIndex = -1;
        }
    }

    /**
     * Dequeues all tracks from the queue.
     * Then sets the current track index to -1 as there are no more tracks.
     */
    public dequeueAll(): void {
        this.currentTrackIndex = -1;
        this.orderedQueue = [];
        this.shuffledQueue = [];
    }

    /**
     * Gets the queue.
     * 
     * @return The queue of tracks.
     */
    public getQueue(): ITrack[] {
        if (this.getShuffle()) {
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
     * Gets the index of the current track in the queue.
     * 
     * @return The index in the queue of the current track.
     */
    public getCurrentIndex(): number {
        return this.currentTrackIndex;
    }

    /**
     * Checks if the index is in the queue (i.e. 0 to queue.length)
     * 
     * @param index The index to check.
     * @param queue The queue to check.
     * @return True if the index is in the bounds.
     */
    private isIndexInQueue(index: number, queue: ITrack[]): boolean {
        return (index >= 0) && (index <= (queue.length - 1));
    }

    /**
     * Sets the current track index and loads that track.
     * 
     * @param index The index of the track in the queue.
     * @return The new index.
     */
    public setCurrentIndex(index: number): number {
        let currentQueue = this.getQueue();

        if (this.isIndexInQueue(index, currentQueue)) {
            this.currentTrackIndex = index;
            // Load the track at that index.
            this.load(currentQueue[index]);
            return index;
        } else {
            throw new Error(`The index given is out of the queue bounds.`);
        }
    }

    /**
     * Reorder the queue.
     * 
     * @param moves An array of moves { oldIndex: number, newIndex: number }.
     */
    public reorderQueue(moves: [{ oldIndex: number, newIndex: number }]): void {
        // This is a pointer to the current queue.
        // The reason that is important is when splice is called, it edits the array.
        let currentQueue = this.getQueue();
        let track: ITrack;

        for (let move of moves) {
            // Make sure the give indexes are in the current queue.
            if (this.isIndexInQueue(move.oldIndex, currentQueue) && this.isIndexInQueue(move.newIndex, currentQueue)) {
                // Remove the element from the array.
                track = currentQueue.splice(move.oldIndex, 1)[0];
                // Place it at the new index.
                currentQueue.splice(move.newIndex, 0, track);
            }
        }
    }

    /**
     * Gets the current track.
     * 
     * @return The current track in the queue, if there are no tracks, return undefined.
     */
    public getCurrentTrack(): ITrack {
        let currentQueue = this.getQueue();
        let currentIndex = this.getCurrentIndex();

        if (this.isIndexInQueue(currentIndex, currentQueue)) {
            return currentQueue[currentIndex];
        } else {
            return undefined;
        }
    }

    /**
     * Go to the next track.
     * If repeat === repeat off, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public next(): void {
        let currentQueue = this.getQueue();
        let currentIndex = this.getCurrentIndex();
        let repeat = this.getRepeat();

        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error(`Cannot get the next track in the queue if the current track isn't in the queue.`);
        }

        if (repeat === CONSTANTS.PLAYER.REPEAT.ONE) {
            // Restart track.
            this.restart();
            return;
        } else if (repeat === CONSTANTS.PLAYER.REPEAT.OFF) {
            // If it's the last track
            if (currentIndex >= (currentQueue.length - 1)) {
                this.stop();
                return;
            } else {
                currentIndex = this.setCurrentIndex(currentIndex + 1);
            }
        } else {
            currentIndex = this.setCurrentIndex(this.incrementIndex(currentIndex, 1, currentQueue.length));
        }
    }

    /**
     * Go to the previous track.
     * If repeat === repeat off, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public previous(): void {
        let currentQueue = this.getQueue();
        let currentIndex = this.getCurrentIndex();
        let repeat = this.getRepeat();

        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error(`Cannot get the previous track in the queue if the current track isn't in the queue.`);
        }

        if ((repeat === CONSTANTS.PLAYER.REPEAT.ONE) ||
            (this.getCurrentTime() > this.timeAfterWhichToRestartTrack)) {
            // Restart track.
            this.restart();
            return;
        } else if (repeat === CONSTANTS.PLAYER.REPEAT.OFF) {
            // If it's the first track
            if (currentIndex === 0) {
                this.stop();
                return;
            } else {
                currentIndex = this.setCurrentIndex(currentIndex - 1);
            }
        } else {
            currentIndex = this.setCurrentIndex(this.incrementIndex(currentIndex, -1, currentQueue.length));
        }
    }

    // -------------------------------------------------------


    // =======================================================
    // Player functionality
    // =======================================================

    /**
     * Loads the specified track, respecting the current paused state and seek position.
     * If it fails to load, it switches to the next playerAdapter
     * and loads the track.
     * 
     * @param track The track to be played (@NB: this is set as the current track).
     */
    public load(track: ITrack): void {

        // If track is undefined then don't try load it.

        // Once the new track is loaded, remember to set the progress.

        // update current track.
        // update current track index.
        this.currentPlayer.load(track).then(
            // then once loaded, play track.
            // actually no, the playerAdapter should play automatically.
            // returning a promise
        );
    }

    /**
     * Plays the current track.
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
     * Stops the current track and cancels loading of the current track.
     */
    public stop(): void {
        this.currentPlayer.stop();
    }

    /**
     * Restart the current track.
     */
    public restart(): void {
        this.seekTo(0);
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
     * If the player is muted, it is not automatically unmuted by default.
     * 
     * @param volume The percentage (0 to 1) volume to set the player to.
     * @param unmute Determines whether or not to unmute the player when the volume is set.
     */
    public setVolume(volume: number, unmute?: boolean): void {

        // Get the current muted state of the player.
        let muted = this.getMuted();

        // Update the stored volume.
        this.volume = volume;

        // If not currently muted, just set the volume.
        if (!muted) {
            this.currentPlayer.setVolume(volume);
        } else
        // If currently muted and unmute === true, unmute and set the volume.
        if (muted && unmute) {
            this.setMuted(false);
            // this.currentPlayer.setVolume(volume); - don't need to call this as it is called in setMuted();
        }

    }

    /**
     * Gets the muted state of the player.
     * 
     * @return The muted state of the player.
     */
    public getMuted(): boolean {
        return this.muted;
    }

    /**
     * Sets the muted state.
     * 
     * @param mute If true, the player will be muted.
     */
    public setMuted(mute: boolean): void {
        this.muted = mute;

        if (this.muted) {
            // Must use the currentPlayer.setVolume
            // else it will override the player volume
            this.currentPlayer.setVolume(0);
        } else {
            this.currentPlayer.setVolume(this.getVolume());
        }
    }

    /**
     * Toggles the muted state.
     * 
     * @return The current muted state.
     */
    public toggleMuted(): boolean {
        let mute = !this.getMuted();

        this.setMuted(mute);

        return mute;
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
     * Gets the percentage that the track has loaded.
     * 
     * @return The percentage (0 to 1) that the track has loaded.
     */
    public getPercentageLoaded(): number {
        return this.currentPlayer.getPercentageLoaded();
    }

    // -------------------------------------------------------


    // =======================================================
    // Subscribing to events published by
    // music service adapters.
    // =======================================================



    // -------------------------------------------------------


}
