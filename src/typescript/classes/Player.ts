/**
 * Player
 * The player class adopts some of the naming conventions from
 * - HTML Audio/Video               @see http://www.w3schools.com/tags/ref_av_dom.asp
 * - YouTube IFrame Player API      @see https://developers.google.com/youtube/iframe_api_reference
 * - Deezer Player JavaScript SDK   @see https://developers.deezer.com/sdk/javascript/controls
 */
class Player {

    // =======================================================
    // CONSTANTS.
    // =======================================================

    private REGISTERED_SERVICES = CONSTANTS.PLAYER.REGISTERED_SERVICES;
    /**
     * Legal values for repeat.
     */
    public REPEAT = {
        /**
         * Cycle through all the tracks in the queue.
         */
        ALL: `repeat-all`,
        /**
         * When the player gets to the end of the queue,
         * stop playing.
         */
        OFF: `repeat-off`,
        /**
         * Keep repeating the current track.
         */
        ONE: `repeat-one`,
    };
    private DEFAULTS = {
        MUTED: CONSTANTS.PLAYER.DEFAULTS.MUTED,
        REPEAT: CONSTANTS.PLAYER.DEFAULTS.REPEAT,
        SHUFFLE: CONSTANTS.PLAYER.DEFAULTS.SHUFFLE,
        TIME_AFTER_WHICH_TO_RESTART_TRACK: CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK,
        VOLUME: CONSTANTS.PLAYER.DEFAULTS.VOLUME,
    };
    public EVENTS = {
        ON_MUSIC_SERVICE_CHANGE: `onMusicServiceChange`,
        ON_MUTED_CHANGE: `onMutedChange`,
        ON_NEXT: `onNext`,
        ON_PLAY_PAUSE: `onPlayPause`,
        ON_PREVIOUS: `onPrevious`,
        ON_REPEAT_CHANGE: `onRepeatChange`,
        ON_SHUFFLE_CHANGE: `onShuffleChange`,
        ON_TIME_UPDATE: `onTimeUpdate`, // Published when the current playback position has changed.
        ON_TRACK_DEQUEUED: `onTrackDequeued`,
        ON_TRACK_INDEX_UPDATED: `onTrackIndexUpdated`,
        ON_TRACK_LOADED: `onTrackLoaded`, // loaded track
        ON_TRACK_LOAD_FAILED: `onTrackLoadFailed`, // track failed to load
        ON_TRACK_QUEUED: `onTrackQueued`,
        ON_VOLUME_CHANGE: `onVolumeChange`,
    };

    // -------------------------------------------------------


    // =======================================================
    // Class parameters.
    // =======================================================

    /**
     * Array of Registered Music Services and their associated Adapters.
     * musicServices = [
     *     {
     *         adapter: Initialized DeezerAdapter,
     *         initialized: false,
     *         name: `Deezer`,
     *     },
     *     {
     *         adapter: Initialized YouTubeAdapter,
     *         initialized: false,
     *         name: `YouTube`,
     *     },
     *     {
     *         adapter: Initialized SoundCloudAdapter,
     *         initialized: false,
     *         name: `SoundCloud`,
     *     },
     * ]
     */
    private musicServices: IMusicService[] = [];
    /**
     * The index of the current musicService in the musicServices.
     */
    private currentMusicServiceIndex: number = -1;
    /**
     * A hashmap of the music services tried when loading a track.
     * This is cleared as soon as a track is successfully loaded.
     * 
     * For example if SoundCloud hasn't been tried, it isn't there (i.e. is "false")
     * musicServicesTried = {
     *     "Deezer": true,
     *     "YouTube": true,
     * }
     */
    private musicServicesTried: any = {};
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
     * Set to -1 if no track is currently loaded.
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
    private shuffle: boolean;
    private volume: number = this.DEFAULTS.VOLUME;
    private muted: boolean = this.DEFAULTS.MUTED;

    // -------------------------------------------------------


