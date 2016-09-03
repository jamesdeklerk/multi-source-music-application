interface IParameterDefinition {
    name: string;
    type: string;
    optional?: boolean;
    description?: string;
}

class ParameterDefinition {
    /**
     * An array of the valid JavaScript data types.
     */
    private validTypes: string[] = [`boolean`, `number`, `string`, `symbol`, `function`, `object`];
    public name: string;
    public type: string;
    public optional: boolean;
    public description: string;


    /**
     * Creates a new instance of ParameterDefinition.
     * It also makes sure it's a valid ParameterDefinition.
     * 
     * @param name The name of the parameter.
     * @param type The type of the parameter. It must be a valid JavaScript data type @see validTypes.
     * @param optional Specifies if the parameter is optional. If optional is not defined it defaults to false.
     * @param description A description of the parameter.
     */
    constructor(name: string, type: string, optional?: boolean, description?: string) {
        this.name = name;
        this.type = type;
        if (optional) {
            this.optional = true;
        } else {
            this.optional = false;
        }
        this.description = description || ``;

        // Make sure this is a valid parameter definition.
        this.performValidParameterDefinitionCheck(this);
    }


    /**
     * Checks is a given type is a valid type.
     * 
     * @param type The type to check.
     * @return True if the type is valid, false if not.
     */
    private validType(type: string): boolean {
        for (let validType of this.validTypes) {
            if (type === validType) {
                return true;
            }
        }

        return false;
    }


    /**
     * Checks is a given parameter definition is valid.
     */
    private performValidParameterDefinitionCheck(parameter: ParameterDefinition): void {

        // Check that name is a string and it has at least 1 character.
        if (typeof parameter.name !== `string` || parameter.name.length <= 0) {
            throw new Error(`Expected the parameter name to be a string with at least 1 character.`);
        }

        // Check that optional is a boolean.
        if (typeof parameter.optional !== `boolean`) {
            throw new Error(`Expected optional of parameter ${parameter.name} to be a boolean.`);
        }

        // Check the parameter type is valid.
        if (!this.validType(parameter.type)) {
            throw new Error(`The type "${parameter.type}" of parameter ${parameter.name} is not ` +
                `a valid JavaScript type. Expected type to be "boolean" or "number" or "string" etc.\n` +
                `Note: Arrays and instantiations of custom classes have type "object", ` +
                `and classes have type "function".`);
        }

        // Check that description is a string.
        if (typeof parameter.description !== `string`) {
            throw new Error(`Expected description of parameter ${parameter.name} to be a string.`);
        }
    }


}


class PublisherEvent {
    public name: string;
    public parameters: ParameterDefinition[];
    public description: string;
    public registrant: any;
    /**
     * An array of the event handlers associated with this event.
     */
    public handlers: Function[] = [];


    /**
     * Creates a new instance of PublisherEvent.
     * 
     * @param eventName The name of the event.
     * @param parameters An array of ParameterDefinition objects. This defines each 
     * of the parameters passed through when an event handler is fired.
     * e.g.
     * // If an event handler looks like this:
     * function handler(firstName: string, surnameName: string) {
     *     console.log(`Hello ${firstName} ${surnameName}!`);
     * }
     * // The event handlers parameters should be defined as follows:
     * [
     *     {
     *         description: "The person's first name.",
     *         name: "firstName",
     *         type: "string",
     *         optional: false
     *     },
     *     {
     *         description: "The person's surname name.",
     *         name: "surnameName",
     *         type: "string",
     *         optional: true
     *     }
     * ]
     * @param description A description of the event.
     * @param registrant The object that registered the event.
     */
    constructor(eventName: string, parameters?: IParameterDefinition[], description?: string, registrant?: any) {

        this.name = eventName;
        this.description = description || ``;
        this.registrant = registrant;

        this.parameters = <ParameterDefinition[]> (parameters || []);
        // If this.parameters is not a ParameterDefinition array, try convert it to one.
        if (!this.validParameterDefinitionArray(this.parameters)) {
            this.parameters = this.convertToParameterDefinitionArray(this.parameters);
        }

        // Make sure this is a valid publisher event.
        this.performValidPublisherEventCheck(this);
    }


    /**
     * Converts parameters to a ParameterDefinition array.
     * 
     * @param parameters The ParameterDefinition array to check.
     * @return A ParameterDefinition array, else false.
     */
    private convertToParameterDefinitionArray(parameters: ParameterDefinition[]): ParameterDefinition[] {

        // Check that parameters is an array.
        if (parameters instanceof Array) {
            // If it is an array, try convert each item into a ParameterDefinition
            // tslint:disable-next-line
            for (let i = 0, parameter: any; parameter = parameters[i]; i = i + 1) {

                // Check that parameter is an object of some kind.
                if (typeof parameter !== `object`) {
                    throw new Error(`Unexpected parameter definition.`);
                }

                parameters[i] = new ParameterDefinition(parameter.name, parameter.type,
                    parameter.optional, parameter.description);
            }
        } else {
            throw new Error(`Expected parameters to be an array of parameter definitions (the array can be empty).`);
        }

        return parameters;
    }


