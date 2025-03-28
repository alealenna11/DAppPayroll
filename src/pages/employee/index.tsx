import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    WalletOutlined,
    DollarOutlined,
    GiftOutlined,
    HistoryOutlined,
    UserOutlined
} from '@ant-design/icons';
import styles from './EmployeeDashboard.module.css';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, ABI } from '../../lib/contract';
import { formatUnits, parseUnits } from 'viem';
import { toast } from 'react-toastify';

interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'other';
    amount: number;
    date: Date;
    status: 'pending' | 'completed' | 'rejected';
}

interface EmployeeDetails {
    addr: string;
    salary: bigint;
    lastPaid: bigint;
    isActive: boolean;
}

const EmployeeDashboard: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [walletAddress, setWalletAddress] = useState<string>('');
    const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null);
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [availableSalaryClaim, setAvailableSalaryClaim] = useState<number>(0);
    const [availableBonusClaim, setAvailableBonusClaim] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Contract reads
    const { data: employeeData } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "getEmployee",
        args: [address],
        enabled: isConnected,
    });

    const { data: claimableSalary } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "calculateClaimableSalary",
        args: [address],
        enabled: isConnected,
    });

    const { data: claimableBonus } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: "calculateClaimableBonus",
        args: [address],
        enabled: isConnected,
    });

    // Contract writes
    const { writeContractAsync } = useWriteContract();

    // Update state when contract data changes
    useEffect(() => {
        if (address) {
            setWalletAddress(address);
        }

        if (employeeData) {
            setEmployeeDetails(employeeData as EmployeeDetails);
        }

        if (claimableSalary) {
            setAvailableSalaryClaim(Number(formatUnits(claimableSalary as bigint, 6))); // Assuming USDC decimals
        }

        if (claimableBonus) {
            setAvailableBonusClaim(Number(formatUnits(claimableBonus as bigint, 6))); // Assuming USDC decimals
        }
    }, [address, employeeData, claimableSalary, claimableBonus]);

    const handleSalaryClaim = async () => {
        try {
            if (availableSalaryClaim <= 0) {
                toast.error('No salary available to claim');
                return;
            }

            const txHash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "claimSalary",
            });

            toast.info('Salary claim submitted', { autoClose: 5000 });

            const newTransaction: Transaction = {
                id: `claim-${Date.now()}`,
                type: 'salary',
                amount: availableSalaryClaim,
                date: new Date(),
                status: 'pending'
            };

            setTransactions([newTransaction, ...transactions]);
            setAvailableSalaryClaim(0);

            // Simulate waiting for transaction confirmation
            setTimeout(() => {
                toast.success('Salary claimed successfully!');
                // Update transaction status
                setTransactions(prev => prev.map(tx =>
                    tx.id === newTransaction.id ? { ...tx, status: 'completed' } : tx
                ));
            }, 15000);
        } catch (error) {
            console.error('Salary claim failed', error);
            toast.error('Salary claim failed');
            setTransactions(prev => prev.map(tx =>
                tx.id === `claim-${Date.now()}` ? { ...tx, status: 'rejected' } : tx
            ));
        }
    };

    const handleBonusClaim = async () => {
        try {
            if (availableBonusClaim <= 0) {
                toast.error('No bonus available to claim');
                return;
            }

            const txHash = await writeContractAsync({
                address: CONTRACT_ADDRESS,
                abi: ABI,
                functionName: "claimBonus",
            });

            toast.info('Bonus claim submitted', { autoClose: 5000 });

            const newTransaction: Transaction = {
                id: `bonus-${Date.now()}`,
                type: 'bonus',
                amount: availableBonusClaim,
                date: new Date(),
                status: 'pending'
            };

            setTransactions([newTransaction, ...transactions]);
            setAvailableBonusClaim(0);

            // Simulate waiting for transaction confirmation
            setTimeout(() => {
                toast.success('Bonus claimed successfully!');
                // Update transaction status
                setTransactions(prev => prev.map(tx =>
                    tx.id === newTransaction.id ? { ...tx, status: 'completed' } : tx
                ));
            }, 15000);
        } catch (error) {
            console.error('Bonus claim failed', error);
            toast.error('Bonus claim failed');
            setTransactions(prev => prev.map(tx =>
                tx.id === `bonus-${Date.now()}` ? { ...tx, status: 'rejected' } : tx
            ));
 
        }
    }, [isAddEmployeeConfirming]);

    // Notify on batch payment success
    useEffect(() => {
        if (isBatchPayConfirming) {
            toast.success("Batch payment executed!");
        }
    }, [isBatchPayConfirming]);

    // --- UI ---
    if (address !== isOwner) {
        return (
            <div className="p-4 text-center">
                <h2 className="text-xl font-bold">Admin Access Required</h2>
                <p>Only the contract owner can access this dashboard.</p>
            </div>
        );
    }

    if (!isConnected) {
        return (
            <div className={styles.notConnected}>
                <h2>Wallet Not Connected</h2>
                <p>Please connect your wallet to access the dashboard</p>
            </div>
        );
    }

    return (
 
        <motion.div
            className={styles.employeeDashboard}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Employee Header */}
            <motion.div
                className={styles.dashboardHeader}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
            >
                <div className={styles.headerContent}>
                    <UserOutlined className={styles.headerIcon} />
                    <div className={styles.employeeInfo}>
                        <h1>{employeeDetails?.addr ? `${employeeDetails.addr.slice(0, 6)}...${employeeDetails.addr.slice(-4)}` : 'Employee'}</h1>
                        <p>{employeeDetails?.isActive ? 'Active Employee' : 'Inactive'}</p>
                    </div>
                    <motion.div
                        className={styles.walletInfo}
                        whileHover={{ scale: 1.05 }}
                    >
                        <WalletOutlined />
                        <span>{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not Connected'}</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Financial Overview */}
            <div className={styles.financialSection}>
                {/* Wallet Balance - You might want to fetch this from a token contract */}
                <motion.div
                    className={styles.financialCard}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                >
                    <WalletOutlined className={styles.cardIcon} />
                    <div className={styles.cardContent}>
                        <h3>Wallet Balance</h3>
                        <p>${walletBalance.toFixed(2)}</p>
                    </div>
                </motion.div>
 

            {/* Add Employee Form */}
            <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Add Employee</h3>
                <input
                    type="text"
                    placeholder="Wallet Address"
                    value={newEmployeeAddr}
                    onChange={(e) => setNewEmployeeAddr(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                />
                <input
                    type="number"
                    placeholder="Salary (USDC)"
                    value={newEmployeeSalary}
                    onChange={(e) => setNewEmployeeSalary(e.target.value)}
                    className="p-2 border rounded w-full mb-2"
                />
                <button
                    onClick={handleAddEmployee}
                    disabled={isAddingEmployee}
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
 
                    <DollarOutlined className={styles.cardIcon} />
                    <div className={styles.cardContent}>
                        <h3>Available Salary</h3>
                        <p>${availableSalaryClaim.toFixed(2)}</p>
                        <button
                            onClick={handleSalaryClaim}
                            className={styles.claimButton}
                            disabled={availableSalaryClaim <= 0 || !employeeDetails?.isActive}
                        >
                            Claim Salary
                        </button>
                    </div>
                </motion.div>
 

            {/* Batch Payment */}
            <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Batch Payment</h3>
                <p className="mb-2">Pay all eligible employees at once.</p>
                <button
                    onClick={handleBatchPay}
                    disabled={isPaying}
                    className="bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
 
                    <GiftOutlined className={styles.cardIcon} />
                    <div className={styles.cardContent}>
                        <h3>Available Bonus</h3>
                        <p>${availableBonusClaim.toFixed(2)}</p>
                        <button
                            onClick={handleBonusClaim}
                            className={styles.claimButton}
                            disabled={availableBonusClaim <= 0 || !employeeDetails?.isActive}
                        >
                            Claim Bonus
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Transaction History */}
            <motion.div
                className={styles.transactionSection}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className={styles.sectionHeader}>
                    <HistoryOutlined className={styles.sectionIcon} />
                    <h2>Transaction History</h2>
                </div>
                <div className={styles.transactionList}>
                    {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <motion.div
                                key={transaction.id}
                                className={styles.transactionItem}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                <div className={styles.transactionDetails}>
                                    <h4>{transaction.type === 'salary' ? 'Salary Claim' : 'Bonus Claim'}</h4>
                                    <p>${transaction.amount.toFixed(2)}</p>
                                </div>
                                <div className={styles.transactionMeta}>
                                    <span>{transaction.date.toLocaleDateString()}</span>
                                    <span
                                        className={`${styles.transactionStatus} ${styles[transaction.status]}`}
                                    >
                                        {transaction.status}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className={styles.noTransactions}>No transactions yet</p>
                    )}
 
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;