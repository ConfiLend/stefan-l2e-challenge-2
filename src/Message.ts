import {
    Field,
    Struct,
    Bool
} from 'o1js';

export class MessageDetails extends Struct({
    AgentID: Field,
    AgentXLocation: Field,
    AgentYLocation: Field,
    CheckSum: Field
}) {

    checkConditions(): Bool {
        // checkSum is correct
        let checkSumCheck = this.checkCheckSum();
        // ranges are correct
        let rangeCheck = this.checkRanges();
        // check YLocation > XLocation
        let coordinateCheck = this.checkCoordinates();

        return checkSumCheck.and(rangeCheck).and(coordinateCheck)
            // if AgentID = 0 we don't check anything more
            .or(this.AgentID.equals(0));
    }

    // checking if all the ranges are right
    checkRanges(): Bool {
        let agentId = MessageDetails.inRange(this.AgentID, Field(0), Field(3000));
        let XLocation = MessageDetails.inRange(this.AgentXLocation, Field(0), Field(15000));
        let YLocation = MessageDetails.inRange(this.AgentYLocation, Field(5000), Field(20000));
        return agentId.and(XLocation).and(YLocation);
    }

    // check if the checkSum is right
    checkCheckSum(): Bool {
        const checkSum = this.AgentID.add(this.AgentXLocation).add(this.AgentYLocation).equals(this.CheckSum);
        return checkSum
    }

    // check if the checkSum is right
    checkCoordinates(): Bool {
        const coordinates = this.AgentYLocation.greaterThan(this.AgentXLocation);
        return coordinates
    }

    // check if a value is in a specific range
    static inRange(value: Field, lowerBound: Field, upperBound: Field): Bool {
        return value.greaterThanOrEqual(lowerBound).and(value.lessThanOrEqual(upperBound))
    }

    // create a random number
    static getRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min
    }

    // create a random agent ID
    static getRandomAgentID() {
        return MessageDetails.getRandomNumber(0, 3000);
    }

    // create a random X Location
    static getXLocation() {
        return MessageDetails.getRandomNumber(0, 15000);
    }

    // create a random Y Location
    static getYLocation(XLocation: number) {
        return MessageDetails.getRandomNumber(XLocation, 20000);
    }
}

export class Message extends Struct({
    MessageNumber: Field,
    MessageDetails: MessageDetails
}) {
    checkMessageDetails(): Bool {
        return this.MessageDetails.checkConditions();
    }

    static getRandomMessage(MessageNumber: Field): Message {
        let agentID = MessageDetails.getRandomAgentID();
        let XLocation = MessageDetails.getXLocation();
        let YLocation = MessageDetails.getYLocation(XLocation);

        const message = new Message({
            MessageNumber: MessageNumber,
            MessageDetails: new MessageDetails({
                AgentID: Field(agentID),
                AgentXLocation: Field(XLocation),
                AgentYLocation: Field(YLocation),
                CheckSum: Field(agentID + XLocation + YLocation)
            })
        })

        return message
    }
}

