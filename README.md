## Forta Helpers

A set of ready-made recipes to common problems encountered during Forta bot development.

## List

## Extract created contracts

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

## Identify token contract

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

## Extract addresses from a contract code

```ts
import { getOpcodeAddresses, getOpcodeContractAddresses } from 'forta-helpers';

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth');
const code = await provider.getCode('0xdAC17F958D2ee523a2206206994597C13D831ec7');
const allAddresses = getOpcodeAddresses(code);
const contractAddresses = await getOpcodeContractAddresses(code, provider);
```

## Get accessible IPFS URI

Supported formats:

- QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
- /ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
- ://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
- ipfs://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o/0.json
- https://ipfs.io/ipfs/QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o
- http://bafybeie5gq4jxvzmsym6hjlwxej4rwdoxt7wadqvmmwbqi7r27fclha2va.dweb.link
- https://site.com/test.json#234?a=3

```ts
import { containsLink, normalizeMetadataUri } from 'forta-helpers';

const uri = '://QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o/0.json';
const isLink = containsLink(uri);
if (!isLink) {
  const url = normalizeMetadataUri(uri);
  const data = await axios.get(url);
}
```

## Parallel execution by multiple providers

This queue allows tasks to be performed concurrently by multiple providers.
Each task is assigned a unique provider.

```ts
import { providersQueue } from 'forta-helpers';

type Task = {
  account: string;
  blockNumber: number;
};

const provider1 = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth');
const provider2 = new ethers.providers.JsonRpcProvider('https://ethereum.publicnode.com');
const provider3 = new ethers.providers.JsonRpcProvider('https://1rpc.io/eth');

const q = providersQueue<Task, ethers.providers.JsonRpcProvider>(
  async (task, provider) => {
    const balance = await provider.getBalance(task.account, task.blockNumber);
    // do some work here
  },
  [provider1, provider2, provider3],
);

// add your tasks

q.push({
  account: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  blockNumber: 17387564,
});
q.push({
  account: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5',
  blockNumber: 17387564,
});
// ... add as much as you need

// and wait for them all to be fulfilled

await q.finish();
```

## Get addresses from contract storage

```ts
import { getStorageAddresses, getStorageContractAddresses } from 'forta-helpers';

// Check up to 20 contract variables and extract all the addresses from there
const allAddresses = await getStorageAddresses(
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  provider,
  20,
);

// Check up to 20 internal contract variables, extract all the addresses from there and check if they are contracts
const contractAddresses = await getStorageContractAddresses(
  '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  provider,
  20,
);
```

## File Storage

```ts
import { JsonStorage } from 'forta-helpers';

type BotState = {
  transactionCount: number;
  lastTransactionHash: string;
};

const stateStorage = new JsonStorage<BotState>('./data', 'state.json');

await stateStorage.write({
  transactionCount: 20,
  lastTransactionHash: '0xHASH',
});

const state = await stateStorage.read();
```

```ts
import { CsvStorage } from 'forta-helpers';

type Transaction = {
  hash: string;
  blockNumber: number;
};

const transactionStorage = new CsvStorage<Transaction>(
  './data',
  'transactions.csv',
  // preparing data for reading
  (v) => ({ ...v, blockNumber: Number(v.blockNumber) }),
  // preparing data for writing
  (v) => v,
);

await transactionStorage.write([
  { hash: '0xHASH1', blockNumber: 1 },
  { hash: '0xHASH2', blockNumber: 2 },
]);

const transactions = await transactionStorage.read();
```

## Filter burn-address

Checks for the presence in the list of known burn-addresses, as well as the frequent repetition of "0" in the address.

```ts
import { isBurnAddress } from 'forta-helpers';

if (
  isBurnAddress('0xdead000000000000000042069420694206942069') ||
  isBurnAddress('0x0123456789012345678901234567890123456789') ||
  isBurnAddress('0x000000000000000000000000000000000000dEaD')
) {
  // do some work
}
```

## Retry

```ts
import { retry } from 'forta-helpers';

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth');
const balance = await retry(() => provider.getBalance('0xdAC17F958D2ee523a2206206994597C13D831ec7'), {
  // wait 15s between attempts
  wait: 15 * 1000,
  // try to call 3 times
  attempts: 3,
});
```

## Do some work at a given interval

```ts
import { createTicker } from 'forta-helpers';

const isTimeToSync = createTicker(5 * 60 * 1000);

async function handleTransaction(txEvent: TransactionEvent) {
  // by default, always true on the first call
  if(isTimeToSync(txEvent.timestamp)) {
    // sync
  }

  return [];
}
```
