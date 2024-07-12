let provider, signer, contract;
const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
const tokenAddress = "YOUR_TOKEN_ADDRESS_HERE";
const abi = [
    "function spinWheel() external",
    "function token() public view returns (address)",
    "event WheelSpun(address indexed player, uint8 outcome)",
    "event FreeSessionAwarded(address indexed player)"
];
const tokenAbi = [
    "function approve(address spender, uint256 amount) external returns (bool)"
];

const connectButton = document.getElementById('connectButton');
const spinButton = document.getElementById('spinButton');
const wheelContainer = document.getElementById('wheelContainer');
const wheel = document.getElementById('wheel');
const result = document.getElementById('result');

connectButton.addEventListener('click', connectWallet);
spinButton.addEventListener('click', spinWheel);

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, abi, signer);
            
            connectButton.style.display = 'none';
            wheelContainer.style.display = 'block';
            
            // Approve token spending
            const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
            await tokenContract.approve(contractAddress, ethers.constants.MaxUint256);
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    } else {
        console.log('Please install MetaMask!');
    }
}

async function spinWheel() {
    try {
        const tx = await contract.spinWheel();
        result.textContent = "Spinning the wheel...";
        wheel.style.transform = `rotate(${Math.random() * 360}deg)`;
        
        const receipt = await tx.wait();
        const event = receipt.events.find(e => e.event === "WheelSpun" || e.event === "FreeSessionAwarded");
        
        if (event.event === "WheelSpun") {
            const outcome = event.args.outcome.toNumber();
            const prizes = ["5€", "10€", "20€", "50€", "Free Session"];
            result.textContent = `You won: ${prizes[outcome]}`;
        } else {
            result.textContent = "You won a Free Session!";
        }
    } catch (error) {
        console.error("Error spinning the wheel:", error);
        result.textContent = "Error spinning the wheel. Check console for details.";
    }
}
