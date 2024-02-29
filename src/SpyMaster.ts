import {
  SmartContract,
  ZkProgram,
  Field,
  Provable,
  Struct,
  SelfProof,
  method,
  state,
  State,
  Permissions,
} from 'o1js';
import { Message } from "./Message"

export class SpyMasterState extends Struct({
  MaxMessageNumber: Field
}) {
  assertInitialState() {
    this.MaxMessageNumber.assertEquals(Field(0));
  }

  processNewMessage(newMessage: Message) {
    const check = newMessage.checkMessageDetails().and(newMessage.MessageNumber.greaterThan(this.MaxMessageNumber))

    const newMaxNumber = Provable.if(
      check,
      newMessage.MessageNumber,
      this.MaxMessageNumber
    );

    return new SpyMasterState({
      MaxMessageNumber: newMaxNumber
    })
  }

  assertEquals(spyMasterState: SpyMasterState) {
    spyMasterState.MaxMessageNumber.assertEquals(this.MaxMessageNumber);
  }
}

export const BatchProcessor = ZkProgram({
  name: "batch-processor",
  publicInput: SpyMasterState,
  publicOutput: Field,

  methods: {
    init: {
      privateInputs: [],
      method(
        state: SpyMasterState
      ) {
        state.assertInitialState();
        return Field(0);
      }
    },

    nextStep: {
      privateInputs: [SelfProof, SpyMasterState, Message],

      method(
        spyMasterState: SpyMasterState,
        previousProof: SelfProof<SpyMasterState, Field>,
        newSpyMasterState: SpyMasterState,
        newMessage: Message
      ) {
        previousProof.verify();

        const calculatedSpyMasterState = spyMasterState.processNewMessage(newMessage);

        calculatedSpyMasterState.assertEquals(newSpyMasterState);
        return calculatedSpyMasterState.MaxMessageNumber;
      },
    },

  }
})

export let BatchProcessorProof_ = ZkProgram.Proof(BatchProcessor);
export class BatchProcessorProof extends BatchProcessorProof_ { }

export class SpyMaster extends SmartContract {
  @state(Field) maxMessageNumber = State<Field>();

  deploy() {
    super.deploy();
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
  }

  @method initState() {
    super.init()
    this.maxMessageNumber.set(Field(0));
  }

  @method update(proof: BatchProcessorProof) {
    proof.verify();
    const currentMaxMessageNumber = this.maxMessageNumber.getAndRequireEquals();
    const maxMessageNumber = proof.publicOutput;

    const newMax = Provable.if(currentMaxMessageNumber.greaterThan(maxMessageNumber),
      currentMaxMessageNumber,
      maxMessageNumber
    )

    this.maxMessageNumber.set(newMax);
  }

}