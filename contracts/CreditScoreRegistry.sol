// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CreditScoreRegistry
 * @dev Smart contract for storing credit scores on Ethereum blockchain
 * @notice This contract stores immutable credit score records with IPFS integration
 */
contract CreditScoreRegistry is Ownable, ReentrancyGuard, Pausable {
    
    // Struct to store credit record data
    struct CreditRecord {
        uint256 score;              // Credit score (300-850)
        bytes32 dataHash;           // SHA256 hash of complete data
        uint256 timestamp;          // Block timestamp
        string ipfsHash;            // IPFS hash for detailed data
        uint256 blockNumber;        // Block number when recorded
    }
    
    // Events
    event CreditScoreUpdated(
        address indexed userAddress,
        uint256 creditScore,
        bytes32 dataHash,
        uint256 timestamp,
        string ipfsHash,
        uint256 blockNumber
    );
    
    event AuthorizedUpdaterAdded(address indexed updater);
    event AuthorizedUpdaterRemoved(address indexed updater);
    
    // Mappings
    mapping(address => CreditRecord[]) public userCreditHistory;
    mapping(address => bool) public authorizedUpdaters;
    mapping(bytes32 => bool) public usedDataHashes;
    
    // State variables
    uint256 public totalRecords;
    uint256 public constant MIN_CREDIT_SCORE = 300;
    uint256 public constant MAX_CREDIT_SCORE = 850;
    
    // Modifiers
    modifier onlyAuthorizedUpdater() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized to update credit scores");
        _;
    }
    
    modifier validCreditScore(uint256 _score) {
        require(_score >= MIN_CREDIT_SCORE && _score <= MAX_CREDIT_SCORE, "Invalid credit score range");
        _;
    }
    
    modifier validDataHash(bytes32 _dataHash) {
        require(_dataHash != bytes32(0), "Data hash cannot be empty");
        require(!usedDataHashes[_dataHash], "Data hash already used");
        _;
    }
    
    constructor() {
        // Add contract deployer as authorized updater
        authorizedUpdaters[msg.sender] = true;
        emit AuthorizedUpdaterAdded(msg.sender);
    }
    
    /**
     * @dev Update credit score for a user
     * @param userAddress The user's wallet address
     * @param score The credit score (300-850)
     * @param dataHash SHA256 hash of the complete credit data
     * @param ipfsHash IPFS hash containing detailed credit report
     */
    function updateCreditScore(
        address userAddress,
        uint256 score,
        bytes32 dataHash,
        string memory ipfsHash
    ) 
        external 
        onlyAuthorizedUpdater 
        nonReentrant 
        whenNotPaused
        validCreditScore(score)
        validDataHash(dataHash)
    {
        require(userAddress != address(0), "Invalid user address");
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        
        // Create new credit record
        CreditRecord memory newRecord = CreditRecord({
            score: score,
            dataHash: dataHash,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            blockNumber: block.number
        });
        
        // Add to user's credit history
        userCreditHistory[userAddress].push(newRecord);
        
        // Mark data hash as used
        usedDataHashes[dataHash] = true;
        
        // Increment total records
        totalRecords++;
        
        // Emit event
        emit CreditScoreUpdated(
            userAddress,
            score,
            dataHash,
            block.timestamp,
            ipfsHash,
            block.number
        );
    }
    
    /**
     * @dev Get credit history for a user
     * @param userAddress The user's wallet address
     * @return Array of credit records
     */
    function getCreditHistory(address userAddress) 
        external 
        view 
        returns (CreditRecord[] memory) 
    {
        return userCreditHistory[userAddress];
    }
    
    /**
     * @dev Get latest credit score for a user
     * @param userAddress The user's wallet address
     * @return Latest credit record
     */
    function getLatestCreditScore(address userAddress) 
        external 
        view 
        returns (CreditRecord memory) 
    {
        require(userCreditHistory[userAddress].length > 0, "No credit history found");
        uint256 lastIndex = userCreditHistory[userAddress].length - 1;
        return userCreditHistory[userAddress][lastIndex];
    }
    
    /**
     * @dev Get credit history count for a user
     * @param userAddress The user's wallet address
     * @return Number of credit records
     */
    function getCreditHistoryCount(address userAddress) 
        external 
        view 
        returns (uint256) 
    {
        return userCreditHistory[userAddress].length;
    }
    
    /**
     * @dev Verify if a data hash exists
     * @param dataHash The data hash to verify
     * @return True if hash exists
     */
    function verifyDataHash(bytes32 dataHash) 
        external 
        view 
        returns (bool) 
    {
        return usedDataHashes[dataHash];
    }
    
    /**
     * @dev Add authorized updater
     * @param updater Address to authorize
     */
    function addAuthorizedUpdater(address updater) 
        external 
        onlyOwner 
    {
        require(updater != address(0), "Invalid updater address");
        require(!authorizedUpdaters[updater], "Already authorized");
        
        authorizedUpdaters[updater] = true;
        emit AuthorizedUpdaterAdded(updater);
    }
    
    /**
     * @dev Remove authorized updater
     * @param updater Address to remove authorization
     */
    function removeAuthorizedUpdater(address updater) 
        external 
        onlyOwner 
    {
        require(authorizedUpdaters[updater], "Not authorized");
        require(updater != owner(), "Cannot remove owner");
        
        authorizedUpdaters[updater] = false;
        emit AuthorizedUpdaterRemoved(updater);
    }
    
    /**
     * @dev Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get contract statistics
     * @return Total number of records stored
     */
    function getContractStats() 
        external 
        view 
        returns (uint256) 
    {
        return totalRecords;
    }
}
