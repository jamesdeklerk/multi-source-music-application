interface IEvent {
    /**
     * A description of the event.
     */
    description?: string;
    /**
     * An array of handlers.
     */
    handlers?: Function[];
    /**
     * The name of the event.
     */
    name: string;
    /**
     * The parameters passed through to the event handlers.
     * An ordered array of parameter objects containing each parameters information
     * i.e. name, description and type.
     * A type can be "boolean", "number", "string", "symbol", "function" or "object".
     * 
     * e.g.
     * // If an event handler looks like this:
     * function handler(firstName: string, surnameName: string) {
     *     console.log(`Hello ${firstName} ${surnameName}!`);
     * }
     * // The event handlers parameters should be defined as follows:
     * [
     *     {
     *         description: `The person's first name.`,
     *         name: `firstName`,
     *         type: `string`
     *     },
     *     {
     *         description: `The person's surname name.`,
     *         name: `surnameName`,
     *         type: `string`
     *     }
     * ]
     */
    parameters: any[];
    /**
     * The object that registered the event.
     */
    registrant?: any;
}


/**
 * Publish–subscribe library
 * Uses the publish–subscribe pattern @see https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
 */
class Publisher {

    /**
     * Holds key-value pairs of events and the associated handlers.
     * Key: The event name
     * Value: An array of handlers subscribed to that event.
     * e.g. subscriptions = {
     *     `event1`: [
     *         function () {},
     *         function () {}
     *     ],
     *     `event2`: [
     *         function () {}
     *     ]
     * }
     */
    private subscriptions: any = {};
    /**
     * A registry of all the events.
     */
    private registeredEvents: IEvent[] = [];


    /**
     * Gets the index of an event in registeredEvents.
     * 
     * @param eventName The name of the event.
     * @return The index of the event in registeredEvents, if the event isn't registered, return -1.
     */
    private eventIndex(eventName: string): number {

        // tslint:disable-next-line
        for (let i = 0, event: IEvent; event = this.registeredEvents[i]; i = i + 1) {
            if (event.name === eventName) {
                return i;
            }
        }

        return -1;
    }


    /**
     * Gets an event.
     * 
     * @param eventName The name of the event.
     * @return The event.
     */
    public getEvent(eventName: string): IEvent {
        if (!eventName) {
            throw new Error(`Expected an event name.`);
        }

        let eventIndex = this.eventIndex(eventName);

        // Check if the event is registered.
        if (eventIndex > -1) {
            let event = this.registeredEvents[eventIndex];

            return {
                description: event.description,
                handlers: this.subscriptions[eventName],
                name: event.name,
                parameters: event.parameters,
                registrant: event.registrant,
            };
        } else {
            throw new Error(`Event ${eventName} is unregistered.`);
        }
    }


    /**
     * Gets all the registered events.
     * 
     * @return All registered events.
     */
    public getAllEvents(): IEvent[] {
        let events: IEvent[] = [];

        for (let event of this.registeredEvents) {
            events.push(this.getEvent(event.name));
        }

        return events;
    }


    /**
     * Gets the description of an event.
     * 
     * @param eventName The name of the event.
     * @return The description of an event.
     */
    public getEventDescription(eventName: string): string {
        return this.getEvent(eventName).description;
    }


    /**
     * Gets the handlers of an event.
     * 
     * @param eventName The name of the event.
     * @return The handlers of an event.
     */
    public getEventHandlers(eventName: string): Function[] {
        return this.getEvent(eventName).handlers;
    }


    /**
     * Gets the parameters of an event.
     * 
     * @param eventName The name of the event.
     * @return The parameters of an event.
     */
    public getEventParameters(eventName: string): any {
        return this.getEvent(eventName).parameters;
    }


    /**
     * Gets the registrant of an event.
     * 
     * @param eventName The name of the event.
     * @return The registrant of an event.
     */
    public getEventRegistrant(eventName: string): any {
        return this.getEvent(eventName).registrant;
    }


    /**
     * Checks if an event is registered.
     * 
     * @param eventName The name of the event.
     * @return True if the event is registered, false if not.
     */
    private isRegistered(eventName: string): boolean {

        if (this.eventIndex(eventName) > -1) {
            return true;
        } else {
            return false;
        }
    }


