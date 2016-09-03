/**
 * The interface music service player adapters must implement.
 * @see Player.ts
 */
interface IPlayerAdapter {

    /**
     * This should initialize the player in the relevant way.
     * This function is called immediately after the service adapter is created.
     * 
     * @return A promise which tells when the player is initialized and ready for use.
     */
    initialize(): Promise<any>;

    /**
     * Loads the specified track.
     * The track should be paused at the beginning of the track.
     * 
     * @param track The track to be played.
     * @return A promise which tells when the track is loaded or if it gave an error.
     */
    load(track: ITrack): Promise<any>;

    /**
     * Plays the current track.
     */
    play(): void;

    /**
     * Pauses the current track.
     */
    pause(): void;

    /**
     * Stops the current track.
     */
    stop(): void;

    /**
     * Sets the players volume percentage.
     * 
     * @param volume The percentage (0 to 1) volume to set the player to.
     */
    setVolume(volume: number): void;

    /**
     * Seeks to a specified time in the current track.
     * If the player is paused it should remain paused.
     * If the player is in another state it should play the current track.
     * 
     * @param milliseconds The time in milliseconds to which the player should advance.
     */
    seekTo(milliseconds: number): void;

    /**
     * Gets the current time of the track.
     * 
     * @return The current time of the track in milliseconds.
     */
    getCurrentTime(): number;

    /**
     * Gets the duration of the current track.
     * 
     * @return The duration of the current track in milliseconds.
     */
    getDuration(): number;

    /**
     * Gets the percentage that the track has loaded.
     * 
     * @return The percentage (0 to 1) that the track has loaded.
     */
    getPercentageLoaded(): number;

}
