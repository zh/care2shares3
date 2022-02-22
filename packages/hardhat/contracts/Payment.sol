// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./IRent.sol";
import "./Rent.sol";

contract Payment {
    enum State {
        Pending,
        Paid,
        Cancelled
    }

    struct Bill {
        uint256 billId;
        uint256 contractId;
        uint256 price;
        uint256 billingDate;
        address payee;
        address payer;
        State state;
    }

    IRent internal rent;
    // TODO: fix this after deploy
    address internal rentContract;

    Bill[] bills;

    mapping(address => uint256[]) userAddressBillMap; // user address => bill IDs
    mapping(uint256 => uint256[]) contractBillMap; // contract IDs => bill IDs

    modifier isContractValid(uint256 contractId) {
        IRent.Contract memory _contract = rent.getContractById(contractId);
        require(
            _contract.state == IRent.State.Confirmed,
            "The contract is in an invalid state."
        );
        _;
    }

    // events
    event BillCreated(uint256 indexed id);
    event BillPaid(uint256 indexed id);
    event AutoPaymentSet(address payee);

    constructor(address _rentContract) {
        rentContract = _rentContract;
        rent = Rent(rentContract);
    }

    function createBill(uint256 contractId) external {
        IRent.Contract memory _contract = rent.getContractById(contractId);

        require(
            block.timestamp < _contract.endDate,
            "The contract has already ended."
        );
        require(
            _contract.state == IRent.State.Confirmed,
            "The contract is in an invalid state."
        );

        uint256 billingDate = _contract.startDate +
            (1 + contractBillMap[contractId].length) *
            30 days;

        uint256 id = bills.length;
        bills.push(
            Bill({
                billId: id,
                contractId: contractId,
                price: _contract.price,
                billingDate: billingDate,
                state: State.Pending,
                payee: _contract.owner,
                payer: _contract.renter
            })
        );

        contractBillMap[contractId].push(id);
        userAddressBillMap[_contract.renter].push(id);

        emit BillCreated(id);
    }

    function getBillsByAddress(address _address)
        external
        view
        returns (Bill[] memory)
    {
        uint256[] memory addresses = userAddressBillMap[_address];
        Bill[] memory result = new Bill[](addresses.length);

        for (uint256 i = 0; i < addresses.length; i++) {
            result[i] = bills[addresses[i]];
        }

        return result;
    }

    function getBillsByContractId(uint256 contractId)
        external
        view
        returns (Bill[] memory)
    {
        uint256[] memory _bills = contractBillMap[contractId];
        Bill[] memory result = new Bill[](_bills.length);

        for (uint256 i = 0; i < _bills.length; i++) {
            result[i] = bills[_bills[i]];
        }

        return result;
    }

    function payBill(uint256 billId) public payable {
        require(
            bills[billId].state == State.Pending,
            "This bill was already paid or cancelled."
        );
        require(
            bills[billId].payer.balance >= bills[billId].price,
            "Payer has not enough balance."
        );
        require(bills[billId].price == msg.value, "Price is incorrect.");

        bills[billId].state = State.Paid;
        payable(bills[billId].payee).transfer(msg.value);
        emit BillPaid(billId);
    }
}
