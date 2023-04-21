import { ethers } from 'forta-agent';

const CONTRACT_SLOT_ANALYSIS_DEPTH = 20;

export async function getStorageAddresses(
  address: string | undefined,
  provider: ethers.providers.BaseProvider,
  slotDepth = CONTRACT_SLOT_ANALYSIS_DEPTH,
  blockNumber?: string | number,
) {
  if (!address) return [];

  let slots: string[] = [];

  if (provider instanceof ethers.providers.JsonRpcBatchProvider) {
    slots = await Promise.all(
      Array.from(Array(slotDepth)).map((address, i) =>
        provider.getStorageAt(address, i, blockNumber),
      ),
    );
  } else {
    for (let i = 0; i < slotDepth; i++) {
      slots.push(await provider.getStorageAt(address, i, blockNumber));
    }
  }

  const addressSet = new Set<string>();
  for (const slot of slots) {
    if (slot === '0x0000000000000000000000000000000000000000000000000000000000000000') continue;
    addressSet.add(slot.slice(2, 42));
    addressSet.add(slot.slice(-40));
  }

  return [...addressSet].map((v) => '0x' + v).filter((v) => v !== ethers.constants.AddressZero);
}

export async function getStorageContractAddresses(
  address: string | undefined,
  provider: ethers.providers.BaseProvider,
  slotNumber = CONTRACT_SLOT_ANALYSIS_DEPTH,
  blockNumber?: string | number,
) {
  if (!address) return [];

  const addresses = await getStorageAddresses(address, provider, slotNumber, blockNumber);

  let codes: string[] = [];

  if (provider instanceof ethers.providers.JsonRpcBatchProvider) {
    codes = await Promise.all(addresses.map((address) => provider.getCode(address, blockNumber)));
  } else {
    for (const address of addresses) {
      codes.push(await provider.getCode(address, blockNumber));
    }
  }

  return addresses.filter((address, i) => codes[i] !== '0x');
}
