// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Smart contract for registering and verifying course completion certificates on Ethereum Sepolia
 * @notice This contract enables immutable certificate registration for the Jobzee learning platform
 */
contract CertificateRegistry {
    
    // ============ State Variables ============
    
    /**
     * @dev Structure to store certificate information
     * @param certificateHash The SHA-256 hash of the certificate data
     * @param issuedAt Timestamp when the certificate was issued
     * @param exists Flag to check if certificate exists (prevents re-registration)
     */
    struct Certificate {
        bytes32 certificateHash;
        uint256 issuedAt;
        bool exists;
    }
    
    // Mapping from certificateId to Certificate details
    mapping(string => Certificate) private certificates;
    
    // Mapping to track used hashes (prevents duplicate certificates)
    mapping(bytes32 => bool) private usedHashes;
    
    // Address of the contract owner (for future administrative functions if needed)
    address public immutable owner;
    
    // ============ Events ============
    
    /**
     * @dev Emitted when a new certificate is successfully registered
     * @param certificateId Unique identifier for the certificate (e.g., "CERT-USER123-COURSE456")
     * @param certificateHash SHA-256 hash of certificate data
     * @param issuedAt Timestamp of certificate issuance
     */
    event CertificateRegistered(
        string indexed certificateId,
        bytes32 indexed certificateHash,
        uint256 issuedAt
    );
    
    // ============ Constructor ============
    
    /**
     * @dev Sets the contract deployer as the owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Public Functions ============
    
    /**
     * @dev Registers a new certificate on the blockchain
     * @param certificateId Unique identifier for the certificate
     * @param certificateHash SHA-256 hash of the certificate data (32 bytes)
     * @notice This function can only be called once per certificateId
     * @notice The certificate data is immutable once registered
     */
    function registerCertificate(
        string memory certificateId,
        bytes32 certificateHash
    ) public {
        // Validate inputs
        require(bytes(certificateId).length > 0, "Certificate ID cannot be empty");
        require(certificateHash != bytes32(0), "Certificate hash cannot be zero");
        
        // Prevent duplicate registration of same certificate ID
        require(
            !certificates[certificateId].exists,
            "Certificate already registered with this ID"
        );
        
        // Prevent duplicate registration of same hash
        require(
            !usedHashes[certificateHash],
            "Certificate with this hash already exists"
        );
        
        // Record the current timestamp
        uint256 timestamp = block.timestamp;
        
        // Store certificate in blockchain
        certificates[certificateId] = Certificate({
            certificateHash: certificateHash,
            issuedAt: timestamp,
            exists: true
        });
        
        // Mark hash as used
        usedHashes[certificateHash] = true;
        
        // Emit event for off-chain tracking
        emit CertificateRegistered(certificateId, certificateHash, timestamp);
    }
    
    /**
     * @dev Verifies if a certificate exists and matches the provided hash
     * @param certificateId The unique identifier of the certificate to verify
     * @param certificateHash The hash to verify against the stored hash
     * @return bool True if certificate exists and hash matches, false otherwise
     * @notice This is a view function and does not cost gas
     */
    function verifyCertificate(
        string memory certificateId,
        bytes32 certificateHash
    ) public view returns (bool) {
        Certificate memory cert = certificates[certificateId];
        
        // Check if certificate exists and hash matches
        return cert.exists && cert.certificateHash == certificateHash;
    }
    
    /**
     * @dev Retrieves full certificate details for a given certificate ID
     * @param certificateId The unique identifier of the certificate
     * @return certificateHash The stored hash of the certificate
     * @return issuedAt The timestamp when certificate was issued
     * @return exists Whether the certificate exists in the registry
     * @notice Returns zero values if certificate doesn't exist
     */
    function getCertificate(string memory certificateId)
        public
        view
        returns (
            bytes32 certificateHash,
            uint256 issuedAt,
            bool exists
        )
    {
        Certificate memory cert = certificates[certificateId];
        return (cert.certificateHash, cert.issuedAt, cert.exists);
    }
    
    /**
     * @dev Checks if a certificate exists by ID
     * @param certificateId The unique identifier of the certificate
     * @return bool True if certificate exists, false otherwise
     */
    function certificateExists(string memory certificateId) 
        public 
        view 
        returns (bool) 
    {
        return certificates[certificateId].exists;
    }
    
    /**
     * @dev Checks if a hash has been used for any certificate
     * @param certificateHash The hash to check
     * @return bool True if hash is already registered, false otherwise
     */
    function isHashUsed(bytes32 certificateHash) 
        public 
        view 
        returns (bool) 
    {
        return usedHashes[certificateHash];
    }
}
