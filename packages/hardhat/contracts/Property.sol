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

    struct Booking {
        address renter;
        uint256 price;
        // add start and end date
        bool paid;
        bool available;
    }

    mapping(uint256 => Booking) _bookingById;

    event Minted(uint256 id, address owner);
    event Rented(uint256 id, address renter, string action);

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

    function getBooking(uint256 _propertyId)
        external
        view
        returns (Booking memory)
    {
        Booking memory book = _getBooking(_propertyId);
        console.log("owner: %s, renter: %s", ownerOf(_propertyId), book.renter);
        require(
            msg.sender == ownerOf(_propertyId),
            "only property owner can return the booking"
        );
        return _getBooking(_propertyId);
    }

    // TODO: make it payable
    function createBooking(uint256 _propertyId) external {
        // check if exists and booking allowed
        _bookingById[_propertyId] = Booking({
            renter: msg.sender,
            price: 0 ether,
            paid: false,
            available: false
        });
        emit Rented(_propertyId, msg.sender, "booking");
    }

    function cancelBooking(uint256 _propertyId) external {
        require(
            msg.sender == ownerOf(_propertyId),
            "only property owner can cancel the booking"
        );
        _freeBooking(_propertyId);
    }

    function bookingAllowed(uint256 _propertyId) external view returns (bool) {
        Booking memory book = _getBooking(_propertyId);
        return book.available;
    }

    function reserveProperty(uint256 _propertyId) external {
        require(
            msg.sender == ownerOf(_propertyId),
            "only property owner can cancel the booking"
        );
        _bookingById[_propertyId] = Booking({
            renter: msg.sender,
            price: 0 ether,
            paid: true,
            available: false
        });
        emit Rented(_propertyId, msg.sender, "reserve");
    }

    function propertyReserved(uint256 _propertyId)
        external
        view
        returns (bool)
    {
        Booking memory book = _getBooking(_propertyId);
        return book.available == false && book.renter == ownerOf(_propertyId);
    }

    function toggleStatus(uint256 _propertyId) external {
        require(
            msg.sender == ownerOf(_propertyId),
            "only property owner can return the booking"
        );
        Booking storage book = _bookingById[_propertyId];
        book.available = !book.available;
        emit Rented(_propertyId, msg.sender, book.available ? "allow" : "deny");
    }

    // internal functions

    function _freeBooking(uint256 _propertyId) internal {
        _bookingById[_propertyId] = Booking({
            renter: address(0),
            price: 0 ether,
            paid: false,
            available: false
        });
        emit Rented(_propertyId, msg.sender, "free");
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