    /**
     * Registers an event and defines the parameters its handler takes.
     * 
     * @param eventName The name of the event.
     * @param parameters The parameters passed through to the event handlers.
     * @param description A description of the event.
     * @param registrant The object that registered the event.
     */
    public register(eventName: string, parameters?: any[], description?: string, registrant?: any): void {
        // Check the correct parameters were given.
        if (!eventName || !parameters) {
            throw new Error(`Expected at least an event name and array of parameters in order to register an event.`);
        }

        // Check if the event is already registered
        if (this.isRegistered(eventName)) {
            throw new Error(`Event ${eventName} is already registered.`);
        }

        let newEvent: IEvent = {
            description: description,
            name: eventName,
            parameters: parameters,
            registrant: registrant,
        };

        this.registeredEvents.push(newEvent);
    }


    /**
     * Deregisters an event.
     * 
     * @param eventName The name of the event to deregister.
     */
    public deregister(eventName: string): void {
        if (!eventName) {
            throw new Error(`Expected an event name to deregister.`);
        }

        let eventIndex = this.eventIndex(eventName);

        // Check if the event is registered.
        if (eventIndex > -1) {

            // Delete the event (i.e. remove all event handlers from an event).
            this.unsubscribe(eventName);

            // Remove the event from this.registeredEvents.
            this.registeredEvents.splice(eventIndex, 1);

        } else {
            throw new Error(`Event ${eventName} is unregistered.`);
        }
    }


    /**
     * Deregisters all events.
     */
    public deregisterAll(): void {
        this.subscriptions = {};
        this.registeredEvents = [];
    }


    /**
     * Adds a handler to an event in events.
     * 
     * @param eventName The name of the event.
     * @param handler The function to run when the event occurs. 
     */
    public subscribe(eventName: string, handler: Function): Function {

        // First check the event exists
        if (!eventName) {
            throw new Error(`Expected an event name to subscribe.`);
        }

        if (!this.isRegistered(eventName)) {
            throw new Error(`Event ${eventName} is unregistered.`);
        }

        if (!handler) {
            throw new Error(`Expected an event handler.`);
        }

        // If the event doesn't exist, create an array for the events
        if (!this.subscriptions.hasOwnProperty(eventName)) {
            this.subscriptions[eventName] = [];
        }

        // @NB Add this reference to the handler so it's easy to unsubscribe
        // handler.eventName = eventName;

        // Add the event handler to that event
        this.subscriptions[eventName].push(handler);

        return handler;
    }


    // The unsubscribe method uses method overloading.
    // @see http://stackoverflow.com/questions/12688275/method-overloading
    /**
     * Deletes the event (i.e. removes all event handlers from an event).
     * 
     * @param eventName The name of the event.
     * @return True if successfully unsubscribed, false if not.
     */
    public unsubscribe(eventName: string): boolean
    /**
     * Removes the specified a handler from an event.
     * If there are multiple of the exact (===) same handler, it will only remove the first one.
     * 
     * @param eventName The name of the event.
     * @param handler The specific handler (i.e. function) to be removed from the event.
     * @return True if successfully unsubscribed, false if not.
     */
    public unsubscribe(eventName: string, handler: Function): boolean
    public unsubscribe(eventName: string, handler?: Function): boolean {

        // First check the event exists
        if (!eventName) {
            throw new Error(`Expected an event name to unsubscribe.`);
        }

        if (!this.isRegistered(eventName)) {
            throw new Error(`Event ${eventName} is unregistered.`);
        }

        // If the event doesn't exist, return
        if (!this.subscriptions.hasOwnProperty(eventName)) {
            return false;
        }

        // If the handler isn't defined, remove all handlers listening for that event
        if (!handler) {
            delete this.subscriptions[eventName];
        } else {

            // Else if the handler is defined, remove that specific handler
            let index = this.subscriptions[eventName].indexOf(handler);
            if (index > -1) {
                this.subscriptions[eventName].splice(index, 1);

                // If there are no more event handlers, remove that event (i.e. remove the empty array)
                if (this.subscriptions[eventName].length <= 0) {
                    delete this.subscriptions[eventName];
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
     * @param eventName The name of the event.
     * @param args The arguments to be passed through to the events handler(s).
     * @return True if successfully published, false if not.
     */
    public publish(eventName: string, ...args: any[]): boolean {

        if (!eventName) {
            throw new Error(`Expected an event name to publish.`);
        }

        // If the event doesn't exist, return false
        // The property wouldn't exist if the array was empty
        if (!this.subscriptions.hasOwnProperty(eventName)) {
            return false;
        }

        let eventHandlers: Function[] = this.subscriptions[eventName];

        // Execute each of the relevant event handlers
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
// tslint:disable-next-line
let publisher = new Publisher();
