export const mockSearchSuggestions = [
    { type: "address", value: "0x1234abcd5678effe901234abcd5678effe901234", sub: "User Wallet" },
    { type: "token", value: "0xTKN1234567890abcdef1234567890abcdef12345", sub: "IndiCoin (IND)" },
    { type: "block", value: "19453021", sub: "Mined 2 mins ago" },
    { type: "tx", value: "0x8888ffff7777eeee6666dddd5555cccc4444bbbb3333aaaa2222999911110000", sub: "Transfer 50 IND" },
];

export const mockNetworkStats = {
    latestBlock: 19453021,
    transactions: "2.4B+",
    totalEvents: "1.2B+",
    validators: 120,
    gasPrice: "34 Gwei",
    marketCap: "$420.69B",
};

export const mockRecentBlocks = [
    { number: 19453021, miner: "IndiPool", txCount: 142, time: "12 secs ago", gasUsed: "45%" },
    { number: 19453020, miner: "0xab...89", txCount: 89, time: "24 secs ago", gasUsed: "30%" },
    { number: 19453019, miner: "Titan", txCount: 204, time: "36 secs ago", gasUsed: "82%" },
    { number: 19453018, miner: "IndiPool", txCount: 13, time: "48 secs ago", gasUsed: "5%" },
    { number: 19453017, miner: "0xab...89", txCount: 198, time: "1 min ago", gasUsed: "75%" },
];

export const mockRecentTxns = [
    { hash: "0x...1a2b", from: "0x...4c", to: "0x...9e", value: "1.5 IND", time: "14 secs ago" },
    { hash: "0x...9f8e", from: "0x...11", to: "0x...22", value: "0.01 IND", time: "21 secs ago" },
    { hash: "0x...7d6c", from: "0x...aa", to: "0x...bb", value: "500 IND", time: "29 secs ago" },
    { hash: "0x...5b4a", from: "0x...cc", to: "IndiRouter", value: "0 IND", time: "41 secs ago" },
    { hash: "0x...3928", from: "0x...ff", to: "0x...ee", value: "12 IND", time: "55 secs ago" },
];
