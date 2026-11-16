// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAqua} from "@1inch/aqua/src/interfaces/IAqua.sol";
import {SwapQuery, SwapRegisters} from "@1inch/swap-vm/src/libs/VM.sol";

import {PegloBackstopPricing} from "./PegloBackstopPricing.sol";

/// @notice Backstop pricing for both venues: Extruction on the official router, price() for PegloRouter.
contract PegloBackstop {
    IAqua public immutable AQUA;

    constructor(address aqua) {
        AQUA = IAqua(aqua);
    }

    function extruction(
        bool,
        uint256 nextPC,
        SwapQuery calldata query,
        SwapRegisters calldata swap,
        bytes calldata args,
        bytes calldata
    ) external view returns (uint256, uint256, SwapRegisters memory) {
        return (nextPC, 0, PegloBackstopPricing.price(AQUA, msg.sender, query, swap, args));
    }

    function price(SwapQuery calldata query, SwapRegisters calldata swap, bytes calldata args)
        external
        view
        returns (SwapRegisters memory)
    {
        return PegloBackstopPricing.price(AQUA, msg.sender, query, swap, args);
    }
}
