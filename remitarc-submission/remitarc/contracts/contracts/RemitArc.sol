// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RemitArc
 * @notice Stablecoin-based remittance settlement on Circle's Arc L1.
 *         Users send USDC cross-border with transparent fees, real-time
 *         settlement finality, and an on-chain receipt for every transfer.
 *
 * @dev Tracks:
 *   - transferCount   total lifetime transfers
 *   - totalVolume     cumulative USDC settled (6 decimals)
 *   - transfers[]     per-transfer receipts
 *
 * Circle tools used:
 *   - USDC            primary settlement rail (Arc testnet)
 *   - Circle Wallets  embedded wallet abstraction on the frontend
 *   - CCTP            cross-chain USDC movement (called after settlement)
 *   - Gateway         treasury/off-ramp routing (called by backend)
 */
contract RemitArc is Ownable, ReentrancyGuard {

    // -----------------------------------------------------------------------
    // Types
    // -----------------------------------------------------------------------

    struct Transfer {
        address  sender;
        string   recipientName;
        string   destinationCountry;
        uint256  usdcAmount;        // 6 decimal USDC
        uint256  feeAmount;         // 6 decimal USDC
        uint256  timestamp;
        bytes32  cctpMessageHash;   // CCTP attestation hash (0 if same-chain)
        bool     settled;
    }

    // -----------------------------------------------------------------------
    // State
    // -----------------------------------------------------------------------

    IERC20 public immutable usdc;

    address public feeRecipient;
    uint256 public feeBps = 30;         // 0.30 % default fee
    uint256 public constant MAX_FEE_BPS = 200;

    uint256 public transferCount;
    uint256 public totalVolume;         // cumulative USDC (6 dec)

    mapping(uint256 => Transfer) public transfers;
    mapping(address => uint256[]) public senderTransfers;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event TransferInitiated(
        uint256 indexed id,
        address indexed sender,
        string  recipientName,
        string  destinationCountry,
        uint256 usdcAmount,
        uint256 feeAmount,
        uint256 timestamp
    );

    event TransferSettled(
        uint256 indexed id,
        bytes32 cctpMessageHash
    );

    event FeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    constructor(address _usdc, address _feeRecipient) Ownable(msg.sender) {
        require(_usdc != address(0), "RemitArc: zero USDC address");
        require(_feeRecipient != address(0), "RemitArc: zero fee recipient");
        usdc = IERC20(_usdc);
        feeRecipient = _feeRecipient;
    }

    // -----------------------------------------------------------------------
    // Core: initiate transfer
    // -----------------------------------------------------------------------

    /**
     * @notice Pull USDC from sender, deduct fee, and record the transfer.
     *         Backend picks up the TransferInitiated event and calls
     *         Circle Gateway for treasury routing + CCTP for cross-chain.
     *
     * @param recipientName        Display name of the recipient
     * @param destinationCountry   ISO 3166-1 alpha-2 country code (e.g. "IN")
     * @param usdcAmount           Amount in USDC (6 decimals) to send
     */
    function initiateTransfer(
        string calldata recipientName,
        string calldata destinationCountry,
        uint256 usdcAmount
    ) external nonReentrant returns (uint256 transferId) {

        require(usdcAmount > 0, "RemitArc: zero amount");
        require(bytes(recipientName).length > 0, "RemitArc: empty recipient");
        require(bytes(destinationCountry).length == 2, "RemitArc: invalid country code");

        uint256 fee = (usdcAmount * feeBps) / 10_000;
        uint256 total = usdcAmount + fee;

        require(
            usdc.transferFrom(msg.sender, address(this), total),
            "RemitArc: USDC transfer failed"
        );

        if (fee > 0) {
            require(
                usdc.transfer(feeRecipient, fee),
                "RemitArc: fee transfer failed"
            );
        }

        transferId = transferCount++;
        transfers[transferId] = Transfer({
            sender:             msg.sender,
            recipientName:      recipientName,
            destinationCountry: destinationCountry,
            usdcAmount:         usdcAmount,
            feeAmount:          fee,
            timestamp:          block.timestamp,
            cctpMessageHash:    bytes32(0),
            settled:            false
        });

        senderTransfers[msg.sender].push(transferId);
        totalVolume += usdcAmount;

        emit TransferInitiated(
            transferId,
            msg.sender,
            recipientName,
            destinationCountry,
            usdcAmount,
            fee,
            block.timestamp
        );
    }

    // -----------------------------------------------------------------------
    // Core: mark settled (called by backend after CCTP attestation)
    // -----------------------------------------------------------------------

    /**
     * @notice Called by the owner/backend after CCTP cross-chain settlement
     *         has been attested. Records the CCTP message hash on-chain as
     *         a verifiable receipt.
     */
    function markSettled(
        uint256 transferId,
        bytes32 cctpMessageHash
    ) external onlyOwner {
        Transfer storage t = transfers[transferId];
        require(!t.settled, "RemitArc: already settled");
        t.settled = true;
        t.cctpMessageHash = cctpMessageHash;
        emit TransferSettled(transferId, cctpMessageHash);
    }

    // -----------------------------------------------------------------------
    // Read helpers
    // -----------------------------------------------------------------------

    function getTransfer(uint256 id) external view returns (Transfer memory) {
        return transfers[id];
    }

    function getSenderTransfers(address sender)
        external view returns (uint256[] memory)
    {
        return senderTransfers[sender];
    }

    function getSenderTransferCount(address sender)
        external view returns (uint256)
    {
        return senderTransfers[sender].length;
    }

    // -----------------------------------------------------------------------
    // Admin
    // -----------------------------------------------------------------------

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "RemitArc: fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "RemitArc: zero address");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    function withdrawUSDC(uint256 amount) external onlyOwner {
        require(usdc.transfer(msg.sender, amount), "RemitArc: withdraw failed");
    }
}
