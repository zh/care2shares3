//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Property is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Pausable,
    Ownable
{
    using Strings for uint256;
    using Strings for uint8;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    enum State {
        Active, // A booking has been created by the user waiting for confirm.
        Confirmed, // The owner has confirmed and is waiting to receive a deposit.
        Paid, // The user paid a deposit and the booking has successfully concluded.
        Reserved, // The property is reserved by the owner
        Inactive // A booking has been removed by the owner's request.
    }

    struct Booking {
        address renter;
        // add start and end date
        uint256 startDate;
        uint256 endDate;
        State state;
        uint256 price;
    }

    mapping(uint256 => Booking) _bookingById; // property <-> bookings map

    modifier isPropOwner(uint256 _propertyId) {
        require(
            msg.sender == ownerOf(_propertyId),
            "Only owner can call this function."
        );
        _;
    }

    modifier inState(uint256 _propertyId, State state) {
        require(
            state == _bookingById[_propertyId].state,
            "Booking is not in valid state."
        );
        _;
    }

    modifier isRenter(uint256 _propertyId) {
        require(
            msg.sender == _bookingById[_propertyId].renter,
            "Only renter can call this function."
        );
        _;
    }

    modifier inCancelPeriod(uint256 _propertyId) {
        require(
            block.timestamp + 7 days < _bookingById[_propertyId].startDate,
            "Booking cannot be canceled."
        );
        _;
    }

    event Minted(uint256 id, address owner);
    event Booked(uint256 id, address renter, string action);

    constructor() ERC721("Care2Share Properties", "CARE2SHARE") {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, string memory websiteId)
        public
        returns (uint256)
    {
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId);
        super._setTokenURI(tokenId, websiteId);
        _freeBooking(tokenId);
        emit Minted(tokenId, to);
        return tokenId;
    }

    // TODO: make this work with multiply bookings
    function getBooking(uint256 _propertyId)
        external
        view
        returns (Booking memory)
    {
        return _getBooking(_propertyId);
    }

    // created by the renter
    function createBooking(
        uint256 _propertyId,
        uint256 _startDate,
        uint256 _endDate
    ) external inState(_propertyId, State.Inactive) {
        require(_endDate >= _startDate, "end date after start date");
        // check price
        _bookingById[_propertyId] = Booking({
            renter: msg.sender,
            startDate: _startDate,
            endDate: _endDate,
            state: State.Active,
            price: 0 ether
        });
        emit Booked(_propertyId, msg.sender, "booking");
    }

    function cancelBooking(uint256 _propertyId)
        external
        inCancelPeriod(_propertyId)
        isRenter(_propertyId)
    {
        _freeBooking(_propertyId);
    }

    function rejectBooking(uint256 _propertyId)
        external
        isPropOwner(_propertyId)
    {
        _freeBooking(_propertyId);
    }

    function confirmBooking(uint256 _propertyId, uint256 _price)
        external
        isPropOwner(_propertyId)
        inState(_propertyId, State.Active)
    {
        require(_price > 0, "Price should be set to > 0");
        _bookingById[_propertyId].state = State.Confirmed;
        _bookingById[_propertyId].price = _price;
        emit Booked(_propertyId, msg.sender, "confirmed");
    }

    function bookingAllowed(uint256 _propertyId) external view returns (bool) {
        Booking memory book = _getBooking(_propertyId);
        return book.state == State.Inactive;
    }

    function bookingConfirmed(uint256 _propertyId)
        external
        view
        returns (bool)
    {
        Booking memory book = _getBooking(_propertyId);
        return book.state == State.Confirmed;
    }

    // TODO: make this payable
    function payBooking(uint256 _propertyId)
        external
        inState(_propertyId, State.Confirmed)
    {
        _bookingById[_propertyId].state = State.Paid;
        emit Booked(_propertyId, msg.sender, "paid");
    }

    // maybe only booking owner?
    function bookingPaid(uint256 _propertyId) external view returns (bool) {
        Booking memory book = _getBooking(_propertyId);
        return book.state == State.Paid;
    }

    function reserveProperty(
        uint256 _propertyId,
        uint256 _startDate,
        uint256 _endDate
    ) external isPropOwner(_propertyId) {
        require(_endDate >= _startDate, "end date after start date");
        Booking memory book = _getBooking(_propertyId);
        require(
            book.state != State.Active && book.state != State.Confirmed,
            "property is already rented"
        );
        _bookingById[_propertyId] = Booking({
            renter: msg.sender,
            startDate: _startDate,
            endDate: _endDate,
            state: State.Reserved,
            price: 0 ether
        });
        emit Booked(_propertyId, msg.sender, "reserved");
    }

    function propertyReserved(uint256 _propertyId)
        external
        view
        returns (bool)
    {
        Booking memory book = _getBooking(_propertyId);
        return book.state == State.Reserved;
    }

    // internal functions

    function _freeBooking(uint256 _propertyId) internal {
        _bookingById[_propertyId] = Booking({
            renter: address(0),
            startDate: block.timestamp,
            endDate: block.timestamp + 1 days,
            state: State.Inactive,
            price: 0 ether
        });
        emit Booked(_propertyId, msg.sender, "free");
    }

    function _getBooking(uint256 _propertyId)
        internal
        view
        returns (Booking memory)
    {
        Booking memory book = _bookingById[_propertyId];
        return book;
    }

    // The following functions are overrides required by Solidity.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
