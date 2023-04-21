import { ethers } from 'forta-agent';

const CONTRACT_SLOT_ANALYSIS_DEPTH = 20;

export async function getStorageAddresses(
  address: string | undefined,
  provider: ethers.providers.StaticJsonRpcProvider,
  slotNumber = CONTRACT_SLOT_ANALYSIS_DEPTH,
  blockNumber?: string | number,
) {
  if (!address) return [];

  const batchProvider = new ethers.providers.JsonRpcBatchProvider(provider.connection);

  const slots = await Promise.all(
    Array.from(Array(slotNumber)).map((_, i) =>
      batchProvider.getStorageAt(address, i, blockNumber),
    ),
  );

  const addressSet = new Set<string>();
  for (const slot of slots) {
    if (slot === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
    addressSet.add(slot.slice(2, 42));
    addressSet.add(slot.slice(-40));
  }

  return [...addressSet].map((v) => '0x' + v);
}

export async function getStorageContractAddresses(
  address: string | undefined,
  provider: ethers.providers.StaticJsonRpcProvider,
  slotNumber = CONTRACT_SLOT_ANALYSIS_DEPTH,
  blockNumber?: string | number,
) {
  if (!address) return [];

  const addresses = (await getStorageAddresses(address, provider, slotNumber, blockNumber)).filter(
    (v) => v !== ethers.constants.AddressZero,
  );

  const batchProvider = new ethers.providers.JsonRpcBatchProvider(provider.connection);

  const codes = await Promise.all(
    addresses.map((address) => batchProvider.getCode(address, blockNumber)),
  );

  return addresses.filter((address, i) => codes[i] !== '0x');
}
