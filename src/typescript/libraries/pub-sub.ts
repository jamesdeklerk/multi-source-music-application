// =======================================================
// Publish–subscribe library
// Uses the publish–subscribe pattern @see https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
// =======================================================

interface IPublisherHandlers {
    // Specifies the function to run when the event occurs. 
    handlers: Array<Function>;
}

class Publisher {

    /**
     * Holds key-value pairs of events and the associated handlers.
     * Key: The events name
     * Value: An array of handlers subscribed to that event.
     * e.g. events = {
     *     "event1": [
     *         function () {},
     *         function () {}
     *     ],
     *     "event2": [
     *         function () {}
     *     ]
     * }
     */
    private events: any = {};


    /**
     * Adds a handler to an event in events.
     * 
     * @param event The name of the event.
     * @param handler The function to run when the event occurs. 
     */
    public subscribe(event: string, handler: Function): Function {
        if (handler === undefined) {
            throw new Error("Expected an event handler");
        }

        // if the event doesn't exist, create an array for the events
        if (!this.events.hasOwnProperty(event)) {
            this.events[event] = [];
        }

        // add this reference to the handler so it's easy to unsubscribe
        // handler.event = event;

        // add the event handler to that event
        this.events[event].push(handler);

        return handler;
    }


    /**
     * Deletes the event.
     * 
     * @param event The name of the event.
     * @return True if successfully unsubscribed, false if not.
     */
    public unsubscribe(event: string): boolean
    /**
     * Removes the specified a handler from an event.
     * NB: if there are multiple of the exact (===) same handler, it will only remove the first one.
     * 
     * @param event The name of the event.
     * @param handler The specific handler (i.e. function) to be removed from the event.
     * @return True if successfully unsubscribed, false if not.
     */
    public unsubscribe(event: string, handler: Function): boolean
    public unsubscribe(event: string, handler?: Function): boolean {

        // first check the event exists
        if (event === undefined) {
            throw new Error("Expected an event to unsubscribe");
        }

        // if the event doesn't exist, return
        if (!this.events.hasOwnProperty(event)) {
            return false;
        }

        // if the handler isn't defined, remove all handlers listening for that event
        if (handler === undefined) {
            delete this.events[event];
        } else {

            // else if the handler is defined, remove that specific handler
            let index = this.events[event].indexOf(handler);
            if (index > -1) {
                this.events[event].splice(index, 1);

                // if there are no more event handlers, remove that event (i.e. remove the empty array)
                if (this.events[event].length <= 0) {
                    delete this.events[event];
                }
            }
        }

        return true;
    }


    /**
     * Executes each of the relevant event handlers.
     * It passes through the appropriate arguments using rest parameters
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
     * 
     * @param event The name of the event.
     * @param args The arguments to be passed through to the events handler(s).
     * @return True if successfully published, false if not.
     */
    public publish(event: string, ...args: any[]): boolean {

        if (event === undefined) {
            throw new Error("Expected an event to publish");
        }

        // if the event doesn't exist, return false
        // NB: the property wouldn't exist if the array was empty
        if (!this.events.hasOwnProperty(event)) {
            return false;
        }

        let eventHandlers: Array<Function> = this.events[event];

        // execute each of the relevant event handlers
        // tslint:disable-next-line
        for (let i = 0, handler: Function; handler = eventHandlers[i]; i = i + 1) {
            handler(...args);
        }

        return true;
    }

}

/**
 * Globally accessible publisher object.
 */
let publisher = new Publisher();
