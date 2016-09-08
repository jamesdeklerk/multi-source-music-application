/**
 * The interface music service player adapters must implement.
 * @see Player.ts
 * 
 * Player adapters should not use any defined constants.
 */
interface IPlayerAdapter {

    /**
     * The music services name.
     */
    name: string;

    /**
     * This should initialize the player in the relevant way.
     * This function is called immediately after the service adapter is created.
     * 
     * @return A promise which tells when the player is initialized and ready for use.
     */
    initialize(): Promise<any>;

    /**
     * Stops the playing of current track and 
     * unloads it from the player.
     */
    unload(): void;

    /**
     * Loads the specified track.
     * It is very important that the track is paused at the beginning of the track (i.e. 0% progress).
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
     * Sets the players volume percentage.
     * 
     * @param volume The percentage (0 to 1) volume to set the player to.
     */
    setVolume(volume: number): void;

    /**
     * Seeks to a specified percentage in the current track.
     * If the player is paused it should remain paused.
     * If the player is in another state it should play the current track.
     * 
     * @param percentage The percentage (0 to 1) to which the player should advance.
     */
    seekToPercentage(percentage: number): void;

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
