// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./IRent.sol";

contract Rent is IRent {
    Contract[] contracts;
    mapping(address => uint256[]) contractMap; // user address -> contract IDs
    mapping(uint256 => address[]) renterMap; // contract Ids -> renter addresses
    mapping(address => uint256[]) renterContractMap; // renter address -> contract Ids

    address[] allLandlords;
    address[] allOwners;

    // events
    event ContractCreated(uint256 indexed id);
    event AppliedContract(uint256 indexed id, address indexed renter);
    event ContractApproved(uint256 indexed id, address indexed landlord);
    event DepositReceived(
        uint256 indexed id,
        address indexed owner,
        address indexed landlord
    );

    modifier isOwner(uint256 contractId) {
        require(
            msg.sender == contracts[contractId].owner,
            "Only owner can call this function."
        );
        _;
    }

    modifier isLandlord(uint256 contractId) {
        require(
            msg.sender == contracts[contractId].landlord,
            "Only landlord can call this function."
        );
        _;
    }

    modifier isAdmin() {
        require(
            msg.sender == 0x12Fb1Bd0Dfee8f2f8E7aeBC1aA5830DEFcb404c3,
            "Only admin user can call this function."
        );
        _;
    }

    modifier inState(uint256 contractId, State state) {
        require(
            state == contracts[contractId].state,
            "Contract is not in valid state."
        );
        _;
    }

    constructor() {}

    function addContract(
        uint256 startDate,
        uint256 endDate,
        uint256 propertyId,
        uint256 price
    ) public {
        require(
            startDate < endDate || endDate == 0,
            "End date should be null or later than start date."
        );

        uint256 id = contracts.length;
        contracts.push(
            Contract({
                contractId: id,
                owner: msg.sender,
                landlord: address(0),
                startDate: startDate,
                endDate: endDate,
                propertyId: propertyId,
                price: price,
                state: State.Active
            })
        );
        contractMap[msg.sender].push(id);

        bool doesListContains = false;

        for (uint256 i = 0; i < allOwners.length; i++) {
            if (allOwners[i] == msg.sender) {
                doesListContains = true;
                break;
            }
        }

        if (!doesListContains) {
            allOwners.push(msg.sender);
        }

        emit ContractCreated(id);
    }

    function getContractById(uint256 id)
        public
        view
        override
        returns (Contract memory)
    {
        return contracts[id];
    }

    function getContractsByState(State state)
        external
        view
        override
        returns (Contract[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < contracts.length; i++) {
            if (contracts[i].state == state) {
                count++;
            }
        }

        Contract[] memory result = new Contract[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < contracts.length; i++) {
            if (contracts[i].state == state) {
                result[j] = contracts[i];
                j++;
            }
        }

        return result;
    }

    function getContractsByAddress(address _address)
        external
        view
        override
        returns (Contract[] memory)
    {
        uint256[] memory addresses = contractMap[_address];
        Contract[] memory result = new Contract[](addresses.length);

        for (uint256 i = 0; i < addresses.length; i++) {
            result[i] = contracts[addresses[i]];
        }
        return result;
    }

    function getAllContracts()
        external
        view
        override
        returns (Contract[] memory)
    {
        return contracts;
    }

    function getAppliedContractIds(address _address)
        external
        view
        returns (uint256[] memory)
    {
        return renterContractMap[_address];
    }

    function acceptRent(uint256 contractId, address _address)
        external
        override
        isOwner(contractId)
    {
        contracts[contractId].state = State.Approved;
        contracts[contractId].landlord = _address;

        delete renterMap[contractId];
        // TODO remove the contract from renterContractMap

        contractMap[_address].push(contractId);

        bool doesListContains = false;

        for (uint256 i = 0; i < allLandlords.length; i++) {
            if (allLandlords[i] == _address) {
                doesListContains = true;
            }
        }

        if (!doesListContains) {
            allLandlords.push(_address);
        }

        emit ContractApproved(contractId, _address);
    }

    function applyForContract(uint256 contractId) external override {
        require(
            msg.sender != contracts[contractId].owner,
            "Owner can't apply."
        );
        renterMap[contractId].push(msg.sender);
        renterContractMap[msg.sender].push(contractId);
        emit AppliedContract(contractId, msg.sender);
    }

    function getApplicants(uint256 contractId)
        external
        view
        override
        isOwner(contractId)
        returns (address[] memory)
    {
        return renterMap[contractId];
    }

    function payDeposit(uint256 contractId)
        external
        payable
        override
        isLandlord(contractId)
        inState(contractId, State.Approved)
    {
        //require(msg.value == contracts[contractId].price, "Price is incorrect.");

        payable(contracts[contractId].owner).transfer(msg.value);
        contracts[contractId].state = State.Confirmed;

        emit DepositReceived(
            contractId,
            contracts[contractId].owner,
            msg.sender
        );
    }

    function getLandlords() external view isAdmin returns (address[] memory) {
        return allLandlords;
    }

    function getOwners() external view isAdmin returns (address[] memory) {
        return allOwners;
    }
}