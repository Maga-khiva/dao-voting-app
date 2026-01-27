// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GovernanceToken
 * @dev ERC20 token for DAO governance - token holder = voting power
 * @notice Simple ERC20 implementation optimized for gas and governance
 */
contract GovernanceToken {
    string public constant name = "DAO Governance Token";
    string public constant symbol = "GOV";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    bool public mintingEnabled = true;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Minted(address indexed to, uint256 amount);
    event Burned(address indexed from, uint256 amount);

    error OnlyOwner();
    error MintingDisabled();
    error InsufficientBalance();
    error InsufficientAllowance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        // Initial mint to owner
        _mint(msg.sender, 1000000 * 10 ** uint256(decimals));
    }

    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        if (!mintingEnabled) revert MintingDisabled();
        _mint(_to, _amount);
        emit Minted(_to, _amount);
    }

    /**
     * @dev Disable minting (irreversible)
     */
    function disableMinting() external onlyOwner {
        mintingEnabled = false;
    }

    /**
     * @dev Burn tokens
     */
    function burn(uint256 _amount) external {
        if (balanceOf[msg.sender] < _amount) revert InsufficientBalance();
        
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        
        emit Burned(msg.sender, _amount);
        emit Transfer(msg.sender, address(0), _amount);
    }

    /**
     * @dev Transfer tokens
     */
    function transfer(address _to, uint256 _amount) external returns (bool) {
        if (balanceOf[msg.sender] < _amount) revert InsufficientBalance();
        
        balanceOf[msg.sender] -= _amount;
        balanceOf[_to] += _amount;
        
        emit Transfer(msg.sender, _to, _amount);
        return true;
    }

    /**
     * @dev Approve spending
     */
    function approve(address _spender, uint256 _amount) external returns (bool) {
        allowance[msg.sender][_spender] = _amount;
        emit Approval(msg.sender, _spender, _amount);
        return true;
    }

    /**
     * @dev Transfer from one address to another
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool) {
        if (balanceOf[_from] < _amount) revert InsufficientBalance();
        if (allowance[_from][msg.sender] < _amount) revert InsufficientAllowance();
        
        balanceOf[_from] -= _amount;
        balanceOf[_to] += _amount;
        allowance[_from][msg.sender] -= _amount;
        
        emit Transfer(_from, _to, _amount);
        return true;
    }

    /**
     * @dev Internal mint function
     */
    function _mint(address _to, uint256 _amount) internal {
        balanceOf[_to] += _amount;
        totalSupply += _amount;
        emit Transfer(address(0), _to, _amount);
    }
}
