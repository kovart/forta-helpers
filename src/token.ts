import { utils, providers, Contract } from 'ethers';

import Erc20Abi from './abi/erc20.json';
import Erc165Abi from './abi/erc165.json';
import Erc721Abi from './abi/erc721.json';
import Erc1155Abi from './abi/erc1155.json';

export enum TokenStandard {
  Erc20 = 20,
  Erc721 = 721,
  Erc1155 = 1155,
}

export const erc165Iface = new utils.Interface(Erc165Abi);
export const erc20Iface = new utils.Interface(Erc20Abi);
export const erc721Iface = new utils.Interface(Erc721Abi);
export const erc1155Iface = new utils.Interface(Erc1155Abi);

const INTERFACE_ID_BY_TYPE = {
  [TokenStandard.Erc20]: '0x36372b07',
  [TokenStandard.Erc721]: '0x5b5e139f',
  [TokenStandard.Erc1155]: '0xd9b67a26',
};

function isCodeCompatible(
  code: string,
  iface: utils.Interface,
  items: { functions?: string[]; events?: string[] },
): boolean {
  // Get hashes and remove 0x from the beginning
  const functionSignatures = (items.functions || []).map((name) => iface.getSighash(name).slice(2));
  const eventSignatures = (items.events || []).map((name) => iface.getEventTopic(name).slice(2));

  // check if code includes all the signatures
  return ![...functionSignatures, ...eventSignatures].find((hash) => !code.includes(hash));
}

export async function identifyTokenInterface(
  contractAddress: string,
  provider: providers.JsonRpcProvider,
  logger: (...args: any) => void = () => {},
): Promise<TokenStandard | null> {
  // First of all, let's check with erc165 as it's the most accurate way

  logger('Trying to identify interface with the ERC165');

  const erc165Contract = new Contract(contractAddress, erc165Iface, provider);

  try {
    const tokenInterface = (
      await Promise.all(
        [TokenStandard.Erc1155, TokenStandard.Erc721, TokenStandard.Erc20].map(
          async (standard) => ({
            standard: standard,
            isSupported: await erc165Contract.supportsInterface(INTERFACE_ID_BY_TYPE[standard]),
          }),
        ),
      )
    ).find((v) => v.isSupported);

    if (tokenInterface) return tokenInterface.standard;
  } catch {
    // erc165 is not supported
  }

  // Let's check by function and event signatures inside the contract bytecode.
  // This method works if the contract doesn't use proxies.

  logger('Trying to identify interface using contract bytecode');

  const code = await provider.getCode(contractAddress);

  // https://eips.ethereum.org/EIPS/eip-20
  const isErc20 = isCodeCompatible(code, erc20Iface, {
    functions: ['balanceOf', 'allowance', 'approve', 'transfer', 'transferFrom', 'totalSupply'],
    events: ['Transfer', 'Approval'],
  });
  if (isErc20) {
    if (
      isCodeCompatible(code, erc20Iface, { functions: ['symbol'] }) ||
      isCodeCompatible(code, erc20Iface, { functions: ['name'] })
    ) {
      return TokenStandard.Erc20;
    }

    return null;
  }

  // https://eips.ethereum.org/EIPS/eip-721
  // 'safeTransferFrom' is ignored due to its overloading
  const isErc721 = isCodeCompatible(code, erc721Iface, {
    functions: [
      'balanceOf',
      'ownerOf',
      'transferFrom',
      'approve',
      'setApprovalForAll',
      'getApproved',
      'isApprovedForAll',
    ],
    events: ['Transfer', 'Approval', 'ApprovalForAll'],
  });
  if (isErc721) {
    if (
      isCodeCompatible(code, erc721Iface, { functions: ['symbol'] }) ||
      isCodeCompatible(code, erc721Iface, { functions: ['name'] })
    ) {
      return TokenStandard.Erc721;
    }

    return null;
  }

  // https://eips.ethereum.org/EIPS/eip-1155
  // For unknown reasons, signature of 'balanceOf' cannot be found in the bytecode of ERC1155 contracts
  const isErc1155 = isCodeCompatible(code, erc1155Iface, {
    functions: [
      'safeTransferFrom',
      'safeBatchTransferFrom',
      'balanceOfBatch',
      'setApprovalForAll',
      'isApprovedForAll',
    ],
    events: ['TransferSingle', 'TransferBatch', 'ApprovalForAll'],
  });

  if (isErc1155) return TokenStandard.Erc1155;

  logger('Trying to identify ERC20 interface using duck typing');

  try {
    const address1 = utils.hexZeroPad('0x1', 20);
    const address2 = utils.hexZeroPad('0x2', 20);
    const erc20contract = new Contract(contractAddress, erc20Iface, provider);
    await Promise.all([
      erc20contract.balanceOf(address1),
      erc20contract.totalSupply(),
      erc20contract.allowance(address1, address2),
    ]);

    // success if at least one function is fulfilled
    await Promise.any([erc20contract.symbol(), erc20contract.name()]);

    return TokenStandard.Erc20;
  } catch (e) {
    // not erc20 interface
  }

  return null;
}

export { Erc20Abi };
export { Erc165Abi };
export { Erc721Abi };
export { Erc1155Abi };
