interface IMusicService {

    /**
     * The music service player adapter which implements IPlayerAdapter.
     */
    adapter: any;

    /**
     * initialized is an optional parameter because 
     */
    initialized?: boolean;

    /**
     * The name of the music service.
     */
    name: string;

}
