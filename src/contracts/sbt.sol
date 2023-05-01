// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract InterviewSBT is ERC721, ERC721URIStorage, ERC721Burnable, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant INTERVIEWER = keccak256("INTERVIEWER");

    string private interviewer_uri;
    address public owner ;

    Counters.Counter private _tokenIdCounter;
    mapping(address => bytes32) public hasAccessOf ;
    mapping(address => bool) public ownCandidateNFT;
    mapping(address => bool) public ownInterviewerNFT;



    constructor() ERC721("InterviewSBT", "ISBT") {
        _grantRole(OWNER_ROLE, msg.sender);
        owner = msg.sender ;
        hasAccessOf[msg.sender] = OWNER_ROLE ;
    }

    /*
    * @dev Buying a specific SBT for getting access to DAO
    */


    function mintToInterviewer(address to) public onlyRole(OWNER_ROLE){
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        ownInterviewerNFT[to] = true ; 
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, interviewer_uri);

    }

    function mintToCandidate(address to, string memory candidate_uri) public onlyRole(OWNER_ROLE){
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        ownCandidateNFT[to] = true ; 
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, candidate_uri);

    }

   /*
   * @dev Most important functions to allow user in other contracts 
   *      checking wether the address is startup owner or investor.
   */
   function isCandidate (address _operator) public view returns (bool){
     return ownCandidateNFT[_operator];
   }

    function isInterviewer (address _operator) public view returns (bool){
     return ownInterviewerNFT[_operator];
   }

   function isOwner (address _operator) public view returns (bool){
     return hasAccessOf[_operator] == OWNER_ROLE;
   }


   /*
   * @dev Change the Ownership
   */

   function changeOwnership (address _previousOwner , address _newOwner) external onlyRole(OWNER_ROLE){
       _revokeRole(OWNER_ROLE , _previousOwner ) ;
       owner = _newOwner ;
       _grantRole(OWNER_ROLE , _newOwner);
   }

   /*
   * @dev setting up the URI (dynamic for future as well) 
   */
   function setInterviewerURI (string memory _uri) external onlyRole(OWNER_ROLE){
       interviewer_uri = _uri;
   }

   /*
   * @dev setting up the URI (dynamic for future as well) 
   */
   function getInterviewerURI () external view returns (string memory){
      return interviewer_uri;
   }
   


    // The following functions are overrides required by Solidity.
    /*
    * @dev Incase member wants to leave the DAO
    */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
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
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

     //// Prevent transfers ////
    /**
     * @dev See {IERC721-transferFrom} of openzeppelin Contract
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        revert("Error: Soulbound tokens cannot be transferred.");
    }

    /**
     * @dev See {IERC721-transferFrom} of openzeppelin Contract
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        revert("Error: Soulbound tokens cannot be transferred.");
    }

    /**
     * @dev See {IERC721-transferFrom} of openzeppelin Contract
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public virtual override {
        revert("Error: Soulbound tokens cannot be transferred.");
    }
}