    /**
     * Creates the music player.
     * 
     * @param repeat The repeat setting @see CONSTANTS.PLAYER.REPEAT
     */
    constructor() {

        if (!CONSTANTS.PLAYER) {
            throw new Error(`CONSTANTS.PLAYER is used throughout the Player class and needs to be defined.`);
        }

        if (!publisher) {
            throw new Error(`The publish-subscribe library is used through the Player class ` +
                `and should be instantiated before the Player class is instantiated.`);
        }

        // Instantiate each of the registered music service player adapters.
        // tslint:disable-next-line
        for (let i = 0, musicService: IMusicService; musicService = this.REGISTERED_SERVICES[i]; i = i + 1) {
            this.musicServices[i] = {
                adapter: new musicService.adapter(),
                // Set initialized to false because none of them have been
                // initialized, they've only been instantiated.
                initialized: false,
                name: musicService.name,
            };
        }

        // Set the initial playerAdapter to be used.
        if (this.musicServices[0]) {
            this.changeMusicService(this.musicServices[0].name);
        } else {
            throw new Error(`No music service player adapters available.`);
        }

        // Set the player defaults
        this.setRepeat(this.DEFAULTS.REPEAT);
        this.setShuffle(this.DEFAULTS.SHUFFLE);

        // More defaults
        this.timeAfterWhichToRestartTrack = this.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK;

        // Register the player events.
        this.registerPlayerEvents();

        // Subscribe to events.
        this.subscribeToEvents();

        // Setup the track progress event.
        let currentTime: number;
        let currentDuration: number;
        let currentPercentage: number;
        let lastTime: number = 0;
        let playerContext = this;
        function timeUpdated() {

            currentTime = playerContext.getCurrentTime();
            currentDuration = playerContext.getDuration();
            currentPercentage = (currentTime / currentDuration) || 0;

            // Only if the current time has actually changed should the onTimeUpdate event be published.
            if (currentTime !== lastTime) {
                lastTime = currentPercentage;
                publisher.publish(playerContext.EVENTS.ON_TIME_UPDATE, currentTime, currentDuration, currentPercentage);
            }

            // Check if the time has changed every 300 milliseconds.
            setTimeout(timeUpdated, 300);
        }
        // Start the timeUpdated recursive loop.
        timeUpdated();

    }


    // =======================================================
    // Registering events to be published by the player
    // (i.e. an instance of this class).
    // =======================================================

    private registerPlayerEvents(): void {

        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_CHANGE, [
            {
                description: `The name of the music service that was being used.`,
                name: `previousMusicServiceName`,
                type: `string`,
            },
            {
                description: `The name of the music service currently being used.`,
                name: `currentMusicServiceName`,
                type: `string`,
            },
        ]);

        publisher.register(this.EVENTS.ON_MUTED_CHANGE, [
            {
                name: `muted`,
                type: `boolean`,
            },
        ]);

        publisher.register(this.EVENTS.ON_NEXT, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_PLAY_PAUSE, [
            {
                name: `paused`,
                type: `boolean`,
            },
        ]);

        publisher.register(this.EVENTS.ON_PREVIOUS, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_REPEAT_CHANGE, [
            {
                name: `repeat`,
                type: `string`,
            },
        ]);

