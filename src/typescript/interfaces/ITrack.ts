/**
 * The schema for a Track.
 * Track schema inspired by the Deezer API @see https://developers.deezer.com/api/track
 */
interface ITrack {
    /**
     * The universally unique identifier of the Track.
     */
    uuid: string;

    /**
     * The full title of the Track.
     */
    title: string;

    /**
     * Duration in milliseconds (might change to ISO 8601).
     */
    duration: number;

    /**
     * Artist object.
     */
    artist: IArtist;

    /**
     * Album object.
     */
    album?: IAlbum;

    /**
     * Object containing the appropriate track properties
     * for each music service it's available on.
     */
    services: any;

}
