import {
    Field,
    Struct,
    Bool,
    Provable
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
        // Provable.log("Ranges:")
        // Provable.log("\tAgentID: ", agentId);
        // Provable.log("\tXLocation: ", agentId);
        // Provable.log("\tYLocation: ", agentId);
        return agentId.and(XLocation).and(YLocation);
    }

    // check if the checkSum is right
    checkCheckSum(): Bool {
        const checkSum = this.AgentID.add(this.AgentXLocation).add(this.AgentYLocation).equals(this.CheckSum);
        // Provable.log("Checksum: ", checkSum);
        return checkSum
    }

    // check if the checkSum is right
    checkCoordinates(): Bool {
        const coordinates = this.AgentYLocation.greaterThan(this.AgentXLocation);
        // Provable.log("Coordinates: ", coordinates);
        return coordinates
    }

    // check if a value is in a specific range
    static inRange(value: Field, lowerBound: Field, upperBound: Field): Bool {
        return value.greaterThanOrEqual(lowerBound).and(value.lessThanOrEqual(upperBound))
    }
}

export class Message extends Struct({
    MessageNumber: Field,
    MessageDetails: MessageDetails
}) {
    checkMessageDetails(): Bool {
        return this.MessageDetails.checkConditions();
    }
}

