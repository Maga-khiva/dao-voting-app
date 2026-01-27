// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ProposalVoting
 * @dev DAO Voting contract with token-based voting, multi-sig execution, and filtering
 * @notice Tier 1 Features: Token voting, Multi-sig, Filtering, Analytics support
 */
contract ProposalVoting {
    
    // Custom errors
    error OnlyOwner();
    error OnlyApprover();
    error ProposalDoesNotExist();
    error TitleCannotBeEmpty();
    error DescriptionCannotBeEmpty();
    error AlreadyVoted();
    error VotingClosed();
    error ProposalAlreadyExecuted();
    error InvalidApproverCount();
    error ApprovalAlreadyGiven();
    error ApprovalNotGiven();
    error InsufficientApprovals();
    error InvalidTokenAddress();
    error ZeroTokenBalance();
    error CannotDelegateToSelf();
    error NoActiveDelegation();
    error NotAuthorized();
    error InvalidRole();
    error AmendmentDoesNotExist();
    error AmendmentAlreadyProcessed();
    error ProposalTooOldToAmend();

    // Enum for proposal status
    enum ProposalStatus { Active, Closed, Executed, Rejected }
    
    // Enum for user roles - Tier 2 RBAC
    enum UserRole { None, Member, Moderator, Admin }

    // Enhanced proposal struct with metadata
    struct Proposal {
        string title;
        string description;
        uint64 yesVotes;        // Token-weighted votes (yes)
        uint64 noVotes;         // Token-weighted votes (no)
        uint64 deadline;
        ProposalStatus status;
        address creator;
        string category;        // For filtering
        uint32 snapshotBlock;   // Block number for token snapshot
        bool readyForExecution;
        uint256 amendmentCount; // Number of amendments made
    }
    
    // Amendment struct - Tier 2
    struct Amendment {
        uint256 proposalId;
        string title;
        string description;
        address proposedBy;
        uint256 timestamp;
        bool approved;
        string status; // "Pending", "Approved", "Rejected"
    }

    // Multi-sig approval tracking
    struct ExecutionApproval {
        mapping(address => bool) approvers;
        uint8 approvalCount;
    }

    // Voting record with token weight
    struct VoteRecord {
        bool hasVoted;
        bool support;
        uint64 tokenWeight;     // Token amount used for voting
    }

    // State variables
    Proposal[] public proposals;
    ExecutionApproval[] public executionApprovals;
    
    address public owner;
    IERC20 public governanceToken;
    
    address[] public multiSigApprovers;
    uint8 public requiredApprovals;
    
    uint256 public constant MIN_TOKEN_TO_VOTE = 1e18; // 1 token
    
    // Mapping: proposalId => voter => voteRecord
    mapping(uint256 => mapping(address => VoteRecord)) public votes;
    
    // Mapping: proposalId => category (for filtering)
    mapping(string => uint256[]) public proposalsByCategory;
    
    // Snapshot-based voting: proposalId => voter => voting power at snapshot
    mapping(uint256 => mapping(address => uint64)) public voterSnapshotBalance;
    
    // Vote Delegation - Tier 2 Feature
    // Mapping: delegator => delegate address
    mapping(address => address) public voteDelegation;
    
    // Track delegators for each delegate (for calculating effective voting power)
    mapping(address => address[]) public delegators;
    
    // Role-Based Access Control - Tier 2 Feature
    mapping(address => UserRole) public userRoles;
    
    // Amendments - Tier 2 Feature
    Amendment[] public amendments;
    mapping(uint256 => uint256[]) public proposalAmendments; // proposalId => amendmentIds

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        string title,
        address indexed creator,
        uint64 deadline,
        string category
    );
    
    event VoteCasted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint64 tokenWeight
    );
    
    event ExecutionRequested(uint256 indexed proposalId);
    event ExecutionApproved(uint256 indexed proposalId, address approver);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);
    event MultiSigSetup(address[] approvers, uint8 required);
    
    // Tier 2 Events
    event VoteDelegated(address indexed delegator, address indexed delegate);
    event VoteDelegationRevoked(address indexed delegator);
    event RoleAssigned(address indexed user, UserRole role);
    event RoleRevoked(address indexed user);
    event AmendmentProposed(uint256 indexed amendmentId, uint256 indexed proposalId, address indexed proposedBy);
    event AmendmentApproved(uint256 indexed amendmentId, uint256 indexed proposalId);
    event AmendmentRejected(uint256 indexed amendmentId, uint256 indexed proposalId);

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyApprover() {
        bool isApprover = false;
        for (uint256 i = 0; i < multiSigApprovers.length; i++) {
            if (multiSigApprovers[i] == msg.sender) {
                isApprover = true;
                break;
            }
        }
        if (!isApprover) revert OnlyApprover();
        _;
    }

    modifier proposalExists(uint256 _id) {
        if (_id >= proposals.length) revert ProposalDoesNotExist();
        _;
    }

    // Tier 2 RBAC Modifiers
    modifier onlyRole(UserRole _role) {
        if (userRoles[msg.sender] != _role && userRoles[msg.sender] != UserRole.Admin) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyMember() {
        if (userRoles[msg.sender] == UserRole.None) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyModerator() {
        if (userRoles[msg.sender] != UserRole.Moderator && userRoles[msg.sender] != UserRole.Admin) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyAdmin() {
        if (userRoles[msg.sender] != UserRole.Admin) {
            revert NotAuthorized();
        }
        _;
    }

    /**
     * @dev Constructor - sets the contract owner and governance token
     * @param _governanceToken Address of the ERC20 governance token
     * @param _approvers Array of multi-sig approver addresses
     * @param _requiredApprovals Number of approvals required
     */
    constructor(
        address _governanceToken,
        address[] memory _approvers,
        uint8 _requiredApprovals
    ) {
        if (_governanceToken == address(0)) revert InvalidTokenAddress();
        if (_requiredApprovals == 0 || _requiredApprovals > _approvers.length) 
            revert InvalidApproverCount();
        
        owner = msg.sender;
        governanceToken = IERC20(_governanceToken);
        multiSigApprovers = _approvers;
        requiredApprovals = _requiredApprovals;
        
        // Set owner as Admin for RBAC - Tier 2
        userRoles[msg.sender] = UserRole.Admin;
        
        emit MultiSigSetup(_approvers, _requiredApprovals);
    }

    /**
     * @dev Create a new proposal with category for filtering
     * @param _title Title of the proposal
     * @param _description Description of the proposal
     * @param _duration Voting duration in seconds
     * @param _category Category for filtering (e.g., "Treasury", "Governance")
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint64 _duration,
        string memory _category
    ) external {
        if (bytes(_title).length == 0) revert TitleCannotBeEmpty();
        if (bytes(_description).length == 0) revert DescriptionCannotBeEmpty();
        
        // Check that caller has at least 1 governance token
        if (governanceToken.balanceOf(msg.sender) < MIN_TOKEN_TO_VOTE) revert ZeroTokenBalance();

        uint64 deadline = uint64(block.timestamp) + _duration;
        uint32 snapshotBlock = uint32(block.number);

        Proposal memory newProposal = Proposal({
            title: _title,
            description: _description,
            yesVotes: 0,
            noVotes: 0,
            deadline: deadline,
            status: ProposalStatus.Active,
            creator: msg.sender,
            category: _category,
            snapshotBlock: snapshotBlock,
            readyForExecution: false,
            amendmentCount: 0
        });

        proposals.push(newProposal);
        executionApprovals.push();
        
        // Add to category index for filtering
        proposalsByCategory[_category].push(proposals.length - 1);

        emit ProposalCreated(proposals.length - 1, _title, msg.sender, deadline, _category);
    }

    /**
     * @dev Cast a vote with token weight
     * @param _proposalId ID of the proposal
     * @param _support True for yes vote, false for no vote
     */
    function vote(uint256 _proposalId, bool _support)
        external
        proposalExists(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];

        // Check if proposal is still active
        if (block.timestamp > proposal.deadline) {
            proposal.status = ProposalStatus.Closed;
            revert VotingClosed();
        }

        // Check if voter hasn't already voted
        if (votes[_proposalId][msg.sender].hasVoted) revert AlreadyVoted();

        // Get effective voting power (includes delegated tokens, but prevents voting if delegated)
        uint256 effectiveVotingPower = this.getEffectiveVotingPower(msg.sender);
        if (effectiveVotingPower == 0) revert ZeroTokenBalance();
        
        uint64 tokenBalance = uint64(effectiveVotingPower / 1e18);
        
        // Store the voter's balance snapshot for this proposal
        voterSnapshotBalance[_proposalId][msg.sender] = tokenBalance;

        // Record the vote with token weight
        votes[_proposalId][msg.sender].hasVoted = true;
        votes[_proposalId][msg.sender].support = _support;
        votes[_proposalId][msg.sender].tokenWeight = tokenBalance;

        // Update vote counts with token weight
        unchecked {
            if (_support) {
                proposal.yesVotes += tokenBalance;
            } else {
                proposal.noVotes += tokenBalance;
            }
        }

        emit VoteCasted(_proposalId, msg.sender, _support, tokenBalance);
    }

    /**
     * @dev Get the voting power snapshot for a voter on a specific proposal
     * @param _proposalId ID of the proposal
     * @param _voter Address of the voter
     * @return Voting power at proposal snapshot
     */
    function getVoterSnapshotBalance(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (uint64)
    {
        return voterSnapshotBalance[_proposalId][_voter];
    }

    /**
     * @dev Get the proposal snapshot block
     * @param _proposalId ID of the proposal
     * @return Block number where proposal voting power was captured
     */
    function getProposalSnapshotBlock(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (uint32)
    {
        return proposals[_proposalId].snapshotBlock;
    }

    /**
     * @dev Request execution (sets readyForExecution flag)
     * @param _proposalId ID of the proposal
     */
    
    // ============ Vote Delegation Functions (Tier 2) ============
    
    /**
     * @dev Delegate voting power to another address
     * @param _delegate Address to delegate voting power to
     */
    function delegateVote(address _delegate) external {
        if (_delegate == msg.sender) revert CannotDelegateToSelf();
        if (_delegate == address(0)) revert InvalidTokenAddress();
        
        voteDelegation[msg.sender] = _delegate;
        
        // Add to delegators list if not already there
        bool found = false;
        address[] storage delegatorsList = delegators[_delegate];
        for (uint256 i = 0; i < delegatorsList.length; i++) {
            if (delegatorsList[i] == msg.sender) {
                found = true;
                break;
            }
        }
        if (!found) {
            delegators[_delegate].push(msg.sender);
        }
        
        emit VoteDelegated(msg.sender, _delegate);
    }

    /**
     * @dev Revoke vote delegation
     */
    function revokeDelegation() external {
        address previousDelegate = voteDelegation[msg.sender];
        if (previousDelegate == address(0)) revert NoActiveDelegation();
        
        voteDelegation[msg.sender] = address(0);
        
        emit VoteDelegationRevoked(msg.sender);
    }

    /**
     * @dev Get voting delegate for an address
     * @param _voter Address to check
     * @return Delegate address (0x0 if no delegation)
     */
    function getDelegate(address _voter) external view returns (address) {
        return voteDelegation[_voter];
    }

    /**
     * @dev Calculate effective voting power including delegations
     * @param _voter Address to calculate voting power for
     * @return Total voting power (direct + delegated)
     */
    function getEffectiveVotingPower(address _voter) external view returns (uint256) {
        uint256 ownBalance = governanceToken.balanceOf(_voter);
        
        // If voter has delegated, return delegated power only (0)
        if (voteDelegation[_voter] != address(0)) {
            return 0;
        }
        
        // Otherwise return own balance plus delegated tokens
        uint256 delegatedPower = 0;
        
        // Add power from all delegators
        for (uint256 i = 0; i < delegators[_voter].length; i++) {
            address delegator = delegators[_voter][i];
            // Only count if still delegating to this voter
            if (voteDelegation[delegator] == _voter) {
                delegatedPower += governanceToken.balanceOf(delegator);
            }
        }
        
        return ownBalance + delegatedPower;
    }

    // ============ Role-Based Access Control Functions (Tier 2) ============

    /**
     * @dev Assign a role to a user (Admin only)
     * @param _user Address of the user
     * @param _role Role to assign
     */
    function assignRole(address _user, UserRole _role) external onlyAdmin {
        if (_role == UserRole.None) revert InvalidRole();
        if (_user == address(0)) revert InvalidTokenAddress();
        
        userRoles[_user] = _role;
        
        emit RoleAssigned(_user, _role);
    }

    /**
     * @dev Revoke user role (Admin only)
     * @param _user Address of the user
     */
    function revokeRole(address _user) external onlyAdmin {
        if (_user == owner && msg.sender != owner) revert NotAuthorized();
        
        userRoles[_user] = UserRole.None;
        
        emit RoleRevoked(_user);
    }

    /**
     * @dev Get user role
     * @param _user Address to check
     * @return User's role
     */
    function getUserRole(address _user) external view returns (UserRole) {
        return userRoles[_user];
    }

    /**
     * @dev Check if user has at least a specific role
     * @param _user Address to check
     * @param _role Role to check
     * @return True if user has the role or higher
     */
    function hasRole(address _user, UserRole _role) external view returns (bool) {
        UserRole userRole = userRoles[_user];
        if (userRole == UserRole.Admin) return true;
        return userRole == _role;
    }

    // ============ Proposal Amendments Functions (Tier 2) ============

    /**
     * @dev Propose an amendment to an existing proposal
     * @param _proposalId ID of the proposal to amend
     * @param _title New title
     * @param _description New description
     */
    function proposeAmendment(
        uint256 _proposalId,
        string memory _title,
        string memory _description
    ) external proposalExists(_proposalId) onlyMember {
        Proposal storage proposal = proposals[_proposalId];
        
        // Can only amend active proposals
        if (proposal.status != ProposalStatus.Active) revert InvalidRole();
        
        // Amendment deadline: must be at least 300 seconds (5 min) before proposal closes
        uint64 currentTime = uint64(block.timestamp);
        if (currentTime + 300 > proposal.deadline) revert ProposalTooOldToAmend();
        
        Amendment memory amendment = Amendment({
            proposalId: _proposalId,
            title: _title,
            description: _description,
            proposedBy: msg.sender,
            timestamp: block.timestamp,
            approved: false,
            status: "Pending"
        });
        
        amendments.push(amendment);
        proposalAmendments[_proposalId].push(amendments.length - 1);
        
        emit AmendmentProposed(amendments.length - 1, _proposalId, msg.sender);
    }

    /**
     * @dev Approve an amendment (Moderator/Admin only)
     * @param _amendmentId ID of the amendment
     */
    function approveAmendment(uint256 _amendmentId) external onlyModerator {
        if (_amendmentId >= amendments.length) revert AmendmentDoesNotExist();
        
        Amendment storage amendment = amendments[_amendmentId];
        
        if (keccak256(bytes(amendment.status)) != keccak256(bytes("Pending"))) {
            revert AmendmentAlreadyProcessed();
        }
        
        uint256 proposalId = amendment.proposalId;
        Proposal storage proposal = proposals[proposalId];
        
        // Apply amendment
        proposal.title = amendment.title;
        proposal.description = amendment.description;
        proposal.amendmentCount++;
        
        amendment.approved = true;
        amendment.status = "Approved";
        
        emit AmendmentApproved(_amendmentId, proposalId);
    }

    /**
     * @dev Reject an amendment (Moderator/Admin only)
     * @param _amendmentId ID of the amendment
     */
    function rejectAmendment(uint256 _amendmentId) external onlyModerator {
        if (_amendmentId >= amendments.length) revert AmendmentDoesNotExist();
        
        Amendment storage amendment = amendments[_amendmentId];
        
        if (keccak256(bytes(amendment.status)) != keccak256(bytes("Pending"))) {
            revert AmendmentAlreadyProcessed();
        }
        
        amendment.status = "Rejected";
        
        emit AmendmentRejected(_amendmentId, amendment.proposalId);
    }

    /**
     * @dev Get amendment details
     * @param _amendmentId ID of the amendment
     * @return Amendment struct
     */
    function getAmendment(uint256 _amendmentId) external view returns (Amendment memory) {
        if (_amendmentId >= amendments.length) revert AmendmentDoesNotExist();
        return amendments[_amendmentId];
    }

    /**
     * @dev Get all amendments for a proposal
     * @param _proposalId ID of the proposal
     * @return Array of amendment IDs
     */
    function getProposalAmendments(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId)
        returns (uint256[] memory)
    {
        return proposalAmendments[_proposalId];
    }

    /**
     * @dev Request execution (sets readyForExecution flag)
     * @param _proposalId ID of the proposal
     */
    function requestExecution(uint256 _proposalId)
        external
        onlyOwner
        proposalExists(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];
        
        if (proposal.status != ProposalStatus.Active) revert ProposalAlreadyExecuted();
        if (block.timestamp <= proposal.deadline) revert VotingClosed();
        
        // Check if proposal passed
        if (proposal.yesVotes <= proposal.noVotes) {
            proposal.status = ProposalStatus.Rejected;
            emit ProposalRejected(_proposalId);
            return;
        }

        proposal.readyForExecution = true;
        proposal.status = ProposalStatus.Closed; // Waiting for multi-sig

        emit ExecutionRequested(_proposalId);
    }

    /**
     * @dev Approve execution (multi-sig)
     * @param _proposalId ID of the proposal
     */
    function approveExecution(uint256 _proposalId)
        external
        onlyApprover
        proposalExists(_proposalId)
    {
        ExecutionApproval storage approval = executionApprovals[_proposalId];
        
        if (approval.approvers[msg.sender]) revert ApprovalAlreadyGiven();
        
        approval.approvers[msg.sender] = true;
        approval.approvalCount++;

        emit ExecutionApproved(_proposalId, msg.sender);
    }

    /**
     * @dev Execute proposal (requires multi-sig approvals)
     * @param _proposalId ID of the proposal
     */
    function executeProposal(uint256 _proposalId)
        external
        onlyOwner
        proposalExists(_proposalId)
    {
        Proposal storage proposal = proposals[_proposalId];
        ExecutionApproval storage approval = executionApprovals[_proposalId];
        
        if (proposal.status == ProposalStatus.Executed) revert ProposalAlreadyExecuted();
        if (!proposal.readyForExecution) revert("Not ready for execution");
        if (approval.approvalCount < requiredApprovals) revert InsufficientApprovals();

        proposal.status = ProposalStatus.Executed;

        emit ProposalExecuted(_proposalId);
    }

    /**
     * @dev Get all proposals (for basic list)
     */
    function getProposalCount() external view returns (uint256) {
        return proposals.length;
    }

    /**
     * @dev Get proposals by status for filtering
     * @param _status Status to filter by
     */
    function getProposalsByStatus(ProposalStatus _status)
        external
        view
        returns (uint256[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].status == _status) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].status == _status) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    /**
     * @dev Get proposals by category for filtering
     * @param _category Category to filter by
     */
    function getProposalsByCategory(string memory _category)
        external
        view
        returns (uint256[] memory)
    {
        return proposalsByCategory[_category];
    }

    /**
     * @dev Get all proposals with enhanced data for analytics
     */
    function getProposals()
        external
        view
        returns (
            string[] memory titles,
            string[] memory descriptions,
            uint256[] memory yesVotes,
            uint256[] memory noVotes,
            uint256[] memory deadlines,
            string[] memory statuses,
            address[] memory creators,
            string[] memory categories
        )
    {
        uint256 length = proposals.length;

        titles = new string[](length);
        descriptions = new string[](length);
        yesVotes = new uint256[](length);
        noVotes = new uint256[](length);
        deadlines = new uint256[](length);
        statuses = new string[](length);
        creators = new address[](length);
        categories = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            Proposal storage proposal = proposals[i];
            titles[i] = proposal.title;
            descriptions[i] = proposal.description;
            yesVotes[i] = proposal.yesVotes;
            noVotes[i] = proposal.noVotes;
            deadlines[i] = proposal.deadline;
            statuses[i] = getStatusString(proposal.status);
            creators[i] = proposal.creator;
            categories[i] = proposal.category;
        }

        return (
            titles,
            descriptions,
            yesVotes,
            noVotes,
            deadlines,
            statuses,
            creators,
            categories
        );
    }

    /**
     * @dev Get single proposal with full details
     */
    function getProposal(uint256 _proposalId)
        external
        view
        proposalExists(_proposalId)
        returns (
            string memory title,
            string memory description,
            uint256 yesVotes,
            uint256 noVotes,
            uint256 deadline,
            string memory status,
            address creator,
            bool isVotingOpen,
            string memory category,
            uint8 approvalsGiven
        )
    {
        Proposal storage proposal = proposals[_proposalId];
        ExecutionApproval storage approval = executionApprovals[_proposalId];

        return (
            proposal.title,
            proposal.description,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.deadline,
            getStatusString(proposal.status),
            proposal.creator,
            proposal.status == ProposalStatus.Active && block.timestamp <= proposal.deadline,
            proposal.category,
            approval.approvalCount
        );
    }

    /**
     * @dev Check if an address has voted on a proposal
     */
    function hasVoted(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (bool)
    {
        return votes[_proposalId][_voter].hasVoted;
    }

    /**
     * @dev Get the vote details of an address
     */
    function getVote(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (bool hasVoted, bool support, uint64 tokenWeight)
    {
        VoteRecord storage voteRecord = votes[_proposalId][_voter];
        return (voteRecord.hasVoted, voteRecord.support, voteRecord.tokenWeight);
    }

    /**
     * @dev Get voter analytics - participation rate
     */
    function getVoterStats(uint256 _proposalId, address _voter)
        external
        view
        proposalExists(_proposalId)
        returns (
            bool participated,
            uint64 tokenUsed,
            uint256 votingPower
        )
    {
        VoteRecord storage voteRecord = votes[_proposalId][_voter];
        return (
            voteRecord.hasVoted,
            voteRecord.tokenWeight,
            governanceToken.balanceOf(_voter)
        );
    }

    /**
     * @dev Convert status enum to string for frontend
     */
    function getStatusString(ProposalStatus _status)
        internal
        pure
        returns (string memory)
    {
        if (_status == ProposalStatus.Active) return "Active";
        if (_status == ProposalStatus.Closed) return "Closed";
        if (_status == ProposalStatus.Executed) return "Executed";
        return "Rejected";
    }

    /**
     * @dev Get multi-sig details
     */
    function getMultiSigDetails()
        external
        view
        returns (address[] memory approvers, uint8 required)
    {
        return (multiSigApprovers, requiredApprovals);
    }
}
