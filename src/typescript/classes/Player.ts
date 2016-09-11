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
    public REPEAT_STATES = {
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
    /**
     * Legal values for paused state.
     */
    public PAUSED_STATES = {
        /**
         * Maintain the current play/paused state.
         */
        MAINTAIN_CURRENT: `maintain-current`,
        /**
         * Paused.
         */
        PAUSED: `paused`,
        /**
         * Play.
         */
        PLAY: `play`,
    };
    private DEFAULTS = {
        MUTED: CONSTANTS.PLAYER.DEFAULTS.MUTED,
        PAUSED: CONSTANTS.PLAYER.DEFAULTS.PAUSED,
        PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT: CONSTANTS.PLAYER.DEFAULTS.PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT,
        REPEAT: CONSTANTS.PLAYER.DEFAULTS.REPEAT,
        SHUFFLE: CONSTANTS.PLAYER.DEFAULTS.SHUFFLE,
        TIME_AFTER_WHICH_TO_RESTART_TRACK: CONSTANTS.PLAYER.DEFAULTS.TIME_AFTER_WHICH_TO_RESTART_TRACK,
        VOLUME: CONSTANTS.PLAYER.DEFAULTS.VOLUME,
    };
    public EVENTS = {
        ON_ALL_TRACKS_DEQUEUED: `onAllTracksDequeued`,
        ON_MUSIC_SERVICE_CHANGE: `onMusicServiceChange`, // music service successfully changed
        ON_MUSIC_SERVICE_INITIALIZED: `onMusicServiceInitialized`, // music service successfully initialized
        ON_MUSIC_SERVICE_LOADING: `onMusicServiceLoading`, // music service is being loaded
        ON_MUSIC_SERVICE_LOAD_FAILED: `onMusicServiceLoadFailed`, // music service failed to load
        ON_MUTED_CHANGE: `onMutedChange`,
        ON_NEXT: `onNext`,
        ON_PLAY_PAUSE: `onPlayPause`,
        ON_PREVIOUS: `onPrevious`,
        ON_REORDER_QUEUE: `onReorderQueue`,
        ON_REPEAT_CHANGE: `onRepeatChange`,
        ON_RESTART: `onRestart`,
        ON_SHUFFLE_CHANGE: `onShuffleChange`,
        ON_TIME_UPDATE: `onTimeUpdate`, // Published when the current playback position has changed.
        ON_TRACKS_QUEUED: `onTracksQueued`,
        ON_TRACK_BUFFERING: `onTrackBuffering`,
        ON_TRACK_DEQUEUED: `onTrackDequeued`,
        ON_TRACK_FINISHED_BUFFERING: `onTrackFinishedBuffering`,
        ON_TRACK_INDEX_UPDATED: `onTrackIndexUpdated`,
        ON_TRACK_LOADED: `onTrackLoaded`, // track successfully loaded
        ON_TRACK_LOADING: `onTrackLoading`, // track is being loaded
        ON_TRACK_LOAD_FAILED: `onTrackLoadFailed`, // track failed to load
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
     * Specifies if the player is currently dynamically changing music services.
     */
    private currentlyDynamicallyChangingMusicServices: boolean = false;
    /**
     * The index of the current musicService in the musicServices.
     */
    private currentMusicServiceIndex: number = -1;
    /**
     * Specifies if the player is currently loading a track.
     */
    private currentlyLoadingMusicService: boolean = false;
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
     * The index of the track waiting to be loaded.
     * Set to undefined if there is no track waiting to be loaded.
     */
    private waitingToLoadIndex: number = undefined;
    /**
     * Specifies if the player is currently loading a track.
     */
    private currentlyLoadingTrack: boolean = false;
    /**
     * The amount of time after which this.previous()
     * won't go to the previous track, but rather restart the current track.
     */
    private timeAfterWhichToRestartTrack: number;
    /**
     * The current pause state of the player.
     */
    private isPaused = this.DEFAULTS.PAUSED;
    /**
     * The number of milliseconds since we last tried to correct
     * the state to be playing when it was supposed to be playing.
     * Set to 0 because we haven't tried to corrent the state.
     */
    private millisecondsSinceCorrectingToPlaying = 0;
    /**
     * The number of milliseconds since we last tried to correct
     * the state to be paused when it was supposed to be paused.
     * Set to 0 because we haven't tried to corrent the state.
     */
    private millisecondsSinceCorrectingToPaused = 0;
    /**
     * The players paused state after clicking previous or next.
     */
    private pausedStateAfterPreviousOrNext = this.DEFAULTS.PAUSED_STATE_AFTER_PREVIOUS_OR_NEXT;
    /**
     * Specifies the percentage the player is currently trying to seek to.
     * Set to -1 when it's done seeking.
     */
    private currentlySeekingToPercentage = -1;
    /**
     * The number of milliseconds allowed to try seek to the correct position.
     */
    private millisecondsToTrySeekFor = 5000;
    /**
     * The frequency with which to check if the seek is at the correct position.
     * This should not be done too quickley else the
     * adapter players can get confused.
     */
    private seekUpdateTimeoutFrequency = 1000;
    /**
     * The number of milliseconds allowed to resolve a promise.
     * For example, the maximum time allowed for to load a track. 
     */
    private millisecondsToTryFor = 8000;
    /**
     * The frequency with which to check a setTimeout event.
     */
    private updateTimeoutFrequency = 300;
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

        // Register the player events.
        this.registerPlayerEvents();

        // Setup the general events to be published by the player.
        this.setupPublishingEvents();

        // Subscribe to events.
        this.subscribeToEvents();

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

        // Make sure the current state is correct,
        // e.g. if the track is supposed to be playing, make sure it's playing.
        this.verifyStates();

    }


    // =======================================================
    // Registering events to be published by the player
    // (i.e. an instance of this class).
    // =======================================================

    private registerPlayerEvents(): void {

        // Implemented
        publisher.register(this.EVENTS.ON_ALL_TRACKS_DEQUEUED);

        // Implemented
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

        // Implemented
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_INITIALIZED, [
            {
                description: `The name of the music service that was initialized used.`,
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_LOADING, [
            {
                description: `The name of the music service that is being loaded.`,
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, [
            {
                description: `The name of the music service that failed to load.`,
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_MUTED_CHANGE, [
            {
                name: `muted`,
                type: `boolean`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_NEXT);

        // Implemented
        publisher.register(this.EVENTS.ON_PLAY_PAUSE, [
            {
                name: `paused`,
                type: `boolean`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_PREVIOUS);

        // Implemented
        publisher.register(this.EVENTS.ON_REORDER_QUEUE);

        // Implemented
        publisher.register(this.EVENTS.ON_REPEAT_CHANGE, [
            {
                name: `repeat`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_RESTART);

        // Implemented
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
            {
                name: `percentageLoaded`,
                type: `number`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACKS_QUEUED);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_BUFFERING);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_DEQUEUED, [
            {
                name: `track`,
                type: `object`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_FINISHED_BUFFERING);

        // Implemented
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

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_LOADED, [
            {
                name: `track`,
                type: `object`,
            },
            {
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_LOADING, [
            {
                name: `track`,
                type: `object`,
            },
            {
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_TRACK_LOAD_FAILED, [
            {
                name: `track`,
                type: `object`,
            },
            {
                name: `musicServiceName`,
                type: `string`,
            },
        ]);

        // Implemented
        publisher.register(this.EVENTS.ON_VOLUME_CHANGE, [
            {
                name: `volume`,
                type: `number`,
            },
        ]);

    }

    // -------------------------------------------------------


    // =======================================================
    // Sets up the publishing of general events.
    // =======================================================

    /**
     * Sets up the general events to be published by the player.
     */
    private setupPublishingEvents(): void {

        // Setup the track progress event.
        let currentTime: number;
        let currentDuration: number;
        let currentPercentage: number;
        let currentPercentageLoaded: number;
        let publishedBufferingEvent = false;
        let publishedFinishedBufferingEvent = false;
        let lastTime: number = 0;
        let playerContext = this;
        function timeUpdated() {

            currentTime = playerContext.getCurrentTime();
            currentDuration = playerContext.getDuration();
            currentPercentage = (currentTime / currentDuration) || 0;
            currentPercentageLoaded = playerContext.getPercentageLoaded();

            // Check if the player is still loading.
            if (currentPercentageLoaded < currentPercentage) {

                // It might finish buffering again in which case we haven't published an event.
                publishedFinishedBufferingEvent = false;

                // If it has, check that we've published a buffering event.
                if (!publishedBufferingEvent) {
                    publisher.publish(playerContext.EVENTS.ON_TRACK_BUFFERING);
                    publishedBufferingEvent = true;
                }

            } else {

                // It might start buffering again in which case we haven't published an event.
                publishedBufferingEvent = false;

                // Else check that we've published a finished buffering event.
                if (!publishedFinishedBufferingEvent) {
                    publisher.publish(playerContext.EVENTS.ON_TRACK_FINISHED_BUFFERING);
                    publishedFinishedBufferingEvent = true;
                }

            }

            // Only if the current time has actually changed should the onTimeUpdate event be published.
            if (currentTime !== lastTime) {
                lastTime = currentPercentage;

                // If the player is currently trying to seek to a percentage, publish that.
                if (playerContext.currentlySeekingToPercentage !== -1) {
                    publisher.publish(playerContext.EVENTS.ON_TIME_UPDATE, currentTime, currentDuration, playerContext.currentlySeekingToPercentage, currentPercentageLoaded);
                } else {
                    // Else publish the actual percentage.
                    publisher.publish(playerContext.EVENTS.ON_TIME_UPDATE, currentTime, currentDuration, currentPercentage, currentPercentageLoaded);
                }

            }

            // Check if the time has changed every couple milliseconds.
            setTimeout(timeUpdated, playerContext.updateTimeoutFrequency);
        }
        // Start the timeUpdated recursive loop.
        timeUpdated();

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
     * @param previousMusicService              DON'T USE (used for recursive internal call).
     * @param recursiveCallAfterInitialization  DON'T USE (used for recursive internal call).
     * @return A promise the tells when it's done switching services.
     */
    private changeMusicService(musicServiceName: string, recursiveCallAfterInitialization?: boolean, previousMusicServiceName?: string): Promise<any> {

        return new Promise((resolve, reject) => {

            this.currentlyLoadingMusicService = true;

            // Parameters for timer.
            let millisecondsTried = 0;
            let previousTime = Date.now();
            let currentTime: number;
            let promiseResolvedOrRejected = false;

            // Create a timer for the track.
            let playerContext = this;
            function isTimeOver() {

                currentTime = Date.now();
                millisecondsTried = millisecondsTried + (currentTime - previousTime);
                previousTime = currentTime;

                if (millisecondsTried > playerContext.millisecondsToTryFor) {
                    console.log(`The changing music service timed out.`);
                    playerContext.currentlyLoadingMusicService = false;
                    reject(`The changing music service timed out.`);
                } else if (!promiseResolvedOrRejected) {
                    setTimeout(isTimeOver, playerContext.updateTimeoutFrequency);
                }

            }
            // Start timer.
            isTimeOver();

            let musicService: IMusicService;
            let musicServiceIndex: number;

            // If this wasn't a recursive call after initializing the player,
            // find the previous player,
            // else the previous player has already been found and
            // recursively passed in as a parameter after initializing the new player.
            if (!recursiveCallAfterInitialization) {

                // Save the previous music service name.
                let previousMusicService = this.musicServices[this.getCurrentMusicServiceIndex()];
                if (previousMusicService) {
                    previousMusicServiceName = previousMusicService.name;
                }

                // If we aren't trying to load the same music service,
                // publish an event saying a new music service is being loaded.
                if (previousMusicServiceName !== musicServiceName) {
                    publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_LOADING, musicServiceName);
                }

                // Unload any track that was in the previous player.
                // This must be done before the player is switched.
                this.unload(true);
            }

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

            // Check if the music service was found in the list of registered music services.
            if (!musicService) {

                // If not, publish a failed to load event and reject the promise.
                publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, musicServiceName);
                promiseResolvedOrRejected = true;
                this.currentlyLoadingMusicService = false;
                reject(`Music service ${musicServiceName} not found in the list of registered music services (names are case-sensitive).`);

            } else {

                // Else the music service was found in the list of registered music services.

                // As soon as we know the new music service is valid, set it.
                // Set the new music service index.
                this.setCurrentMusicServiceIndex(musicServiceIndex);
                // Set the currentPlayer to undefined just while were loading the new player,
                // this is so that if anything else calls this.currentPlayer,
                // it doesn't do something with the previous player.
                this.currentPlayer = undefined;

                // If the new musicService isn't initialized,
                // initialize it, then try switch music services again.
                if (!musicService.initialized) {

                    (<IPlayerAdapter>musicService.adapter).initialize().then(() => {

                        // Publish an event saying the music service was successfully initialized.
                        publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_INITIALIZED, musicService.name);

                        // The music service has been successfully Initialized.
                        musicService.initialized = true;
                        this.changeMusicService(musicService.name, true, previousMusicServiceName).then(() => {

                            // Don't publish a successfully loaded event here because
                            // one was already published from the original call.

                            // If we get here, the musicService has been initialized,
                            // and the it has been successfully changed to the new music service,
                            // so finally we can resolve the original promise.
                            promiseResolvedOrRejected = true;
                            this.currentlyLoadingMusicService = false;
                            resolve();

                        }).catch((error) => {

                            // Don't publish a failed to load event here because
                            // one was already published from the original call.

                            // Failed to switch music services.
                            // reject the original promise.
                            promiseResolvedOrRejected = true;
                            this.currentlyLoadingMusicService = false;
                            reject(error);

                        });

                    }).catch(() => {

                        // Failed to initialize the player.
                        // So publish an event saying we've failed to change to the new music service player adapter,
                        // then reject the original promise.
                        publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_LOAD_FAILED, musicService.name);
                        promiseResolvedOrRejected = true;
                        this.currentlyLoadingMusicService = false;
                        reject(`Failed to initialize the new music service.`);

                    });

                } else {

                    // Change to using the new music service player adapter.
                    this.currentPlayer = musicService.adapter;

                    // Reset the current player volume and muted state because
                    // the new music service player adapter might not have the latest values.
                    this.setVolume(this.getVolume());
                    this.setMuted(this.getMuted());

                    // If the music service was actually changed,
                    // publish the music service changed event.
                    if (previousMusicServiceName !== musicServiceName) {

                        let currentMusicServiceName = this.musicServices[musicServiceIndex].name;
                        publisher.publish(this.EVENTS.ON_MUSIC_SERVICE_CHANGE, previousMusicServiceName || `None`, currentMusicServiceName);

                    }

                    // Resolve promise for when the musicService
                    // was already initialized.
                    promiseResolvedOrRejected = true;
                    this.currentlyLoadingMusicService = false;
                    resolve();

                }

            }

        });

    }

    /**
     * Seek after dynamically changing music services.
     * 
     * @return A promise that tells us if it has changed or not.
     */
    private seekToPercentageAfterDynamicChange(percentage: number): Promise<any> {

        return new Promise((resolve, reject) => {

            if (!this.currentPlayer) {

                reject(`Current player not set.`);

            } else if ((percentage < 0) || (percentage > 1)) {

                reject(`The percentage given is not between 0 and 1.`);

            } else {

                // Set the percentage to seek to.
                this.currentlySeekingToPercentage = percentage;

                let timeToSeekTo = this.getDuration() * percentage;
                let acceptableSeekErrorInMilliseconds = 2000;

                // Parameters for timer.
                let millisecondsTried = 0;
                let previousTime = Date.now();
                let currentTime: number;

                // Create a timer for the track.
                let playerContext = this;
                function isTimeOver() {

                    currentTime = Date.now();
                    millisecondsTried = millisecondsTried + (currentTime - previousTime);
                    previousTime = currentTime;

                    // If the time isn't over, and this.currentlySeekingToPercentage hasn't changed,
                    // keep trying to set the seek position.
                    if (millisecondsTried <= playerContext.millisecondsToTrySeekFor && playerContext.currentlySeekingToPercentage === percentage) {

                        // If it still isn't in the correct seek position, try set the seek position.
                        if (Math.abs(timeToSeekTo - playerContext.getCurrentTime()) > acceptableSeekErrorInMilliseconds) {

                            playerContext.currentPlayer.seekToPercentage(playerContext.currentlySeekingToPercentage);
                            setTimeout(isTimeOver, playerContext.seekUpdateTimeoutFrequency);

                        } else {

                            console.log(`Has seeked to the correct position, now resuming play/pause state!!!!.`);
                            playerContext.currentlySeekingToPercentage = -1;

                            // Else the player is at the correct seek position so
                            // resolve the promise.
                            resolve();

                        }

                    } else {

                        // Else the time is up or this.currentlySeekingToPercentage has changed,
                        // so just resolve the promise.
                        playerContext.currentlySeekingToPercentage = -1;
                        reject(`Failed to seek to the correct position.`);

                    }

                }
                // Start timer.
                isTimeOver();

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
    public dynamicallyChangeMusicService(musicServiceName: string, recursiveCall?: boolean, progress?: number, trackIndex?: number, previousMusicServiceName?: string): Promise<any> {

        return new Promise((resolve, reject) => {

            if ((this.currentlyDynamicallyChangingMusicServices && (recursiveCall !== undefined)) || this.currentlyLoadingTrack || this.currentlyLoadingMusicService) {

                console.log(`Already busy dynamically changing music services or loading a track.`);
                reject(`Already busy dynamically changing music services or busy loading a track into a music service.`);

            } else {

                this.currentlyDynamicallyChangingMusicServices = true;

                // If it's not the recursive call, we won't have the previous state information.
                // Hence, save the current time, track index, paused state and previous music service name.
                if (!recursiveCall) {

                    progress = this.getCurrentPercentage();
                    trackIndex = this.getCurrentIndex();
                    let previousMusicService = this.musicServices[this.getCurrentMusicServiceIndex()];
                    if (previousMusicService) {
                        previousMusicServiceName = previousMusicService.name;
                    }

                }

                if (musicServiceName === previousMusicServiceName && !recursiveCall) {

                    // The music player stayed the same so just resolve it.
                    this.currentlyDynamicallyChangingMusicServices = false;
                    resolve();

                } else {

                    // Change music services.
                    this.changeMusicService(musicServiceName).then(() => {

                        this.currentlyDynamicallyChangingMusicServices = false;

                        // The music service has successfully been changed,
                        // so play the current track on the new service.
                        this.loadTrack(trackIndex, false).then(() => {

                            // The current track loaded successfully in the new music service.
                            // Now reload the current tracks previous state.
                            this.seekToPercentageAfterDynamicChange(progress).then(() => {
                                resolve();
                            }).catch(() => {
                                resolve();
                            });


                        }).catch((error) => {

                            // If the track couldn't be played on the set music service or any other music service,
                            // just reject the promise.
                            reject(error);

                        });

                    }).catch((error) => {

                        // Failed to change music services.

                        // Fall back to the previous music service.
                        if (previousMusicServiceName) {

                            // Failed to change music services. Fall back to the previous music service.

                            this.dynamicallyChangeMusicService(previousMusicServiceName, true, progress, trackIndex, previousMusicServiceName).then(() => {
                                // Resolve original promise.
                                this.currentlyDynamicallyChangingMusicServices = false;
                                resolve();
                            }).catch((e) => {
                                // Reject original promise.
                                this.currentlyDynamicallyChangingMusicServices = false;
                                reject(e);
                            });

                        } else {

                            // If there isn't a previous music service to fall back on, just reject the promise.
                            this.currentlyDynamicallyChangingMusicServices = false;
                            reject(error);
                        }

                    });

                }

            }

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

        publisher.publish(this.EVENTS.ON_SHUFFLE_CHANGE, this.shuffle);

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
     * Sets the repeat state.
     * If the state given is not a valid repeat state, it sets it to all by default.
     * - repeat off, don't cycle through queue.
     * - repeat one, restart current track.
     * - repeat all, cycle through queue.
     * 
     * @param state The state to set repeat to.
     */
    public setRepeat(state: string): void {

        if (state === this.REPEAT_STATES.OFF ||
            state === this.REPEAT_STATES.ONE ||
            state === this.REPEAT_STATES.ALL) {
            this.repeat = state;
        } else {
            this.repeat = this.REPEAT_STATES.ALL;
        }

        publisher.publish(this.EVENTS.ON_REPEAT_CHANGE, this.repeat);

    }

    /**
     * Cycles through the repeat values.
     * 
     * @return The current repeat value.
     */
    public cycleRepeat(): string {
        // Cycle order
        let cycleOrder = [
            this.REPEAT_STATES.OFF,
            this.REPEAT_STATES.ALL,
            this.REPEAT_STATES.ONE,
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

        publisher.publish(this.EVENTS.ON_TRACKS_QUEUED);

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
            throw new Error(`The dequeue index provided is not a valid index (i.e. isn't in the queue).`);
        }

        // If the index is that of the waitingToLoadIndex, just clear the waiting to load index.
        if (this.waitingToLoadIndex === index) {
            this.waitingToLoadIndex = undefined;
        }

        // We know it's a valid index, so set it as the index of the track to dequeue.
        let indexOfTrackToDequeue = index;
        let trackToBeDequeued: ITrack;

        let shuffled = this.getShuffle();
        let repeat = this.getRepeat();
        let currentTrackIndex = this.currentTrackIndex; // Don't use this.getCurrentIndex because you don't want the waitingToLoadIndex if there is one.

        // If the queue isn't shuffled, just remove the track at the specified index,
        // from the ordered queue.
        if (!shuffled) {
            trackToBeDequeued = this.orderedQueue[indexOfTrackToDequeue];
            this.orderedQueue.splice(indexOfTrackToDequeue, 1);
        } else {
            // If the queue is shuffled, dequeue the first track of that type from the orderedQueue.
            trackToBeDequeued = this.shuffledQueue[indexOfTrackToDequeue];
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

            publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
            return;
        }

        // If the track dequeued was the one currently playing.
        if (currentTrackIndex === indexOfTrackToDequeue) {

            // And repeat is one, clear the player.
            if (repeat === this.REPEAT_STATES.ONE) {

                // Clear the current track and set the currentTrackIndex to -1;
                this.unload();

                publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
                return;
            }

            // Else, if the track dequeued was the one currently playing,
            // and the track dequeued wasn't the last track,
            // load the track that took its place.
            if (currentTrackIndex < currentQueue.length) {

                // If there is a track waiting to be loaded, rather load that one.
                if (this.waitingToLoadIndex !== undefined) {
                    currentTrackIndex = this.waitingToLoadIndex;
                }

                this.loadTrack(currentTrackIndex, true);

            } else {

                // Else the track dequeued was the last in the current queue,
                // so no track took its place.
                // Check the repeat state to determine what to do.
                if (repeat === this.REPEAT_STATES.ALL) {

                    // If there is a track waiting to be loaded, rather load that one.
                    if (this.waitingToLoadIndex !== undefined) {
                        currentTrackIndex = this.waitingToLoadIndex;
                    } else {
                        // Else we want to just load the first track in the queue.
                        currentTrackIndex = 0;
                    }

                    // Load the first track in the current queue.
                    this.loadTrack(currentTrackIndex, true);

                } else {

                    // Else it's repeat off,
                    // so set the currentTrackIndex to the last track in the queue 
                    // and unload the player.
                    this.setCurrentIndex(currentQueue.length - 1);
                    this.unload(true);

                }

            }

            publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);
            return;
        }

        // If the track dequeued was before the current track in the queue,
        // then the currentTrackIndex just needs to be shifted up one,
        // in order to be corret (because one track was removed above it).
        if (indexOfTrackToDequeue < currentTrackIndex) {
            this.setCurrentIndex(currentTrackIndex - 1);
        }

        publisher.publish(this.EVENTS.ON_TRACK_DEQUEUED, trackToBeDequeued);

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

        publisher.publish(this.EVENTS.ON_ALL_TRACKS_DEQUEUED);

    }

    /**
     * Gets the queue.
     * 
     * @return The queue of tracks.
     */
    public getQueue(): ITrack[] {
        if (this.getShuffle()) {
            return this.shuffledQueue || [];
        } else {
            return this.orderedQueue || [];
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

        if (this.waitingToLoadIndex !== undefined) {
            return this.waitingToLoadIndex;
        } else {
            return this.currentTrackIndex;
        }

    }

    /**
     * Sets the index of the current track in the queue.
     * 
     * @param index The index of the current track in the queue.
     * @return True if the index was in the queue hence it set the index,
     * false if the index wasn't in the queue, hence didn't set the index.
     */
    private setCurrentIndex(index: number): boolean {

        let currentQueue = this.getQueue();
        let previousIndex = this.currentTrackIndex;

        if (this.isIndexInQueue(index, currentQueue)) {
            this.currentTrackIndex = index;

            publisher.publish(this.EVENTS.ON_TRACK_INDEX_UPDATED, previousIndex, index);

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
        if (index === undefined) {
            return false;
        } else {
            return (index >= 0) && (index <= (queue.length - 1));
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

                // Update the current index if need be.
                if (move.oldIndex === this.getCurrentIndex()) {
                    this.currentTrackIndex = move.newIndex;
                }

                // Remove the element from the array.
                track = currentQueue.splice(move.oldIndex, 1)[0];
                // Place it at the new index.
                currentQueue.splice(move.newIndex, 0, track);
            }
        }

        publisher.publish(this.EVENTS.ON_REORDER_QUEUE);
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
     * Sets the state the state the player should be in after
     * clicking the previous or next buttons.
     * 
     * @param state The state to be set.
     */
    public setPausedStateAfterPreviousOrNext(state: string): void {

        if (state === this.PAUSED_STATES.PAUSED ||
            state === this.PAUSED_STATES.PLAY ||
            state === this.PAUSED_STATES.MAINTAIN_CURRENT) {
            this.repeat = state;
        } else {
            this.repeat = this.PAUSED_STATES.MAINTAIN_CURRENT;
        }

    }

    /**
     * Used to set the correct state after previous or next.
     */
    private maintainPlayOrPause(): void {
        if (this.pausedStateAfterPreviousOrNext === this.PAUSED_STATES.PAUSED) {
            this.pause();
        } else if (this.pausedStateAfterPreviousOrNext === this.PAUSED_STATES.PLAY) {
            this.play();
        }
        // Don't need to do the maintain state because that'll be done by default.
    }

    /**
     * Go to the next track and start playing it.
     * If repeat === repeat off, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     * 
     * @param tracksTried                       DON'T USE (used for recursive internal call).
     * tracksTried is used to make sure we don't have an infinite loop when all the tracks in the
     * queue aren't available on any music service. Only loadTrack and next should use this internally.
     */
    public next(tracksTried?: any): void {

        // Pause the song immediately, just on the internal player,
        // this is not setting the abstract players paused state to true.
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }

        publisher.publish(this.EVENTS.ON_NEXT);

        let currentQueue = this.getQueue();
        // If there's an index waiting to be loaded, use that.
        let currentIndex: number;
        if (this.waitingToLoadIndex !== undefined) {
            currentIndex = this.waitingToLoadIndex;
        } else {
            currentIndex = this.getCurrentIndex();
        }
        let repeat = this.getRepeat();

        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error(`Cannot get the next track in the queue if the current track isn't in the queue.`);
        }

        if (repeat === this.REPEAT_STATES.ONE) {
            // Restart track.
            this.restart();
            this.maintainPlayOrPause();
            return;
        } else if (repeat === this.REPEAT_STATES.OFF) {
            // If it was on the last track, just unload it.
            // Else load the next track.
            if (currentIndex >= (currentQueue.length - 1)) {

                // We aren't waiting to load any more tracks.
                this.waitingToLoadIndex = undefined;

                // If we've gotten to the last index but never loaded the last track,
                // we need to load it, then we can pause it.
                if (this.getCurrentIndex() !== (currentQueue.length - 1)) {
                    this.loadTrack((currentQueue.length - 1), true, tracksTried).then(() => {
                        this.restart();
                        this.pause();
                    });
                } else {
                    this.restart();
                    this.pause();
                }
            } else {
                this.loadTrack(currentIndex + 1, true, tracksTried);
                this.maintainPlayOrPause();
            }
        } else {
            this.loadTrack(this.incrementIndex(currentIndex, 1, currentQueue.length), true, tracksTried);
            this.maintainPlayOrPause();
        }
    }

    /**
     * Go to the previous track and start playing it.
     * If repeat === repeat off, don't cycle through queue.
     * If repeat === repeat one, restart current track.
     * If repeat === repeat all, cycle through queue.
     */
    public previous(): void {

        // Pause the song immediately, just on the internal player,
        // this is not setting the abstract players paused state to true.
        if (this.currentPlayer) {
            this.currentPlayer.pause();
        }

        publisher.publish(this.EVENTS.ON_PREVIOUS);

        let currentQueue = this.getQueue();
        // If there's an index waiting to be loaded, use that.
        let currentIndex: number;
        if (this.waitingToLoadIndex !== undefined) {
            currentIndex = this.waitingToLoadIndex;
        } else {
            currentIndex = this.getCurrentIndex();
        }
        let repeat = this.getRepeat();

        if (!this.isIndexInQueue(currentIndex, currentQueue)) {
            throw new Error(`Cannot get the previous track in the queue if the current track isn't in the queue.`);
        }

        if ((repeat === this.REPEAT_STATES.ONE) ||
            (this.getCurrentTime() > this.timeAfterWhichToRestartTrack)) {
            // Restart track.
            this.restart();
            this.maintainPlayOrPause();
            return;
        } else if (repeat === this.REPEAT_STATES.OFF) {
            // If it was on the first track, just unload it.
            // Else load the previous track.
            if (currentIndex === 0) {

                // We aren't waiting to load any more tracks.
                this.waitingToLoadIndex = undefined;

                // If we've gotten to the first index but never loaded the last track,
                // we need to load, it then we can unload it.
                if (this.getCurrentIndex() !== 0) {
                    this.loadTrack(0, true).then(() => {
                        this.restart();
                        this.pause();
                    });
                } else {
                    this.restart();
                    this.pause();
                }
            } else {
                this.loadTrack(currentIndex - 1, true);
                this.maintainPlayOrPause();
            }
        } else {
            this.loadTrack(this.incrementIndex(currentIndex, -1, currentQueue.length), true);
            this.maintainPlayOrPause();
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
            }
        }
    }

    /**
     * Loads the specified track from the queue using the currentPlayer.
     * Updating the current track index in the process.
     * 
     * @param index The index of track to be played in the queue.
     * @return A promise that tells if a track succeeded or failed to load.
     */
    private load(index: number): Promise<any> {

        return new Promise((resolve, reject) => {

            // Parameters for timer.
            let millisecondsTried = 0;
            let previousTime = Date.now();
            let currentTime: number;
            let promiseResolvedOrRejected = false;

            // Create a timer for the track.
            let playerContext = this;
            function isTimeOver() {

                currentTime = Date.now();
                millisecondsTried = millisecondsTried + (currentTime - previousTime);
                previousTime = currentTime;

                if (promiseResolvedOrRejected) {
                    console.log(`Delt with the promise already.`);
                }

                if (millisecondsTried > playerContext.millisecondsToTryFor) {

                    console.log(`Loading track timed out.`);
                    publisher.publish(playerContext.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                    playerContext.currentlyLoadingTrack = false;
                    reject(`The loading of ${trackBeingLoaded.title} timed out.`);

                } else if (!promiseResolvedOrRejected) {

                    setTimeout(isTimeOver, playerContext.updateTimeoutFrequency);

                }

            }
            // Start timer.
            isTimeOver();

            let trackBeingLoaded = (this.getQueue())[index];
            let currentMusicService = this.musicServices[this.getCurrentMusicServiceIndex()];
            let currentMusicServiceName: string;
            if (currentMusicService) {
                currentMusicServiceName = currentMusicService.name;
            }

            if (!this.currentPlayer) {

                publisher.publish(this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                this.currentlyLoadingTrack = false;
                promiseResolvedOrRejected = true;
                reject(`No music service specified to play the track with.`);

            } else if (this.currentlyLoadingTrack) {

                publisher.publish(this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, currentMusicServiceName);
                this.currentlyLoadingTrack = false;
                promiseResolvedOrRejected = true;
                reject(`The player hasn't finished loading the previous track.`);

            } else if (this.setCurrentIndex(index)) {

                // If we succeeded in setting the new index
                // that means that at that index there is a track in the queue 
                // now we can load the track that's at that index.

                // Publish the track loading event.
                publisher.publish(this.EVENTS.ON_TRACK_LOADING, trackBeingLoaded, this.currentPlayer.name);
                this.currentlyLoadingTrack = true;

                // Try and load the track.
                this.currentPlayer.load(trackBeingLoaded).then(() => {

                    // Just set it to paused - if it should be playing the state will be correct
                    // by the verifyStates method.
                    // (we would rather have it paused than playing at the start)
                    this.currentPlayer.pause();

                    // The track loaded successfully, publish the track loaded event and
                    // resolve the promise.
                    publisher.publish(this.EVENTS.ON_TRACK_LOADED, trackBeingLoaded, this.currentPlayer.name);
                    this.currentlyLoadingTrack = false;
                    promiseResolvedOrRejected = true;
                    resolve();

                }).catch((error) => {

                    // The track failed to load, publish the track load failed event and
                    // reject the promise.
                    publisher.publish(this.EVENTS.ON_TRACK_LOAD_FAILED, trackBeingLoaded, this.currentPlayer.name);
                    promiseResolvedOrRejected = true;
                    this.currentlyLoadingTrack = false;
                    reject(error);

                });

            } else {

                // Reject because it wasn't a valid index.
                promiseResolvedOrRejected = true;
                reject(`Reject because it wasn't a valid index.`);

            }

        });

    }

    /**
     * Marks the current music service as tried and gets the next untried music service.
     * 
     * @param musicServicesTried
     * A hashmap of the music services tried when loading a track.
     * This is cleared as soon as a track is successfully loaded.
     * 
     * For example if SoundCloud hasn't been tried, it isn't there (i.e. is "false")
     * musicServicesTried = {
     *     "Deezer": true,
     *     "YouTube": true,
     * }
     *
     * @return An object with the musicServicesTried and the nextMusicService to try.
     * If all the music services have been tried, it returns:
     * {
     *     musicServicesTried: `Tried All`,
     *     nextMusicService: undefined,
     * }
     */
    private getNextUntriedMusicService(musicServicesTried: any): { musicServicesTried: any, nextMusicServiceName: string } {

        if (!musicServicesTried) {
            musicServicesTried = {};
        }

        let currentMusicServiceIndex = this.getCurrentMusicServiceIndex();

        // Check if the currentMusicServiceIndex is out of bounds.
        if ((currentMusicServiceIndex > (this.musicServices.length - 1)) || (currentMusicServiceIndex < 0)) {
            throw new Error(`this.currentMusicServiceIndex is out of bounds.`);
        }

        // Mark the current music service as tried (i.e. true).
        let currentMusicServiceName = this.musicServices[currentMusicServiceIndex].name;
        musicServicesTried[currentMusicServiceName] = true;

        // Get the next music service in this.musicServices.
        let nextMusicServicesIndex = this.incrementIndex(this.currentMusicServiceIndex, 1, this.musicServices.length);
        let nextMusicServiceName = this.musicServices[nextMusicServicesIndex].name;

        // If this music service hasn't been tried, return it.
        if (!musicServicesTried[nextMusicServiceName]) {

            return {
                musicServicesTried: musicServicesTried,
                nextMusicServiceName: nextMusicServiceName,
            };

        } else {

            // Else, all of them have been tried,
            // so return false and undefined.
            return {
                musicServicesTried: `Tried All`,
                nextMusicServiceName: undefined,
            };

        }

    }

    /**
     * Loads and pauses the specified track from the queue, if the track fails to load,
     * it tries to load the the same track on the next music service,
     * trying all the music services in order.
     * 
     * It does not go to the next track when all services fail to load the track,
     * use loadTrack for that.
     * 
     * @param index The index of track to be played in the queue.
     * @param tryDefaultFirst True specifies that it should try load the default player first,
     * false (or undefined) specifies it should start with the current player first.
     * @param musicServicesTried                DON'T USE (used for recursive internal call).
     * @return Promise that tells when a track has finished loading and started playing,
     * or when it failed to load on all the different services.
     */
    private loadTrackOnSomeService(index: number, tryDefaultFirst: boolean, musicServicesTried?: any): Promise<any> {

        return new Promise((resolve, reject) => {

            if (this.currentlyLoadingTrack) {

                reject(`The player hasn't finished loading the previous track.`);

            } else if (!this.setCurrentIndex(index)) { // First just set the current index.

                reject(`The given index isn't in the queue.`);

            } else if (musicServicesTried === `Tried All`) {

                // Then all the music services have been tried.
                reject(`All the music services have been tried, and none could load the track.`);

            } else if (tryDefaultFirst && (this.currentMusicServiceIndex !== 0)) {
                // If it is set to try default first and it's not on the default music service, 
                // change to the default music service.

                let defaultMusicServiceName = this.musicServices[0].name;

                // Change to the default music service, but we don't want to reload
                // the current track, because we're about to load a new track.
                this.changeMusicService(defaultMusicServiceName).then(() => {

                    // Successfully changed to the default music service,
                    // so try again to play the track from the queue.
                    this.loadTrackOnSomeService(index, tryDefaultFirst, musicServicesTried).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });

                }).catch(() => {

                    // Failed to load the default music service,
                    // so just try some other service.
                    this.loadTrackOnSomeService(index, false, musicServicesTried).then(() => {
                        resolve();
                    }).catch((error) => {
                        reject(error);
                    });

                });

            } else if (!this.currentPlayer) { // Check if there is a current player.

                // If there isn't a player specified yet, reject the promise.
                reject(`There isn't a player loaded.`);

            } else {

                // Start trying to load the new track.

                // Try loading the new track. Using the current service.
                this.load(index).then(() => {

                    // The track successfully started playing.

                    // If there is a track waiting to be loaded and it's not the current track.
                    if (this.waitingToLoadIndex !== undefined && this.waitingToLoadIndex !== this.getCurrentIndex()) {

                        // We're about to load the index that was waiting
                        // to be loaded, so clear this.waitingToLoadIndex.
                        let waitingToLoadIndex = this.waitingToLoadIndex;
                        this.waitingToLoadIndex = undefined;

                        // If there is a track waiting to be loaded, load it.
                        // Load it using loadTrack because we want to automatically go to the next track
                        // if it's not available on any music service.
                        this.loadTrack(waitingToLoadIndex, true).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                    } else {

                        // Track successfully loaded using the current player,
                        // we don't need to pause the track as this is done
                        // in load(index), so resolve the promise.
                        resolve();

                    }

                }).catch(() => {

                    // The track failed to load on the current service, try another one.

                    // Failed to load the track, but first check if there was a track waiting to be loaded.
                    if (this.waitingToLoadIndex !== undefined && this.waitingToLoadIndex !== this.getCurrentIndex()) {

                        // We're about to load the index that was waiting
                        // to be loaded, so clear this.waitingToLoadIndex.
                        let waitingToLoadIndex = this.waitingToLoadIndex;
                        this.waitingToLoadIndex = undefined;

                        // If there is a track waiting to be loaded, load it.
                        // Load it using loadTrack because we want to automatically go to the next track
                        // if it's not available on any music service.
                        this.loadTrack(waitingToLoadIndex, true).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                    } else {

                        // If there wasn't a track waiting to be loaded,
                        // we need to try load the current track on the next service.
                        // Because the current track failed to load on the current player.

                        // Get the next music service to try.
                        let temp = this.getNextUntriedMusicService(musicServicesTried);
                        let nextMusicServiceNameToTry: string = temp.nextMusicServiceName;
                        // Update the musicServicesTried
                        musicServicesTried = temp.musicServicesTried;

                        // If the next music service to try is available, try it.
                        // Remember, this.getNextUntriedMusicService(musicServicesTried).nextMusicServiceName
                        // will be undefined if it has tried all the available music services.
                        if (nextMusicServiceNameToTry) {

                            this.changeMusicService(nextMusicServiceNameToTry).then(() => {

                                // Successfully changed to the next music service,
                                // try play the track using this service.
                                // Remember, the default player would've already been tried, so
                                // don't set the second parameter to true or it will cause an infinite loop.
                                this.loadTrackOnSomeService(index, false, musicServicesTried).then(() => {

                                    // The track is successfully playing, so resolve the promise.
                                    resolve();

                                }).catch((error) => {

                                    // The track failed to load, reject the promise.
                                    reject(error);

                                });

                            }).catch((error) => {

                                // Failed to change the music service,
                                // reject the promise.
                                reject(error);

                            });

                        } else {

                            // Else nextMusicServiceNameToTry was undefined,
                            // that means all the available music services have been tried,
                            // so reject the promise.
                            reject(`The track failed to load on all the different music services.`);

                        }

                    }

                });

            }

        });

    }

    /**
     * Takes in a hashmap of tracks tried and checks if all the tracks in the queue
     * have been tried.
     * 
     * @param tracksTried A hashmap of tracks tried, key = track.uuid, value = true if tried.
     * e.g.
     * tracksTried = {
     *     "uuid1": true,
     *     "uuid2": true,
     * }
     * @return True if all the tracks have been tried, false if not.
     */
    private checkIfAllTracksHaveBeenTried(tracksTried: any): boolean {

        // If tracksTried isn't defined, assume no tracks have been tried.
        if (!tracksTried) {
            return false;
        }

        let currentQueue = this.getQueue();

        // tslint:disable-next-line
        for (let i = 0, track: ITrack; track = currentQueue[i]; i = i + 1) {

            // If we find a track that hasn't been tried, then return false.
            if (tracksTried[track.uuid] !== true) {
                return false;
            }

        }

        // All the tracks if the queue have been tried.
        return true;

    }

    /**
     * Loads a specified track from the queue,
     * if the track fails to load, it tries to load the the same track on the next music service,
     * trying all the music services in order.
     * If all the music services have been tried and none could load the track,
     * move on to the next track.
     * 
     * @param index The index of track to be played in the queue.
     * @param tryDefaultFirst True specifies that it should try load the default player first,
     * false (or undefined) specifies it should start with the current player first.
     * @param tracksTried                       DON'T USE (used for recursive internal call).
     * tracksTried is used to make sure we don't have an infinite loop when all the tracks in the
     * queue aren't available on any music service. Only loadTrack and next should use this internally.
     * @return Promise that tells when some track (might not be the one initially specified) has finished loading.
     */
    private loadTrack(index: number, tryDefaultFirst: boolean, tracksTried?: any): Promise<any> {

        return new Promise((resolve, reject) => {

            let currentQueue = this.getQueue();

            if (!this.isIndexInQueue(index, currentQueue)) {

                reject(`The track requested isn't in the queue.`);

            } else if (this.currentlyLoadingTrack) {

                // It's busy loading a track, but store the track to be loaded next.
                this.waitingToLoadIndex = index;
                console.log(`WAITING TO LOAD: ${(this.getQueue())[this.waitingToLoadIndex].title}`);

                reject(`The player hasn't finished loading the previous track, the waitingToLoadIndex was updated though.`);

            } else if (this.checkIfAllTracksHaveBeenTried(tracksTried) || (currentQueue.length <= 0)) {

                reject(`None of the tracks in the queue are available on any of the music services.`);

            } else {

                // If tracksTried is undefined, define it and
                if (tracksTried === undefined) {
                    tracksTried = {};
                }

                // Get the uuid of the track to load.
                let trackToLoad = currentQueue[index];
                let trackToLoadUUID: string;
                if (trackToLoad) {
                    trackToLoadUUID = trackToLoad.uuid;
                }

                // loadTrack trys the default player by default.
                if (tryDefaultFirst === undefined) {
                    tryDefaultFirst = true;
                }

                // Play the track using the default player.
                this.loadTrackOnSomeService(index, tryDefaultFirst).then(() => {

                    if (this.waitingToLoadIndex !== undefined) {

                        // We're about to load the index that was waiting
                        // to be loaded, so clear this.waitingToLoadIndex.
                        let waitingToLoadIndex = this.waitingToLoadIndex;
                        this.waitingToLoadIndex = undefined;

                        // If there is a track waiting to be loaded, load it.
                        // But don't pass in tracksTried, hence setting it to undefined,
                        // because this essentially clears the tracksTried automatically.
                        this.loadTrack(waitingToLoadIndex, true).then(() => {
                            resolve();
                        }).catch((error) => {
                            reject(error);
                        });

                    } else {

                        // No track was waiting to be loaded, so resolve the promise.
                        resolve();
                    }

                }).catch((error) => {

                    // The track failed to play on all the available music services.
                    // Set the track being loaded to tried.
                    tracksTried[trackToLoadUUID] = true;

                    // Check if there is a track waiting to
                    // be played, if so play it, else move onto the next track.
                    if (this.waitingToLoadIndex !== undefined) {

                        // We're about to load the index that was waiting
                        // to be loaded, so clear this.waitingToLoadIndex.
                        let waitingToLoadIndex = this.waitingToLoadIndex;
                        this.waitingToLoadIndex = undefined;

                        // If there is a track waiting to be loaded, load it.
                        // Here we must pass in tracks tried because the track that was just tried
                        // failed to play on all the music services, so we need to keep that information.
                        this.loadTrack(waitingToLoadIndex, true, tracksTried).then(() => {
                            resolve();
                        }).catch((e) => {
                            reject(e);
                        });

                    } else {

                        // This means the track failed to play on all the different
                        // music services, so move onto the next track.
                        // Pass in the tracksTried so that when next calls loadTrack,
                        // it knows what tracks have been tried.
                        this.next(tracksTried);

                    }

                });

            }

        });

    }

    /**
     * Plays the specified track from the queue,
     * if the track fails to load, it tries to load the the same track on the next music service,
     * trying all the music services in order (starting with the default player).
     * If all the music services have been tried and none could play the track,
     * move on to the next track.
     * 
     * @param index The index of track to be played in the queue.
     * @return A promise that specifies whether the track successfully played or not.
     */
    public playTrack(index: number): Promise<any> {

        return new Promise((resolve, reject) => {

            this.loadTrack(index, true).then(() => {

                // The track has loaded, play it,
                // and then resolve the promise.
                this.play();
                resolve();

            }).catch((error) => {
                reject(error);
            });

        });

    }

    /**
     * Gets pause state of the player.
     * 
     * @return True if the player is paused, else false.
     */
    public getPaused(): boolean {
        return this.isPaused;
    }

    /**
     * Plays the current track.
     */
    public play(): void {

        if (this.currentPlayer) {

            // Reset time since last tried to pause.
            this.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;

            // Restart time since last tried to play.
            this.millisecondsSinceCorrectingToPlaying = 0;

            this.isPaused = false;
            this.currentPlayer.play();
            publisher.publish(this.EVENTS.ON_PLAY_PAUSE, this.isPaused);

        }

    }

    /**
     * Pauses the current track.
     */
    public pause(): void {

        if (this.currentPlayer) {

            // Reset time since last tried to play.
            this.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;

            // Restart time since last tried to pause.
            this.millisecondsSinceCorrectingToPaused = 0;

            this.isPaused = true;
            this.currentPlayer.pause();
            publisher.publish(this.EVENTS.ON_PLAY_PAUSE, this.isPaused);

        }

    }

    /**
     * Plays or pauses the current track depending on its paused state.
     */
    public playPause(): void {
        this.isPaused ? this.play() : this.pause();
    }

    /**
     * Restart the current track.
     */
    public restart(): Promise<any> {

        return new Promise((resolve, reject) => {

            publisher.publish(this.EVENTS.ON_RESTART);

            this.seekToPercentage(0).then(() => {
                resolve();
            }).catch(() => {
                resolve();
            });

        });

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

        publisher.publish(this.EVENTS.ON_VOLUME_CHANGE, this.volume);

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

        publisher.publish(this.EVENTS.ON_MUTED_CHANGE, this.muted);

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
    public seekToPercentage(percentage: number): Promise<any> {

        return new Promise((resolve, reject) => {

            if ((percentage < 0) || (percentage > 1)) {

                reject(`The percentage given was not between 0 and 1.`);

            } else if (this.currentPlayer) {

                this.currentPlayer.seekToPercentage(percentage);
                this.currentlySeekingToPercentage = -1;

            }

        });

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
            return this.currentPlayer.getPercentageLoaded() || 0;
        } else {
            return 0;
        }
    }

    // -------------------------------------------------------


    // =======================================================
    // Verifying states
    // =======================================================

    private verifyStates(): void {

        /**
         * The frequency with which to check if the paused state is correct.
         * And if not, correct it.
         */
        let frequencyToVerifyPausedState = 150; // in milliseconds
        let frequencyToTryGetIntoTheSameState = 2000; // If the player state was corrected to paused, but still isn't paused, when do we try again.

        // Parameters for timer.
        let previousTime = Date.now();
        let currentTime: number;

        let playerContext = this;
        function verifyPausedState() {

            // Update the current time.
            currentTime = Date.now();

            // If the current player exists, check the paused state.
            if (playerContext.currentPlayer && !playerContext.currentlyLoadingTrack && !playerContext.currentlyDynamicallyChangingMusicServices && !playerContext.currentlyLoadingMusicService) {

                // If the player is supposed to be playing but it's not, play the track.
                if ((!playerContext.isPaused) && playerContext.currentPlayer.getPaused()) {

                    // Reset time since last tried to pause.
                    playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;

                    // Still not playing after the waiting period, try force it again.
                    if (playerContext.millisecondsSinceCorrectingToPlaying >= frequencyToTryGetIntoTheSameState) {
                        console.log(`Trying to correct the current state to playing!`);
                        // Restart time since last tried to play.
                        playerContext.millisecondsSinceCorrectingToPlaying = 0;
                        playerContext.currentPlayer.play();
                    } else {
                        console.log(`Waiting to try play again...`);
                        // Update time since last tried to play.
                        playerContext.millisecondsSinceCorrectingToPlaying = playerContext.millisecondsSinceCorrectingToPlaying + (currentTime - previousTime);
                    }


                } else if (playerContext.isPaused && (!playerContext.currentPlayer.getPaused())) {

                    // Reset time since last tried to play.
                    playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;

                    // Still not paused after the waiting period, try force it again.
                    if (playerContext.millisecondsSinceCorrectingToPaused >= frequencyToTryGetIntoTheSameState) {
                        console.log(`Trying to correct the current state to pause!`);
                        // Restart time since last tried to pause.
                        playerContext.millisecondsSinceCorrectingToPaused = 0;
                        playerContext.currentPlayer.pause();
                    } else {
                        console.log(`Waiting to try pause again...`);
                        // Update time since last tried to pause.
                        playerContext.millisecondsSinceCorrectingToPaused = playerContext.millisecondsSinceCorrectingToPaused + (currentTime - previousTime);
                    }

                } else {

                    // Else we're in the correct state,
                    // so reset time since last tried to pause and play.
                    playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
                    playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;

                }

            } else {

                // Else we've tried to change services or tracks,
                // so reset time since last tried to pause and play.
                playerContext.millisecondsSinceCorrectingToPlaying = Number.MAX_VALUE;
                playerContext.millisecondsSinceCorrectingToPaused = Number.MAX_VALUE;

            }

            // Update the previous time.
            previousTime = currentTime;

            // Set delay before calling the verifyPausedState function again.
            setTimeout(verifyPausedState, frequencyToVerifyPausedState);

        }
        verifyPausedState();

    }

    // -------------------------------------------------------


    // =======================================================
    // Subscribing to events published by
    // music service adapters.
    // =======================================================

    private subscribeToEvents(): void {

        // Automatically go to the next track.
        let playerContext = this;
        publisher.subscribe(this.EVENTS.ON_TIME_UPDATE, function (time: number, duration: number, percentage: number, percentageLoaded: number) {

            // If percentage >= 1, a track isn't being loaded and
            // a music service isn't being loaded.
            // go to this.next().
            if ((percentage >= 1) && !playerContext.currentlyLoadingTrack && !playerContext.currentlyLoadingMusicService && !playerContext.currentlyDynamicallyChangingMusicServices) {
                playerContext.next();
            }

        });

    }

    // -------------------------------------------------------


}
