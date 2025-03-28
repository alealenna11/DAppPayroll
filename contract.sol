// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";
import "@openzeppelin/contracts@4.9.0/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts@4.9.0/security/Pausable.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts@4.9.0/token/ERC20/utils/SafeERC20.sol";

contract USDC_Payroll is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct Employee {
        address addr;
        uint256 salary; 
        uint256 lastPaid;
        bool isActive;
    }

    IERC20 public usdc;
    uint256 public paymentInterval = 30 days;
    Employee[] public employees;
    mapping(address => uint256) private employeeIndex;

    event EmployeeAdded(address indexed addr, uint256 salary);
    event EmployeeRemoved(address indexed addr);
    event SalaryPaid(address indexed employee, uint256 amount);
    event BatchPaymentCompleted(uint256 totalPaid);
    event FundsDeposited(uint256 amount);

    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }

    
    function addEmployee(address _addr, uint256 _salary) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        require(_salary > 0, "Salary must be > 0");
        require(employeeIndex[_addr] == 0, "Employee exists");

        employees.push(Employee(_addr, _salary, 0, true));
        employeeIndex[_addr] = employees.length;
        emit EmployeeAdded(_addr, _salary);
    }

    function removeEmployee(address _addr) external onlyOwner {
        uint256 index = employeeIndex[_addr];
        require(index != 0, "Not an employee");
        
        employees[index-1].isActive = false;
        employeeIndex[_addr] = 0;
        emit EmployeeRemoved(_addr);
    }

    function batchPay() external onlyOwner nonReentrant {
        uint256 totalToPay;
        uint256 activeCount;
        
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].isActive && canClaimSalary(employees[i].addr)) {
                totalToPay += employees[i].salary;
                activeCount++;
            }
        }

        require(activeCount > 0, "No eligible employees");
        require(usdc.balanceOf(address(this)) >= totalToPay, "Insufficient USDC");

        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].isActive && canClaimSalary(employees[i].addr)) {
                employees[i].lastPaid = block.timestamp;
                usdc.safeTransfer(employees[i].addr, employees[i].salary);
                emit SalaryPaid(employees[i].addr, employees[i].salary);
            }
        }

        emit BatchPaymentCompleted(totalToPay);
    }

    
    function claimSalary() external nonReentrant whenNotPaused {
        require(canClaimSalary(msg.sender), "Not eligible");
        
        uint256 index = employeeIndex[msg.sender];
        employees[index-1].lastPaid = block.timestamp;
        
        usdc.safeTransfer(msg.sender, employees[index-1].salary);
        emit SalaryPaid(msg.sender, employees[index-1].salary);
    }

   
function isEmployee(address _addr) public view returns (bool) {
    return employeeIndex[_addr] != 0 && employees[employeeIndex[_addr] - 1].isActive;
}
    function getLastPaid(address _wallet) public view returns (uint256) {
        uint256 index = employeeIndex[_wallet];
        require(index != 0, "Not an employee");
        return employees[index-1].lastPaid;
    }

    function canClaimSalary(address _wallet) public view returns (bool) {
        uint256 index = employeeIndex[_wallet];
        if (index == 0) return false;
        
        Employee storage emp = employees[index-1];
        return emp.isActive && 
               block.timestamp >= emp.lastPaid + paymentInterval;
    }

    function isLowOnFunds() public view returns (bool) {
        uint256 total;
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].isActive) {
                total += employees[i].salary;
            }
        }
        return usdc.balanceOf(address(this)) < total;
    }

     

    function depositUSDC(uint256 amount) external {
        usdc.safeTransferFrom(msg.sender, address(this), amount);
        emit FundsDeposited(amount);
    }

    function withdrawExcessUSDC() external onlyOwner {
        uint256 excess = usdc.balanceOf(address(this)) - totalOwed();
        require(excess > 0, "No excess funds");
        usdc.safeTransfer(owner(), excess);
    }

    function totalOwed() public view returns (uint256) {
        uint256 total;
        for (uint256 i = 0; i < employees.length; i++) {
            if (employees[i].isActive && canClaimSalary(employees[i].addr)) {
                total += employees[i].salary;
            }
        }
        return total;
    }

 

    function emergencyWithdraw() external onlyOwner {
        usdc.safeTransfer(owner(), usdc.balanceOf(address(this)));
    }

    function pausePayments() external onlyOwner {
        _pause();
    }

    function unpausePayments() external onlyOwner {
        _unpause();
    }
}