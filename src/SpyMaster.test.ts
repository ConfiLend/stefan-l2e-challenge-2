import { Message } from './Message';
import { BatchProcessor, SpyMasterState, SpyMaster } from './SpyMaster'
import {
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
  verify,
  SelfProof
} from 'o1js';

let proofsEnabled = false;

describe('SpyMaster', () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    SpyMasterAddress: PublicKey,
    SpyMasterPrivateKey: PrivateKey,
    spyMaster: SpyMaster,
    verificationKey: { data: string, hash: Field },
    lastProof: SelfProof<SpyMasterState, Field>, // here we are going to save the last proof created by BatchProcessor
    lastSpyMasterState = new SpyMasterState({ MaxMessageNumber: Field(0) });


  const Local = Mina.LocalBlockchain({ proofsEnabled });

  beforeAll(async () => {
    if (proofsEnabled) await SpyMaster.compile();
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[0]);
    SpyMasterPrivateKey = PrivateKey.random();
    SpyMasterAddress = SpyMasterPrivateKey.toPublicKey();
    spyMaster = new SpyMaster(SpyMasterAddress);
    verificationKey = (await BatchProcessor.compile()).verificationKey
  });

  // beforeEach(() => { console.log() });

  async function localDeploy() {
    SpyMasterPrivateKey = PrivateKey.random();
    SpyMasterAddress = SpyMasterPrivateKey.toPublicKey();
    spyMaster = new SpyMaster(SpyMasterAddress);
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      spyMaster.deploy();
      spyMaster.initState();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, SpyMasterPrivateKey]).send();
    // await fetchAccount(SpyMasterAddress);
  }

  it('Generates and deploys the `SpyMaster` smart contract', async () => {
    await localDeploy()
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(0));
  })

  it('Generates `BatchProcessor` ZkProgram', async () => {
    const spyMasterState = new SpyMasterState({ MaxMessageNumber: Field(0) });
    lastProof = await BatchProcessor.init(spyMasterState);

    await verify(lastProof.toJSON(), verificationKey);
  })

  it('Generates proof for a valid message and update the SpyMaster SC', async () => {
    // generate a new message
    const message = Message.getRandomMessage(Field(1));

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));

    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a valid message but smaller ID', async () => {
    let message = Message.getRandomMessage(Field(0));

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));

    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a message with AgentID not in range', async () => {
    let message = Message.getRandomMessage(Field(2));
    message.MessageDetails.AgentID = Field(3001)

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));
    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a message with XCoordinates not in range', async () => {
    let message = Message.getRandomMessage(Field(2));
    message.MessageDetails.AgentXLocation = Field(15001)

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));
    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a message with YCoordinates not in range', async () => {
    let message = Message.getRandomMessage(Field(2));
    message.MessageDetails.AgentYLocation = Field(20001)

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));
    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a message with YCoordinates equal to XCoordinates', async () => {
    let message = Message.getRandomMessage(Field(2));
    message.MessageDetails.AgentYLocation = message.MessageDetails.AgentXLocation;

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(1));
    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a valid message', async () => {
    let message = Message.getRandomMessage(Field(2));

    // calculate the new SpyMasterState
    const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

    //calculate proof
    lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(2));
    // update the last spy master state
    lastSpyMasterState = newSpyMasterState;
  })

  it('Generates proof for a bunch of messages at once', async () => {
    for (let i = 0; i < 5; i++) {
      let message = Message.getRandomMessage(Field(3 + i));

      // calculate the new SpyMasterState
      const newSpyMasterState = lastSpyMasterState.processNewMessage(message);

      //calculate proof
      lastProof = await BatchProcessor.nextStep(lastSpyMasterState, lastProof, newSpyMasterState, message);

      // update the last spy master state
      lastSpyMasterState = newSpyMasterState;
    }

    // send the transaction for the SpyMaster update
    let txn = await Mina.transaction(senderAccount, () => {
      spyMaster.update(lastProof);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // make sure that the value is correctly updated
    const maxMessageNumber = await spyMaster.maxMessageNumber.get();
    maxMessageNumber.assertEquals(Field(8));
  })

});
