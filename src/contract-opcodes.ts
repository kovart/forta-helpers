import { EVM } from 'evm';
import { ethers } from 'forta-agent';

function getOpcodes(bytecode: string) {
  const evm = new EVM(bytecode);

  try {
    return evm.getOpcodes();
  } catch (e) {
    return [];
  }
}

export function getOpcodeAddresses(bytecode: string) {
  const opcodes = getOpcodes(bytecode);

  const addressSet = new Set<string>();

  for (const opcode of opcodes) {
    const str = opcode.pushData?.toString('hex') || '';
    if (str.length === 40) {
      const addr = '0x' + str;
      addressSet.add(addr.toString());
    }
  }

  return [...addressSet].filter(
    (a) => a !== ethers.constants.AddressZero && a !== '0xffffffffffffffffffffffffffffffffffffffff',
  );
}

export async function getOpcodeContractAddresses(
  bytecode: string,
  provider: ethers.providers.BaseProvider,
  blockNumber?: string | number,
) {
  let addresses: string[] = getOpcodeAddresses(bytecode);

  let codes: string[] = [];

  if (provider instanceof ethers.providers.JsonRpcBatchProvider) {
    codes = await Promise.all(addresses.map((a) => provider.getCode(a, blockNumber)));
  } else {
    for (const address of addresses) {
      codes.push(await provider.getCode(address, blockNumber));
    }
  }

  return addresses.filter((address, i) => codes[i] !== '0x');
}
