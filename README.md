## Forta Recipes

A set of ready-made recipes to common problems encountered during Forta bot development.

## List

### Extract created contracts

The tool detects all contracts created within the passed transaction event.
It should be noted that contracts created by other contracts can be detected only
if [Trace API](https://github.com/NethermindEth/docs/blob/master/nethermind-utilities/cli/trace.md) is supported.

```ts
import { getCreatedContracts } from 'forta-helpers';

async function handleTransaction(txEvent: TransactionEvent) {
  const createdContracts = getCreatedContracts(txEvent);

  for (const contract of createdContracts) {
    // {
    //     address: string;
    //     deployer: string;
    //     timestamp: number;
    //     blockNumber: number;
    // }
    console.log(contract);
  }

  return [];
}
```

### Identify token contract

```ts
import { getCreatedContracts, identifyTokenInterface } from 'forta-helpers';

async function handleTransaction(txEvent: TransactionEvent) {
  const createdContracts = getCreatedContracts(txEvent);

  for (const contract of createdContracts) {
    const type = await identifyTokenInterface(contract.address, data.provider);
    if (type) Logger.debug(`Found token contract (ERC${type}): ${contract.address}`);
  }

  return [];
}
```

### Extract addresses from a contract

TODO

### Get accessible IPFS URI

TODO

### Parallel execution by multiple providers

TODO

### Get addresses from contract storage

TODO

### File Storage

TODO

### Filter burn-address

TODO

### Retry

TODO
