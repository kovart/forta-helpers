import { ethers, TransactionEvent } from 'forta-agent';

export type CreatedContract = {
  deployer: string;
  address: string;
  timestamp: number;
  blockNumber: number;
};


export function getCreatedContracts(txEvent: TransactionEvent): CreatedContract[] {
  const createdContracts: CreatedContract[] = [];

  const sender = txEvent.from.toLowerCase();

  for (const trace of txEvent.traces) {
    if (trace.type === 'create') {
      const deployer = trace.action.from.toLowerCase();

      // Parity/OpenEthereum trace format contains created address
      // https://github.com/NethermindEth/docs/blob/master/nethermind-utilities/cli/trace.md
      if (trace.result.address) {
        createdContracts.push({
          deployer: deployer,
          address: trace.result.address.toLowerCase(),
          blockNumber: txEvent.blockNumber,
          timestamp: txEvent.timestamp,
        });
        continue;
      }

      // Fallback to more universal way

      if (sender === deployer || createdContracts.find((c) => c.address === deployer)) {
        // for contracts creating other contracts, the nonce would be 1
        const nonce = sender === deployer ? txEvent.transaction.nonce : 1;
        const createdContract = ethers.utils.getContractAddress({ from: deployer, nonce });
        createdContracts.push({
          deployer: deployer,
          address: createdContract.toLowerCase(),
          blockNumber: txEvent.blockNumber,
          timestamp: txEvent.timestamp,
        });
      }
    }
  }

  if (!txEvent.to && txEvent.traces.length === 0) {
    createdContracts.push({
      deployer: sender,
      address: ethers.utils
        .getContractAddress({
          from: txEvent.from,
          nonce: txEvent.transaction.nonce,
        })
        .toLowerCase(),
      blockNumber: txEvent.blockNumber,
      timestamp: txEvent.timestamp,
    });
  }

  return createdContracts;
}