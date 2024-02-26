import {
  Field,
  MerkleMapWitness,
  Struct,
} from 'o1js';

export class RollupState extends Struct({
    initialRoot: Field,
    latestRoot: Field,
  }) { 
  
    static createOneStep(
      initialRoot: Field, 
      latestRoot: Field, 
      key: Field, 
      currentValue: Field,
      incrementAmount: Field, 
      merkleMapWitness: MerkleMapWitness,
    ) {
      const [ witnessRootBefore, witnessKey ] = merkleMapWitness.computeRootAndKey(currentValue);
      initialRoot.assertEquals(witnessRootBefore);
      witnessKey.assertEquals(key);
      const [ witnessRootAfter, _ ] = merkleMapWitness.computeRootAndKey(currentValue.add(incrementAmount));
      latestRoot.assertEquals(witnessRootAfter);
  
      return new RollupState({
        initialRoot,
        latestRoot
      });
    }
}