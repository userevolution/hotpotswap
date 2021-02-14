pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../utility/Types.sol";

interface IPerpetual {


    function status() external view returns (Types.Status);

    function positions(address trader) external view returns (Types.PositionData memory);

    function socialLossPerContracts() external view returns (int256[3] memory);

    function socialLossPerContract(Types.Side) external view returns (int256);

}