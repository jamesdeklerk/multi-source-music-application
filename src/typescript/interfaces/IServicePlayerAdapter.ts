/**
 * The interface music service player adapters must implement
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

    
}

class YouTubeAdapter implements IServicePlayerAdapter {

}
