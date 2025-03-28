import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from "wagmi";
import styles from "./Login.module.css";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ABI, CONTRACT_ADDRESS, CONTRACT_DEPLOYER } from "../../lib/contract";
export default function Login() {
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const router = useRouter();

 
     const { data: isEmployee } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: ABI, 
       functionName: "isEmployee",
        args: [address],
        query: {
            enabled: isConnected && selectedRole === "employee",
        },
    });
 
 

  useEffect(() => {
    const handleLogin = async () => {
      if (!isConnected) return;

      if (selectedRole === "manager") {
        if (address === CONTRACT_DEPLOYER) {
          router.push("/admin");
          toast.success("Login successful!");
        } else {
          await disconnect();
          toast.error("You are not the manager");
        }
      } else if (selectedRole === "employee") {
        if (isEmployee) {
          router.push("/employee");
        } else {
          toast.error('Sorry you are not the employee');
        }
      }
    };

 
            if (selectedRole === "manager") {
                if (address === CONTRACT_DEPLOYER) {
                    router.push("/admin");
                    toast.success("Login successful!");
                } else {
                    await disconnect();
                    toast.error("You are not the manager");
                }
            } else if (selectedRole === "employee") {
              if (isEmployee) {
                router.push("/employee");

              } else {
                await disconnect();
                toast.error("You are not the employee");
              }
            }
        };

        if (isConnected) {
            handleLogin();
}
     }, [isConnected, selectedRole]);
 
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      >
       <motion.div
        className={styles.card}
        // variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h2 className={styles.title}>Select Your Role</h2>
        <div className={styles.roleContainer}>
          <motion.div
            className={styles.roleSection}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className={styles.roleDescription}>For company manager</p>

            <motion.button
              onClick={() => {
                setSelectedRole("manager");
              }}
              className={styles.connectButton}
            //   variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className={styles.parentBtn}>
                <ConnectButton
                  label="Connect as Manager"
                  accountStatus={{
                    smallScreen: "avatar",
                    largeScreen: "full",
                  }}
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                  chainStatus={{
                    smallScreen: "icon",
                    largeScreen: "full",
                  }}
                />
              </div>
            </motion.button>
          </motion.div>

          <motion.div
            className={styles.roleSection}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => {
                          setSelectedRole("employee");
                      }}
          >
            <p className={styles.roleDescription}>
              For standard company employees
            </p>{" "}
            <div className={styles.parentBtn}>
              <ConnectButton
                label="Connect as Employee"
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "full",
                }}
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
                chainStatus={{
                  smallScreen: "icon",
                  largeScreen: "full",
                }}
              />
            </div>
          </motion.div>
        </div>
        <motion.p
          className={styles.footnote}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Select your role and connect your wallet to proceed
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

 