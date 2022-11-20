// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AccessNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    mapping(address => uint256) public tokenOf;

    struct Guardian {
        address addr;
        bool enabled;
    }

    struct ExternalTransfer {
        address oldAddr;
        address newAddr;
        uint256 confirmations;
        uint256 confirmationsRequired;
        bool transferCompleted;
    }

    event GuardianAssigned(address indexed guardian, address indexed tokenOwner);

    mapping(uint256 => Guardian[]) public guardiansOfToken;
    mapping(uint256 => ExternalTransfer[]) public externalTransfersOfToken;

    constructor() ERC721("AccessNFT", "ACCESS") {
        _tokenIds.increment();
    }

    function mint() external returns (uint256) {
        require(tokenOf[msg.sender] == 0, "AccessNFT: Should not own a token already");
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        tokenOf[msg.sender] = newTokenId;

        _tokenIds.increment();
        return newTokenId;
    }

    function assignGuardian(address _newGuardian) external {
        require(tokenOf[msg.sender] != 0, "AccessNFT: Should own a token");

        Guardian memory newGuardian = Guardian(_newGuardian, true);
        guardiansOfToken[tokenOf[msg.sender]].push(newGuardian);

        emit GuardianAssigned(_newGuardian, msg.sender);
    }

    function getMyGuardians()
        external
        view
        returns (Guardian[] memory)
    {
        return guardiansOfToken[tokenOf[msg.sender]];
    }

    function isGuardian(address _tokenHolder, address _guardian) public view returns (bool) {
        uint256 tokenId = tokenOf[_tokenHolder];
        for (uint256 i = 0; i < guardiansOfToken[tokenId].length; i++) {
            Guardian memory guardian = guardiansOfToken[tokenId][i];
            if (guardian.addr == _guardian && guardian.enabled == true) {
                return true;
            }
        }
        return false;
    }

    function getOrCreateExternalTransfer(address _old, address _new) internal returns (uint256) {
        uint256 tokenId = tokenOf[_old];
        uint256 numTransfers = externalTransfersOfToken[tokenId].length;
        for (uint256 i = 0; i < numTransfers; i++) {
            ExternalTransfer memory et = externalTransfersOfToken[tokenId][i];
            if (!et.transferCompleted) {
                if (et.oldAddr == _old && et.newAddr == _new) {
                    return i;
                }
            }
        }

        ExternalTransfer memory newET = ExternalTransfer(_old, _new, 0, 2, false);
        externalTransfersOfToken[tokenId].push(newET);
        return numTransfers;
    }

    function transferFrom(address _old, address _new, uint256 _tokenId) public override {
        require(isGuardian(_old, msg.sender), "AccessNFT: caller is not guardian");

        ExternalTransfer storage et = externalTransfersOfToken[tokenOf[_old]][getOrCreateExternalTransfer(_old, _new)];
        require(!et.transferCompleted, "AccessNFT: already transferred");

        et.confirmations += 1;
        if (et.confirmations == et.confirmationsRequired) {
            et.transferCompleted = true;
            _transfer(_old, _new, _tokenId);
        }
    }

    // wrapper around transferFrom so that there is no need to known token id
    function recoverTokenTo(address _old, address _new) external {
        transferFrom(_old, _new, tokenOf[_old]);
    }
}