    /**
     * Checks is the given parameters are in a valid order.
     * A required parameter cannot follow an optional parameter.
     * 
     * @param parameters The ParameterDefinition array to check.
     * @return True if it is a valid parameter order, else false.
     */
    private validParameterOrder(parameters: ParameterDefinition[]): boolean {
        let optionalParameterFound = false;

        for (let parameter of parameters) {
            if (parameter.optional) {
                optionalParameterFound = true;
            }

            // If an optional parameter was found and a required parameter 
            // was found after the optional parameter was found,
            // then it is not a valid parameter order.
            if (optionalParameterFound && !parameter.optional) {
                return false;
            }
        }

        // If it gets here, no required parameters were found following an optional parameter.
        // Hence, it is a valid parameter order.
        return true;
    }


    /**
     * Checks for duplicate parameters.
     * 
     * @param parameters The ParameterDefinition array to check.
     * @return The position of the duplicate parameter in parameters,
     * if no duplicates are found return -1; 
     */
    private checkForDuplicateParameters(parameters: ParameterDefinition[]): number {
        // Using a JavaScript object as a hashmap for duplicate checking.
        let parametersAlreadyFound: any = {};

        // tslint:disable-next-line
        for (let i = 0, parameter: any; parameter = parameters[i]; i = i + 1) {
            
            // If the parameter has been found before, it's a duplicate.
            if (parametersAlreadyFound[parameter.name]) {
                return i;
            }

            // Add the parameter to the found list.
            parametersAlreadyFound[parameter.name] = true;
        }

        return -1;
    }


    /**
     * Checks if parameters is a ParameterDefinition array.
     * 
     * @param parameters The ParameterDefinition array to check.
     * @return True if it is a valid ParameterDefinition array, else false.
     */
    private validParameterDefinitionArray(parameters: ParameterDefinition[]): boolean {

        // Check that parameters is an array.
        if (parameters instanceof Array) {
            // Then make sure each item in the array is a ParameterDefinition.
            for (let parameter of parameters) {
                if (!(parameter instanceof ParameterDefinition)) {
                    return false;
                }
            }
        } else {
            return false;
        }

        return true;
    }


    /**
     * Checks is a given event is valid.
     * 
     * @param event The PublisherEvent to check.
     */
    private performValidPublisherEventCheck(event: PublisherEvent): void {

        // Check that name is a string and it has at least 1 character.
        if (typeof event.name !== `string` || event.name.length <= 0) {
            throw new Error(`Expected the event name to be a string with at least 1 character.`);
        }

        // Don't need to check that parameters is a ParameterDefinition array.
        // This was done in the constructor.

        // Check for duplicate parameters.
        let duplicateParameterPosition = event.checkForDuplicateParameters(event.parameters);
        if (duplicateParameterPosition > -1) {
            throw new Error(`Parameter ${duplicateParameterPosition} of the event parameters is already defined.`);
        }

        // Check the parameters are in a valid order.
        if (!this.validParameterOrder(event.parameters)) {
            throw new Error(`A required parameter cannot follow an optional parameter.`);
        }

        // Check that description is a string.
        if (typeof event.description !== `string`) {
            throw new Error(`Expected description of event ${event.name} to be a string.`);
        }
    }


    /**
     * Checks if the given handlers arguments match the parameters defined for this event.
     * 
     * @param args The arguments to check.
     */
    public checkHandlersArgumentsMatchParametersDefined(...args: any[]): void {

        // For each parameter defined
        // tslint:disable-next-line
        for (let i = 0, parameter: ParameterDefinition; parameter = this.parameters[i]; i = i + 1) {

            // Check if the argument is of the correct type.
            if (typeof args[i] !== parameter.type) {

                // If it's not of the correct type and it's a required parameter,
                // throw an error.
                if (!parameter.optional) {
                    throw new Error(`The handler parameters given don't match those defined for ` +
                        `event ${this.name}. Expected argument ${i} to be of type "${parameter.type}" ` +
                        `but found type "${typeof args[i]}".`);
                } else {

                    // If it's not of the correct type but it's an optional parameter,
                    // it must be undefined.
                    if (!(typeof args[i] === `undefined`)) {
                        throw new Error(`The handler parameters given don't match those defined for ` +
                            `event ${this.name}. Expected argument ${i} to be of type "${parameter.type}" ` +
                            `but found type "${typeof args[i]}".`);
                    }
                }
            }

        }

    }


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
    private registeredEvents: PublisherEvent[] = [];
    private checkEventAndArgumentsOnPublish: boolean;


    /**
     * Creates a new instance of Publisher.
     * 
     * @param checkEventAndArgumentsOnPublish Specifies whether or not - when publishing an event - 
     * to check that the event is registered and the associated arguments are valid.
     * Suggestion:
     * checkEventAndArgumentsOnPublish = true for development.
     * checkEventAndArgumentsOnPublish = false for production.
     */
    constructor(checkEventAndArgumentsOnPublish?: boolean) {
        if (checkEventAndArgumentsOnPublish) {
            this.checkEventAndArgumentsOnPublish = true;
        } else {
            this.checkEventAndArgumentsOnPublish = false;
        }
    }


