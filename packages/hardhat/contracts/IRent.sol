// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRent {
    enum State {
        Active,
        Approved,
        Confirmed,
        Inactive
    }

    struct Contract {
        uint256 contractId;
        uint256 startDate;
        uint256 endDate;
        address owner;
        address landlord;
        uint256 propertyId;
        State state;
        uint256 price; // unit : wei (1 ether == 1e18 wei)
    }

    function getAllContracts() external view returns (Contract[] memory);

    function getContractById(uint256 id)
        external
        view
        returns (Contract memory);

    function getContractsByState(State state)
        external
        view
        returns (Contract[] memory);

    function getContractsByAddress(address _address)
        external
        view
        returns (Contract[] memory);

    function getApplicants(uint256 contractId)
        external
        view
        returns (address[] memory);

    function acceptRent(uint256 contractId, address _address) external;

    function applyForContract(uint256 contractId) external;

    function payDeposit(uint256 contractId) external payable;
}