        publisher.register(this.EVENTS.ON_SHUFFLE_CHANGE, [
            {
                name: `shuffled`,
                type: `boolean`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_TIME_UPDATE, [
            {
                name: `time`,
                type: `number`,
            },
            {
                name: `duration`,
                type: `number`,
            },
            {
                name: `percentage`,
                type: `number`,
            },
        ]);

        publisher.register(this.EVENTS.ON_TRACK_DEQUEUED, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_TRACK_INDEX_UPDATED, [
            {
                name: `previousIndex`,
                type: `number`,
            },
            {
                name: `currentIndex`,
                type: `number`,
            },
        ]);

        publisher.register(this.EVENTS.ON_TRACK_LOADED, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_TRACK_LOAD_FAILED, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_TRACK_QUEUED, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        publisher.register(this.EVENTS.ON_VOLUME_CHANGE, [
            {
                name: `volume`,
                type: `number`,
            },
        ]);

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
     * Gets the current music services index.
     * 
     * @return The current music services index.
     */
    public getCurrentMusicServiceIndex(): number {
        return this.currentMusicServiceIndex;
    }

    /**
     * Sets the current music services index.
     * 
     * @param The current music service index in this.musicServices.
     * @return True if the index given was valid and successfully set, else false
     * because the given music service index was not a valid index in this.musicService.
     */
    public setCurrentMusicServiceIndex(index: number): boolean {
        // If it's a valid index.
        if (index < this.musicServices.length && index >= 0) {
            this.currentMusicServiceIndex = index;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Changes to a new music service, initializing it if need be.
     * This unloads the track from the previous player and does not load a track into the new player.
     * 
     * @param musicServiceName The name of the music service one wants to switch to.
     * @return A promise the tells when it's done switching services.
     */
    private changeMusicService(musicServiceName: string): Promise<any> {

        return new Promise((resolve, reject) => {

            let previousMusicService = this.musicServices[this.getCurrentMusicServiceIndex()];
            let previousMusicServiceName: string;
            if (previousMusicService) {
                previousMusicServiceName = previousMusicService.name;
            }

            // If the previous music service is the same as the new one,
            // and it is initialized, immediately resolve the promise.
            if (previousMusicServiceName === musicServiceName && previousMusicService.initialized) {
                console.log(`You tried to load the player that's currently loaded.`);
                resolve();
            }

            // Unload any track that was in the previous player.
            // Don't call this.unload(true) because that will publish an event,
            // just unload the any track that was in the previous player.
            // The currentPlayer is the previous player because we haven't switched yet.
            if (this.currentPlayer) {
                this.currentPlayer.unload();
            }

            let musicService: IMusicService;
            let musicServiceIndex: number;

            // Find the music service in the list of registered music services,
            // and set the music services index. 
            // tslint:disable-next-line
            for (let i = 0, currentMusicService: IMusicService; currentMusicService = this.musicServices[i]; i = i + 1) {
                if (currentMusicService.name === musicServiceName) {
                    musicService = currentMusicService;
                    musicServiceIndex = i;
                    // Break the for loop when found.
                    break;
                }
            }
            console.log(`musicServiceIndex = ${musicServiceIndex}`);

            // Check if the music service was found.
            if (!musicService) {
                throw new Error(`Music service ${musicServiceName} not found in the list of ` +
                    `registered music services (names are case-sensitive).`);
            }

            this.currentMusicServiceIndex = musicServiceIndex;
            this.currentPlayer = undefined;

            // If the new musicService isn't initialized,
            // initialize it, then try switch music services again.
            if (!musicService.initialized) {

                (<IPlayerAdapter> musicService.adapter).initialize().then(() => {

                    // The music service has been successfully Initialized.
                    musicService.initialized = true;
                    this.changeMusicService(musicService.name).then(() => {

                        // If we get here, the musicService has been initialized,
                        // and the it has switched to the new music service,
                        // so finally we can resolve the original promise.
                        resolve();

                    }).catch(() => {

                        // Failed to switch music services.
                        // reject the original promise.
                        reject();

                    });

                }).catch(() => {

                    // Failed to initialize the player,
                    // reject the promise.
                    reject();

                });

            } else {

                // Set the new music service index.
                this.setCurrentMusicServiceIndex(musicServiceIndex);

                // Change to using the new music service player adapter.
                this.currentPlayer = musicService.adapter;

                // Reset the current player volume and muted state because
                // the new music service player adapter might not have the latest values.
                this.setVolume(this.getVolume());
                this.setMuted(this.getMuted());

                // Publish an event saying the music service has been switched successfully.
                let currentMusicServiceName = this.musicServices[musicServiceIndex].name;
                publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_CHANGE, (previousMusicServiceName || `None`), currentMusicServiceName);

                // Resolve promise for when the musicService
                // was already initialized.
                resolve();

            }

        });

    }

    /**
     * Changes to a new music service and resumes
     * the track that was playing on the previous music service.
     * 
     * @param musicServiceName The name of the music service one wants to switch to.
     * @return A promise the tells when it's done switching services.
     */
    public dynamicallyChangeMusicService(musicServiceName: string): Promise<any> {

        return new Promise((resolve, reject) => {

            // Save the current time.
            let currentTrackIndex = this.getCurrentIndex();
            let currentTime = this.getCurrentTime();
            let paused = this.getPaused();

            // Change music services.
            this.changeMusicService(musicServiceName).then(() => {

                // The music service has successfully been changed,
                // so load the current track.
                this.load(currentTrackIndex).then(() => {

                    // The current track loaded successfully in the new music service.
                    // Now reload the current tracks previous state.
                    this.seekTo(currentTime);
                    if (paused) {
                        this.pause();
                    } else {
                        this.play();
                    }

                    // The track was successfully loaded in the new music service,
                    // and its state restored so the promise can be resolved.
                    resolve();

                }).catch(() => {

                    // The current track failed to load in the new music service.
                    reject();
                });

            }).catch(() => {

                // Failed to change music services.
                reject();
            });

        });

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
        this.setCurrentIndex(currentTrackIndex);

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

        if (value === this.REPEAT.OFF ||
            value === this.REPEAT.ONE ||
            value === this.REPEAT.ALL) {
            this.repeat = value;
        } else {
            this.repeat = this.REPEAT.ALL;
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
            this.REPEAT.OFF,
            this.REPEAT.ALL,
            this.REPEAT.ONE,
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
     * Dequeue a track by index in queue.
     * If the currently playing track is dequeued, it will go to the next track in the queue.
     * 
     * @param index The index of the track to remove from the queue.
     */
    public dequeue(index: number): void {

        // If the index given isn't in the queue, throw an error.
        if (!this.isIndexInQueue(index, this.getQueue())) {
            throw new Error(`The dequeue index provided is not a valid index (i.e. isn't in the queue).`)
        }

        // Save the paused state.
        let paused = this.getPaused();

        // We know it's a valid index, so set it as the index of the track to dequeue.
        let indexOfTrackToDequeue = index;
        console.log(`Dequeued: ${this.getQueue()[indexOfTrackToDequeue].title}`);

        let shuffled = this.getShuffle();
        let repeat = this.getRepeat();
        let currentTrackIndex = this.getCurrentIndex();

        // If the queue isn't shuffled, just remove the track at the specified index,
        // from the ordered queue.
        if (!shuffled) {
            this.orderedQueue.splice(indexOfTrackToDequeue, 1);
        } else {
            // If the queue is shuffled, dequeue the first track of that type from the orderedQueue.
            let trackToBeDequeued = this.shuffledQueue[indexOfTrackToDequeue];
            let indexOfTrackToDequeueFromOrderedQueue = this.orderedQueue.indexOf(trackToBeDequeued);
            this.orderedQueue.splice(indexOfTrackToDequeueFromOrderedQueue, 1);

            // Then dequeue track from the shuffledQueue.
            this.shuffledQueue.splice(indexOfTrackToDequeue, 1);
        }

        // Get the updated current queue (because a track was just dequeued).
        let currentQueue = this.getQueue();

        // If the queue is now empty, just unload the player.
        if (currentQueue.length <= 0) {
            this.unload();
            return;
        }

        // If the track dequeued was the one currently playing.
        if (currentTrackIndex === indexOfTrackToDequeue) {

            // And repeat is one, clear the player.
            if (repeat === this.REPEAT.ONE) {

                // Clear the current track and set the currentTrackIndex to -1;
                this.unload();

                return;
            }

            // Else, if the track dequeued was the one currently playing,
            // and the track dequeued wasn't the last track,
            // load the track that took its place.
            if (currentTrackIndex < currentQueue.length) {

                this.playTrack(currentTrackIndex, true).then(() => {
                    if (paused) {
                        this.pause();
                    }
                });

            } else {

                // Else the track dequeued was the last in the current queue,
                // so no track took its place.
                // Check the repeat state to determine what to do.
                if (repeat === this.REPEAT.ALL) {

                    // Load the first track in the current queue.
                    this.playTrack(0, true).then(() => {
                        if (paused) {
                            this.pause();
                        }
                    });

                } else {

                    // Else it's repeat off,
                    // so set the currentTrackIndex to the last track in the queue 
                    // and unload the player.
                    this.setCurrentIndex(currentQueue.length - 1);
                    this.unload(true);

                }

            }

            return;
        }

        // If the track dequeued was before the current track in the queue,
        // then the currentTrackIndex just needs to be shifted up one,
        // in order to be corret (because one track was removed above it).
        if (indexOfTrackToDequeue < currentTrackIndex) {
            this.setCurrentIndex(currentTrackIndex - 1);
        }
    }

    /**
     * Dequeues all tracks from the queue.
     * Then sets the current track index to -1 as there are no more tracks.
     */
    public dequeueAll(): void {
        this.orderedQueue = [];
        this.shuffledQueue = [];
        // Unload whatever track was being played.
        this.unload();
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
     * Sets the index of the current track in the queue.
     * 
     * @param index The index of the current track in the queue.
     * @return True if the index was in the queue hence it set the index,
     * false if the index wasn't in the queue, hence didn't set the index.
     */
    public setCurrentIndex(index: number): boolean {
        let currentQueue = this.getQueue();

        if (this.isIndexInQueue(index, currentQueue)) {
            this.currentTrackIndex = index;
            return true;
        } else {
            return false;
        }
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

        if (repeat === this.REPEAT.ONE) {
            // Restart track.
            this.restart();
            return;
        } else if (repeat === this.REPEAT.OFF) {
            // If it was on the last track, just unload it.
            // Else load the next track.
            if (currentIndex >= (currentQueue.length - 1)) {
                // Unload the track, but don't set this.currentTrackIndex = -1;
                this.unload(true);
                return;
            } else {
                this.loadTrack(currentIndex + 1);
            }
        } else {
            this.loadTrack(this.incrementIndex(currentIndex, 1, currentQueue.length));
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

        if ((repeat === this.REPEAT.ONE) ||
            (this.getCurrentTime() > this.timeAfterWhichToRestartTrack)) {
            // Restart track.
            this.restart();
            return;
        } else if (repeat === this.REPEAT.OFF) {
            // If it was on the first track, just unload it.
            // Else load the previous track.
            if (currentIndex === 0) {
                // Unload the track, but don't set this.currentTrackIndex = -1;
                this.unload(true);
                return;
            } else {
                this.loadTrack(currentIndex - 1);
            }
        } else {
            this.loadTrack(this.incrementIndex(currentIndex, -1, currentQueue.length));
        }
    }

    // -------------------------------------------------------


    // =======================================================
    // Player functionality
    // =======================================================

    /**
     * Unloads the current track. This stops the playing of current track and 
     * unloads it from the player.
     * This sets this.currentTrackIndex = -1;
     * 
     * @param dontClearCurrentTrackIndex True specifies that the that it shouldn't set this.currentTrackIndex = -1;
     */
    private unload(dontClearCurrentTrackIndex?: boolean): void {
        if (this.currentPlayer) {

            // Unload the current player.
            this.currentPlayer.unload();

            if (!dontClearCurrentTrackIndex) {
                // Now there isn't a current track, so set the index to -1.
                this.currentTrackIndex = -1;

                // @NB publish unload event here.
            }
        }
    }

    /**
     * Loads the specified track from the queue using the currentPlayer,
     * updating the current track index in the process.
     * 
     * @param index The index of track to be played in the queue.
     * @return A promise that tells if a track succeeded or failed to load.
     */
    private load(index: number): Promise<any> {

        return new Promise((resolve, reject) => {

            if (!this.currentPlayer) {

                reject();

            } else {

                // Try set the new index, if that succeeds, that means
                // that track is in the queue,so load the track that's at that index.
                if (this.setCurrentIndex(index)) {
                    let currentTrack = this.getCurrentTrack();

                    // Try and load the track.
                    this.currentPlayer.load(currentTrack).then(() => {

                        // The track loaded successfully, so resolve the promise.
                        resolve();
                    }).catch(() => {

                        // The track failed to load, reject the promise.
                        reject();
                    });

                } else {

                    // Reject because there that wasn't a valid index.
                    reject();
                }

            }

        });

    }

    /**
     * Marks the current music service as tried and gets the next untried music service.
     * 
     * @return The next untried music service, and undefined if all of them have been tried.
     */
    private getNextUntriedMusicService(): IMusicService {

        let currentMusicServiceIndex = this.getCurrentMusicServiceIndex();

        // Check if the currentMusicServiceIndex is out of bounds.
        if (currentMusicServiceIndex < 0) {
            throw new Error(`this.currentMusicServiceIndex is out of bounds.`);
        }

        // Mark the current music service as tried (i.e. true).
        let currentMusicServiceName = this.musicServices[currentMusicServiceIndex].name;
        this.musicServicesTried[currentMusicServiceName] = true;

        // Get the next music service in this.musicServices.
        let nextMusicServicesIndex = this.incrementIndex(this.currentMusicServiceIndex, 1, this.musicServices.length);
        let nextMusicService = this.musicServices[nextMusicServicesIndex];

        // If this music service hasn't been tried, return it.
        if (!this.musicServicesTried[nextMusicService.name]) {

            return nextMusicService;

        } else {

            // Else, all of them have been tried, so return undefined.
            return undefined;

        }

    }

    /**
     * Loads and plays the specified track from the queue, if the track fails to load,
     * it tries to load the the same track on the next music service,
     * trying all the music services in order.
     * 
     * @param index The index of track to be played in the queue.
     * @param tryDefaultFirst True specifies that it should try load the default player first.
     * @return Promise that tells when a track has finished loading and started playing,
     * or when it failed to load on all the different services.
     */
    public playTrack(index: number, tryDefaultFirst: boolean): Promise<any> {

        return new Promise((resolve, reject) => {

            // First just set the 
            if (!this.setCurrentIndex(index)) {
                throw new Error(`The given index isn't in the queue.`);
            }

            // If it is set to try default first and it's not on the default music service, 
            // change to the default music service.
            if (tryDefaultFirst && (this.currentMusicServiceIndex !== 0)) {

                console.log(`SWITCHED TO DEFAULT`);

                let defaultMusicServiceName = this.musicServices[0].name;
                console.log(`defaultMusicServiceName: ${defaultMusicServiceName}`);

                // Change to the default music service, but we don't want to reload
                // the current track, because we're about to load a new track.
                this.changeMusicService(defaultMusicServiceName).then(() => {

                    // Successfully changed to the default music service,
                    // so try again to play the track from the queue.
                    this.playTrack(index, tryDefaultFirst).then(() => {

                        // The track finally started playing using the default player,
                        // so resolve the original promise.
                        resolve();

                    }).catch(() => {

                        console.log(`REJECTED changeMusicService(defaultMusicServiceName);`);

                        // The track failed to load on all the different music services.
                        // Reject the original promise.
                        reject();

                    });

                }).catch(() => {

                    // Failed to load the default music service,
                    // just reject the promise.
                    reject();

                });

            } else {

                // Now we can start loading the new track.

                // Check if there is a current player
                if (!this.currentPlayer) {
                    throw new Error(`No music service specified to play the track with.`);
                }

                // Try loading the new track.
                this.load(index).then(() => {

                    // Track successfully loaded using the current player,
                    // so start playing the track, reset the music services tried
                    // and resolve the promise.
                    this.play();
                    this.musicServicesTried = {};
                    resolve();

                }).catch(() => {

                    // Failed to load the track using the current player,
                    // try the next player.

                    // Get the next music service to try.
                    let nextMusicServiceToTry = this.getNextUntriedMusicService();

                    // If the next music service to try is available, try it.
                    if (nextMusicServiceToTry) {

                        this.changeMusicService(nextMusicServiceToTry.name).then(() => {

                            // Successfully changed to the next music service,
                            // try play the track using this service.
                            // Remember, the default player would've already been tried, so
                            // don't set the second parameter to true or it will cause an infinite loop.
                            this.playTrack(index, false).then(() => {

                                // The track is successfully playing, so resolve the promise.
                                resolve();

                            }).catch(() => {

                                // The track failed to load, reject the promise.
                                reject();

                            });

                        }).catch(() => {

                            // Failed to change the music service,
                            // reject the promise.
                            reject();

                        });

                    } else {

                        // Else nextMusicServiceToTry was undefined,
                        // that means all the music services have been tried, so reject the promise.
                        reject();

                    }

                });

            }

        });

    }

    /**
     * Loads a specified track from the queue respecting the current paused state,
     * if the track fails to load, it tries to load the the same track on the next music service,
     * trying all the music services in order.
     * If all the music services have been tried and none could play the track,
     * move on to the next track.
     * 
     * @param index The index of track to be played in the queue.
     * @return Promise that tells when some track (might not be the one initially specified) has finished loading.
     */
    public loadTrack(index: number) {

        return new Promise((resolve, reject) => {

            // Save the paused state.
            let paused = this.getPaused();

            this.playTrack(index, true).then(() => {

                if (paused) {
                    this.pause();
                }
                resolve();

            }).catch(() => {

                // This means the track failed to play on all the different
                // music services, so move onto the next track.
                this.next();

            });

        });

    }

    /**
     * Gets pause state of the player.
     * 
     * @return True if the player is paused, else false.
     */
    public getPaused(): boolean {
        return this.paused;
    }

    /**
     * Plays the current track.
     */
    public play(): void {
        this.paused = false;
        if (this.currentPlayer) {
            this.currentPlayer.play();
        }
    }

    /**
     * Pauses the current track.
     */
    public pause(): void {
        this.paused = true;
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }
    }

    /**
     * Plays or pauses the current track depending on its paused state.
     */
    public playPause(): void {
        this.getPaused() ? this.play() : this.pause();
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
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(volume);
            }
        } else
            // If currently muted and unmute === true, unmute and set the volume.
            if (muted && unmute) {
                this.setMuted(false);
                // if (this.currentPlayer) {
                //     this.currentPlayer.setVolume(volume); // - don't need to call this as it is called in setMuted();
                // }
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
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(0);
            }
        } else {
            if (this.currentPlayer) {
                this.currentPlayer.setVolume(this.getVolume());
            }
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
     * @return The duration of the current track in milliseconds, 0 if the currentPlayer isn't available.
     */
    public getDuration(): number {
        if (this.currentPlayer) {
            return this.currentPlayer.getDuration();
        } else {
            return 0;
        }
    }

    /**
     * Seeks to a specified time in the current track.
     * If the player is paused it will remain paused.
     * If the player is in another state it will play the current track.
     * 
     * @param milliseconds The time in milliseconds to which the player should advance.
     */
    public seekTo(milliseconds: number): void {
        this.seekToPercentage((milliseconds / this.getDuration()) || 0);
    }

    /**
     * Seeks to a specified percentage in the current track.
     * If the player is paused it will remain paused.
     * If the player is in another state it will play the current track.
     * 
     * @param percentage The percentage (0 to 1) to which the player should advance.
     */
    public seekToPercentage(percentage: number): void {
        if (this.currentPlayer) {

            this.currentPlayer.seekToPercentage(percentage);

            if (this.getPaused()) {
                this.pause();
            } else {
                this.play();
            }
        }
    }

    /**
     * Gets the current time of the track.
     * 
     * @return The current time of the track in milliseconds, 0 if the currentPlayer isn't available.
     */
    public getCurrentTime(): number {
        if (this.currentPlayer) {
            return this.currentPlayer.getCurrentTime();
        } else {
            return 0;
        }
    }

    /**
     * Gets the current percentage played of the track.
     * 
     * @return The current percentage (0 to 1) played of the track, 0 if the currentPlayer isn't available.
     */
    public getCurrentPercentage(): number {
        if (this.currentPlayer) {
            return this.getCurrentTime() / this.getDuration();
        } else {
            return 0;
        }
    }

    /**
     * Gets the percentage that the track has loaded.
     * 
     * @return The percentage (0 to 1) that the track has loaded, 0 if the currentPlayer isn't available.
     */
    public getPercentageLoaded(): number {
        if (this.currentPlayer) {
            return this.currentPlayer.getPercentageLoaded();
        } else {
            return 0;
        }
    }

    // -------------------------------------------------------


    // =======================================================
    // Subscribing to events published by
    // music service adapters.
    // =======================================================

    private subscribeToEvents(): void {

        let playerContext = this;

        // Automatically go to the next track.
        publisher.subscribe(this.EVENTS.ON_TIME_UPDATE, function (time: number, duration: number, percentage: number) {

            // If percentage >= 1, go to this.next().
            if (percentage >= 1) {
                playerContext.next();
            }

        });

    }

    // -------------------------------------------------------


}
