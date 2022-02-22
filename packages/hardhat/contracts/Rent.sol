// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./IRent.sol";

contract Rent is IRent {
    Contract[] contracts;
    mapping(address => uint256[]) contractMap; // user address -> contract IDs
    mapping(uint256 => address[]) renterMap; // contract Ids -> renter addresses
    mapping(address => uint256[]) renterContractMap; // renter address -> contract Ids

    address[] allRenters;
    address[] allOwners;

    // events
    event ContractCreated(uint256 indexed id);
    event AppliedContract(uint256 indexed id, address indexed renter);
    event ContractApproved(uint256 indexed id, address indexed owner);
    event ContractRejected(uint256 indexed id, address indexed owner);
    event DepositReceived(
        uint256 indexed id,
        address indexed renetr,
        address indexed owner
    );

    modifier isOwner(uint256 contractId) {
        require(
            msg.sender == contracts[contractId].owner,
            "Only owner can call this function."
        );
        _;
    }

    modifier isRenter(uint256 contractId) {
        require(
            msg.sender == contracts[contractId].renter,
            "Only landlord can call this function."
        );
        _;
    }

    modifier isAdmin() {
        require(
            msg.sender == 0x198CF609E94Dea0bD9d503778dbD5f501EACf597,
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
                renter: address(0),
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

    function approveContract(uint256 contractId, address _address)
        external
        override
        isOwner(contractId)
    {
        contracts[contractId].state = State.Approved;
        contracts[contractId].renter = _address;

        delete renterMap[contractId];
        // TODO remove the contract from renterContractMap

        contractMap[_address].push(contractId);

        bool doesListContains = false;

        for (uint256 i = 0; i < allRenters.length; i++) {
            if (allRenters[i] == _address) {
                doesListContains = true;
            }
        }

        if (!doesListContains) {
            allRenters.push(_address);
        }

        emit ContractApproved(contractId, _address);
    }

    function rejectContract(uint256 contractId, address _address)
        external
        override
        isOwner(contractId)
    {
        contracts[contractId].state = State.Active;
        contracts[contractId].renter = address(0);

        delete renterMap[contractId];

        emit ContractRejected(contractId, _address);
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

    function payContract(uint256 contractId)
        external
        payable
        override
        isRenter(contractId)
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

    function getRenters() external view isAdmin returns (address[] memory) {
        return allRenters;
    }

    function getOwners() external view isAdmin returns (address[] memory) {
        return allOwners;
    }
}