    /**
     * Gets the index of an event in registeredEvents.
     * 
     * @param eventName The name of the event.
     * @return The index of the event in registeredEvents, if the event isn't registered, return -1.
     */
    private eventIndex(eventName: string): number {

        // tslint:disable-next-line
        for (let i = 0, event: PublisherEvent; event = this.registeredEvents[i]; i = i + 1) {
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
    public getEvent(eventName: string): PublisherEvent {
        if (!eventName) {
            throw new Error(`Expected an event name.`);
        }

        let eventIndex = this.eventIndex(eventName);

        // Check if the event is registered.
        if (eventIndex > -1) {
            let event = this.registeredEvents[eventIndex];

            // Set the current handlers.
            event.handlers = this.subscriptions[eventName] || [];

            return event;
        } else {
            throw new Error(`Event ${eventName} is not registered. Cannot get an event that isn't registered.`);
        }
    }


    /**
     * Gets all the registered events.
     * 
     * @return All registered events.
     */
    public getAllEvents(): PublisherEvent[] {
        let events: PublisherEvent[] = [];

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
    public getEventParameters(eventName: string): ParameterDefinition[] {
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
    public register(eventName: string,
                    parameters?: IParameterDefinition[], description?: string, registrant?: any): void {
        // Check the correct parameters were given.
        if (!eventName || eventName.length <= 0) {
            throw new Error(`Expected an event name with at least 1 character in order to register an event.`);
        }

        // Check if the event is already registered
        if (this.isRegistered(eventName)) {
            throw new Error(`Event ${eventName} is already registered.`);
        }

        let newEvent: PublisherEvent = new PublisherEvent(eventName, parameters, description, registrant);

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
            throw new Error(`Event ${eventName} is not registered. Cannot deregister and event that isn't registered.`);
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
            throw new Error(`Event ${eventName} is not registered. ` +
                `Cannot subscribe to an event that isn't registered.`);
        }

        if (!handler) {
            throw new Error(`Expected an event handler.`);
        }

        // Check that the event handlers parameters cater for those defined.
        let event = this.getEvent(eventName);
        let requiredParameterCount = 0;
        for (let parameter of event.parameters) {
            if (!parameter.optional) {
                requiredParameterCount = requiredParameterCount + 1;
            } else {
                // When we find the first optional parameter, stop counting.
                break;
            }
        }
        if (requiredParameterCount > handler.length) {
            // Compile parameter string.
            let parameterString = ``;
            // tslint:disable-next-line
            for (let i = 0, parameter: any; parameter = event.parameters[i]; i = i + 1) {
                // if it's not the first parameter or the last parameter.
                if (i > 0 && i < event.parameters.length) {
                    parameterString = parameterString + `, `;
                }
                parameterString = parameterString +
                    `${parameter.name + (parameter.optional ? `?` : ``)}: ${parameter.type}`;
            }

            throw new Error(`Expected (${parameterString}) parameters for the event ${eventName} handlers. ` +
                `The event handler does not cater for the required paramters. ` +
                `At least ${requiredParameterCount} expected, ${handler.length} found.`);
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
     * @return True if successfully unsubscribed, false if not (i.e. there were no subscribers to that event).
     */
    public unsubscribe(eventName: string, handler: Function): boolean
    public unsubscribe(eventName: string, handler?: Function): boolean {

        // First check the event exists
        if (!eventName) {
            throw new Error(`Expected an event name to unsubscribe.`);
        }

        if (!this.isRegistered(eventName)) {
            throw new Error(`Event ${eventName} is not registered. ` +
                `Cannot unsubscribe from an event that isn't registered.`);
        }

        // If the event has no subscribers, return false;
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
     */
    public publish(eventName: string, ...args: any[]): void {

        if (!eventName) {
            throw new Error(`Expected an event name to publish.`);
        }

        // Get an array of the event's handlers.
        let eventHandlers: Function[] = this.subscriptions[eventName] || [];

        // Determine if the handlers parameters should be checked.
        if (this.checkEventAndArgumentsOnPublish) {

            // Get the event.
            let event = this.getEvent(eventName);

            // Check if each of the relevant event handlers arguments are valid.
            // tslint:disable-next-line
            for (let i = 0, handler: Function; handler = eventHandlers[i]; i = i + 1) {
                event.checkHandlersArgumentsMatchParametersDefined(...args);
            }
        }

        // Execute each of the relevant event handlers
        // tslint:disable-next-line
        for (let i = 0, handler: Function; handler = eventHandlers[i]; i = i + 1) {
            handler(...args);
        }

    }

}

/**
 * Globally accessible publisher object.
 */
// tslint:disable-next-line
let publisher = new Publisher(true);
