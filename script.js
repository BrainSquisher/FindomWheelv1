let provider, signer, contract;
const contractAddress = "0x1e3f486767b14096fc64e4e13a36c0241cddca43";
const tokenAddress = "0x3C36F2A6E56840ca4a93aDb1B26F6dbD66c5eFb4";
const abi = [
    "function commit() external",
    "function spinWheel() external",
    "function token() public view returns (address)",
    "event WheelSpun(address indexed player, uint8 outcome, string code)",
    "event Committed(address indexed player)"
];
const tokenAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const connectButton = document.getElementById('connectButton');
const commitButton = document.getElementById('commitButton');
const spinButton = document.getElementById('spinButton');
const wheelContainer = document.getElementById('wheelContainer');
const wheel = document.getElementById('wheel');
const result = document.getElementById('result');

connectButton.addEventListener('click', connectWallet);
commitButton.addEventListener('click', commit);
spinButton.addEventListener('click', spinWheel);

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, abi, signer);
            
            connectButton.style.display = 'none';
            commitButton.style.display = 'block';
            
            // Approve token spending
            const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
            console.log("Approving token spending...");
            const approveTx = await tokenContract.approve(contractAddress, ethers.constants.MaxUint256);
            console.log("Approval transaction sent:", approveTx.hash);
            await approveTx.wait();
            console.log("Approval confirmed");
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    } else {
        console.log('Please install MetaMask!');
    }
}

async function commit() {
    try {
        const tx = await contract.commit();
        await tx.wait();
        commitButton.style.display = 'none';
        wheelContainer.style.display = 'block';
    } catch (error) {
        console.error("Error committing:", error);
        result.textContent = "Error committing. Check console for details.";
    }
}

async function spinWheel() {
    try {
        console.log("Spinning wheel...");
        const tx = await contract.spinWheel();
        console.log("Transaction sent:", tx.hash);
        result.textContent = "Spinning the wheel...";
        wheel.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        console.log("Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);
        
        const event = receipt.events.find(e => e.event === "WheelSpun");
        if (!event) {
            throw new Error("WheelSpun event not found in transaction receipt");
        }
        
        const outcome = event.args.outcome.toNumber();
        const code = event.args.code;
        
        const prizes = ["0.50€", "1€", "1.50€", "1.50€", "Free Session"];
        if (outcome === 4) {
            result.textContent = `Congratulations! You won a Free Session. Your code is: ${code}`;
        } else {
            result.textContent = `You won: ${prizes[outcome]}`;
        }
    } catch (error) {
        console.error("Error spinning the wheel:", error);
        if (error.data) {
            console.error("Error data:", error.data);
        }
        result.textContent = "Error spinning the wheel. Check console for details.";
    }
}
async function checkNetwork() {
    const network = await provider.getNetwork();
    if (network.chainId !== 10) { // 10 is Optimism Mainnet
        alert("Please switch to Optimism Mainnet");
        throw new Error("Incorrect network");
    }
}
