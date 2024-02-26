import {
    Field,
    Struct,
    Bool
} from 'o1js';

class MessageDetails extends Struct({
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
        return this.AgentID.add(this.AgentXLocation).add(this.AgentYLocation).equals(this.CheckSum);
    }

    // check if the checkSum is right
    checkCoordinates(): Bool {
        return this.AgentYLocation.greaterThan(this.AgentYLocation);
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
    checkMessgeDetails(): Bool {
        return this.MessageDetails.checkConditions();
    }
}

