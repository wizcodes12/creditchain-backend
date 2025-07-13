// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title UserIdentityRegistry
 * @dev Smart contract for registering user identities on blockchain
 * @notice This contract stores hashed PII data for user verification
 */
contract UserIdentityRegistry is Ownable, ReentrancyGuard, Pausable {
    
    // Struct to store user profile data
    struct UserProfileOnChain {
        bool isRegistered;          // Registration status
        bytes32 panHash;            // SHA256 hash of PAN
        bytes32 aadhaarHash;        // SHA256 hash of Aadhaar
        address associatedAddress;  // Wallet address
        uint256 registrationTime;   // Registration timestamp
        uint256 blockNumber;        // Registration block number
    }
    
    // Events
    event UserRegistered(
        address indexed associatedAddress,
        bytes32 indexed panHash,
        bytes32 indexed aadhaarHash,
        uint256 timestamp,
        uint256 blockNumber
    );
    
    event AuthorizedRegistrarAdded(address indexed registrar);
    event AuthorizedRegistrarRemoved(address indexed registrar);
    
    // Mappings
    mapping(bytes32 => UserProfileOnChain) public registeredUsersByPan;
    mapping(bytes32 => UserProfileOnChain) public registeredUsersByAadhaar;
    mapping(address => UserProfileOnChain) public registeredUsersByAddress;
    mapping(address => bool) public authorizedRegistrars;
    
    // State variables
    uint256 public totalRegisteredUsers;
    
    // Modifiers
    modifier onlyAuthorizedRegistrar() {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized to register users");
        _;
    }
    
    modifier notAlreadyRegistered(address userAddress, bytes32 panHash, bytes32 aadhaarHash) {
        require(!registeredUsersByAddress[userAddress].isRegistered, "Address already registered");
        require(!registeredUsersByPan[panHash].isRegistered, "PAN already registered");
        require(!registeredUsersByAadhaar[aadhaarHash].isRegistered, "Aadhaar already registered");
        _;
    }
    
    constructor() {
        // Add contract deployer as authorized registrar
        authorizedRegistrars[msg.sender] = true;
        emit AuthorizedRegistrarAdded(msg.sender);
    }
    
    /**
     * @dev Register a new user
     * @param associatedAddress User's wallet address
     * @param panHash SHA256 hash of user's PAN
     * @param aadhaarHash SHA256 hash of user's Aadhaar
     */
    function registerUser(
        address associatedAddress,
        bytes32 panHash,
        bytes32 aadhaarHash
    ) 
        external 
        onlyAuthorizedRegistrar 
        nonReentrant 
        whenNotPaused
        notAlreadyRegistered(associatedAddress, panHash, aadhaarHash)
    {
        require(associatedAddress != address(0), "Invalid address");
        require(panHash != bytes32(0), "Invalid PAN hash");
        require(aadhaarHash != bytes32(0), "Invalid Aadhaar hash");
        
        // Create user profile
        UserProfileOnChain memory userProfile = UserProfileOnChain({
            isRegistered: true,
            panHash: panHash,
            aadhaarHash: aadhaarHash,
            associatedAddress: associatedAddress,
            registrationTime: block.timestamp,
            blockNumber: block.number
        });
        
        // Store in all mappings
        registeredUsersByAddress[associatedAddress] = userProfile;
        registeredUsersByPan[panHash] = userProfile;
        registeredUsersByAadhaar[aadhaarHash] = userProfile;
        
        // Increment counter
        totalRegisteredUsers++;
        
        // Emit event
        emit UserRegistered(
            associatedAddress,
            panHash,
            aadhaarHash,
            block.timestamp,
            block.number
        );
    }
    
    /**
     * @dev Check if user is registered by address
     * @param userAddress User's wallet address
     * @return True if user is registered
     */
    function isUserRegistered(address userAddress) 
        external 
        view 
        returns (bool) 
    {
        return registeredUsersByAddress[userAddress].isRegistered;
    }
    
    /**
     * @dev Check if PAN is registered
     * @param panHash SHA256 hash of PAN
     * @return True if PAN is registered
     */
    function isPanRegistered(bytes32 panHash) 
        external 
        view 
        returns (bool) 
    {
        return registeredUsersByPan[panHash].isRegistered;
    }
    
    /**
     * @dev Check if Aadhaar is registered
     * @param aadhaarHash SHA256 hash of Aadhaar
     * @return True if Aadhaar is registered
     */
    function isAadhaarRegistered(bytes32 aadhaarHash) 
        external 
        view 
        returns (bool) 
    {
        return registeredUsersByAadhaar[aadhaarHash].isRegistered;
    }
    
    /**
     * @dev Get user profile by address
     * @param userAddress User's wallet address
     * @return User profile data
     */
    function getUserProfile(address userAddress) 
        external 
        view 
        returns (UserProfileOnChain memory) 
    {
        require(registeredUsersByAddress[userAddress].isRegistered, "User not registered");
        return registeredUsersByAddress[userAddress];
    }
    
    /**
     * @dev Verify user identity by PAN and Aadhaar hashes
     * @param panHash SHA256 hash of PAN
     * @param aadhaarHash SHA256 hash of Aadhaar
     * @return User's associated address if verified
     */
    function verifyUserIdentity(bytes32 panHash, bytes32 aadhaarHash) 
        external 
        view 
        returns (address) 
    {
        UserProfileOnChain memory panProfile = registeredUsersByPan[panHash];
        UserProfileOnChain memory aadhaarProfile = registeredUsersByAadhaar[aadhaarHash];
        
        require(panProfile.isRegistered, "PAN not registered");
        require(aadhaarProfile.isRegistered, "Aadhaar not registered");
        require(panProfile.associatedAddress == aadhaarProfile.associatedAddress, "Identity mismatch");
        
        return panProfile.associatedAddress;
    }
    
    /**
     * @dev Add authorized registrar
     * @param registrar Address to authorize
     */
    function addAuthorizedRegistrar(address registrar) 
        external 
        onlyOwner 
    {
        require(registrar != address(0), "Invalid registrar address");
        require(!authorizedRegistrars[registrar], "Already authorized");
        
        authorizedRegistrars[registrar] = true;
        emit AuthorizedRegistrarAdded(registrar);
    }
    
    /**
     * @dev Remove authorized registrar
     * @param registrar Address to remove authorization
     */
    function removeAuthorizedRegistrar(address registrar) 
        external 
        onlyOwner 
    {
        require(authorizedRegistrars[registrar], "Not authorized");
        require(registrar != owner(), "Cannot remove owner");
        
        authorizedRegistrars[registrar] = false;
        emit AuthorizedRegistrarRemoved(registrar);
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
     * @return Total number of registered users
     */
    function getContractStats() 
        external 
        view 
        returns (uint256) 
    {
        return totalRegisteredUsers;
    }
}
