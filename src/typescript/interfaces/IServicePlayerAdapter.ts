/**
 * The interface music service player adapters must implement.
 * @see Player.ts
 */
interface IServicePlayerAdapter {

    /**
     * The name of the music service.
     */
    name: string;

    /**
     * Returns whether the audio/video is paused or not.
     * Implement this using a getter.
     */
    paused: boolean;

    new (): IServicePlayerAdapter;

    /**
     * Loads the specified track and starts playing the song from the beginning.
     * 
     * @param track The track to be played.
     */
    load(track: ITrack): void;

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
     * Gets the percentage that the track has loaded
     * 
     * @return The percentage (0 to 1) that the track has loaded
     */
    getPercentageLoaded(): number;

}

class YouTubeAdapter implements IServicePlayerAdapter {

}
