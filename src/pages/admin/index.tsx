import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DashboardOutlined, UserOutlined, TeamOutlined, WalletOutlined,
    PlusOutlined, DeleteOutlined, PauseOutlined, PlayCircleOutlined,
    MoneyCollectOutlined, SaveOutlined
} from '@ant-design/icons';
import styles from './Dashboard.module.css';
 
import { toast } from 'react-toastify';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '../../lib/contract';
import { parseUnits, formatUnits } from 'viem';

interface Employee {
    addr: string;
    salary: bigint;
    lastPaid: bigint;
    isActive: boolean;
}
 
const Dashboard: React.FC = () => {
 
    const { address } = useAccount();
    const [depositAmount, setDepositAmount] = useState('');
    const [employeeAddress, setEmployeeAddress] = useState('');
    const [employeeSalary, setEmployeeSalary] = useState('');
    const [removeAddress, setRemoveAddress] = useState('');
 
    const [showAddForm, setShowAddForm] = useState(false);
    const [showRemoveForm, setShowRemoveForm] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isClient, setIsClient] = useState(false); 

    useEffect(() => {
        setIsClient(true); 
    }, []);
    // Contract reads
    const { data: owner } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "owner",
    });

    const { data: contractBalance, refetch: refetchBalance } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "balanceOf",
        args: [CONTRACT_ADDRESS],
    }) as { data: bigint | undefined; refetch: () => void };

    const { data: employeesData, refetch: refetchEmployees } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getEmployees",
    });

    const { data: paused } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "paused",
    });

    // Contract writes
    const { writeContractAsync } = useWriteContract();

    // Load employees
    useEffect(() => {
        if (employeesData) {
            setEmployees(employeesData as Employee[]);
        }
    }, [employeesData]);

    const handleDeposit = async () => {
        if (!depositAmount || isNaN(Number(depositAmount))) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            const amount = parseUnits(depositAmount, 18); // Assuming ETH decimals
            const txHash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "deposit",
                value: amount,
            });
            toast.info('Transaction submitted', { autoClose: 5000 });

            // Wait for transaction to be mined (simplified)
            setTimeout(() => {
                refetchBalance();
                toast.success('Deposit successful!');
                setDepositAmount('');
            }, 15000);
        } catch (error) {
            toast.error('Deposit failed');
            console.error(error);
        }
    };

    const handleAddEmployee = async () => {
        if (!employeeAddress || !employeeSalary || isNaN(Number(employeeSalary))) {
            toast.error('Please fill all fields correctly');
            return;
        }

        try {
            const salary = parseUnits(employeeSalary, 6); // USDC decimals
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "addEmployee",
                args: [employeeAddress, salary],
            });
            toast.success('Employee added!');
            setShowAddForm(false);
            setEmployeeAddress('');
            setEmployeeSalary('');
            refetchEmployees();
        } catch (error) {
            toast.error('Failed to add employee');
            console.error(error);
        }
    };

    const handleRemoveEmployee = async () => {
        if (!removeAddress) {
            toast.error('Please enter an address');
            return;
        }

        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "removeEmployee",
                args: [removeAddress],
            });
            toast.success('Employee removed!');
            setShowRemoveForm(false);
            setRemoveAddress('');
            refetchEmployees();
        } catch (error) {
            toast.error('Failed to remove employee');
            console.error(error);
        }
    };

    const handleTogglePause = async () => {
        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: paused ? "unpausePayments" : "pausePayments",
            });
            toast.success(`Payments ${paused ? 'unpaused' : 'paused'}!`);
        } catch (error) {
            toast.error('Failed to toggle pause');
            console.error(error);
        }
    };

    const handleBatchPay = async () => {
        try {
            await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "batchPay",
            });
            toast.success('Batch payment completed!');
            refetchBalance();
        } catch (error) {
            toast.error('Batch payment failed');
            console.error(error);
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
        hover: { scale: 1.05 }
    };

    const adminActions = [
        {
            icon: <PlusOutlined />,
            title: 'Add Employee',
            onClick: () => setShowAddForm(true)
        },
        {
            icon: <DeleteOutlined />,
            title: 'Remove Employee',
            onClick: () => setShowRemoveForm(true)
        },
        {
            icon: paused ? <PlayCircleOutlined /> : <PauseOutlined />,
            title: paused ? 'Unpause' : 'Pause',
            onClick: handleTogglePause
        },
        {
            icon: <MoneyCollectOutlined />,
            title: 'Batch Pay',
            onClick: handleBatchPay
        }
    ];
 

    // if (address && owner !== address) {
    //     return (
    //         <div className={styles.notOwner}>
    //             <h2>Access Denied</h2>
    //             <p>Only contract owner can access this dashboard</p>
    //         </div>
    //     );
    // }

    return (
 
        <motion.div className={styles.dashboardWrapper}>
            {/* Header */}
            <div className={styles.header}>
                <DashboardOutlined  />
                <h1>Payroll Admin</h1>
                <div className={styles.walletBadge}>
                    <WalletOutlined />
                    {isClient && ( 
                        <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    )}
                 </div>
            </div>

            {/* Balance and Deposit */}
            <div className={styles.depositCard}>
                <h3>Contract Balance: {contractBalance ? formatUnits(contractBalance, 18) : '0'} ETH</h3>
                <input
                    type="number"
                    placeholder="Amount (ETH)"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                />
                <button onClick={handleDeposit}>
                    <SaveOutlined /> Deposit
                </button>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <TeamOutlined />
                    <h3>Total Employees</h3>
                    <p>{employees.length}</p>
                </div>
                <div className={styles.statCard}>
                    <UserOutlined />
                    <h3>Active Employees</h3>
                    <p>{employees.filter(e => e.isActive).length}</p>
                </div>
            </div>

            {/* Actions */}
            <div className={styles.actionsGrid}>
                {adminActions.map((action, index) => (
                    <div
                        key={index}
                        className={styles.actionCard}
                        onClick={action.onClick}
                    >
                        <div className={styles.actionIcon}>{action.icon}</div>
                        <h3>{action.title}</h3>
                    </div>
                ))}
            </div>

            {/* Add Employee Form */}
            {showAddForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Add Employee</h2>
                        <input
                            placeholder="Wallet Address"
                            value={employeeAddress}
                            onChange={(e) => setEmployeeAddress(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Salary (USDC)"
                            value={employeeSalary}
                            onChange={(e) => setEmployeeSalary(e.target.value)}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={() => setShowAddForm(false)}>Cancel</button>
                            <button onClick={handleAddEmployee}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Employee Form */}
            {showRemoveForm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Remove Employee</h2>
                        <input
                            placeholder="Wallet Address"
                            value={removeAddress}
                            onChange={(e) => setRemoveAddress(e.target.value)}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={() => setShowRemoveForm(false)}>Cancel</button>
                            <button onClick={handleRemoveEmployee}>Confirm</button>
                        </div>
                    </div>
                </div>
 
            )}
        </motion.div>
    );
};

// Reusable Components
const StatCard = ({ icon, title, value }: any) => (
    <motion.div
        className={styles.statCard}
        whileHover={{ scale: 1.05 }}
    >
        <div className={styles.statIcon}>{icon}</div>
        <h3>{title}</h3>
        <p>{value}</p>
    </motion.div>
);

const ActionCard = ({ icon, title, onClick, disabled }: any) => (
    <motion.div
        className={styles.actionCard}
        whileHover={!disabled ? { scale: 1.05 } : {}}
        onClick={!disabled ? onClick : undefined}
        style={{ opacity: disabled ? 0.6 : 1 }}
    >
        <div className={styles.actionIcon}>{icon}</div>
        <h3>{title}</h3>
    </motion.div>
);

const Modal = ({ children, onClose }: any) => (
    <div className={styles.modalOverlay} onClick={onClose}>
        <motion.div
            className={styles.modalContent}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </motion.div>
    </div>
);

export default Dashboard;