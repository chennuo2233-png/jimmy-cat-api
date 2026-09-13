package setting

// USDT TRC-20 direct-payment configuration. Both endpoints are read-only:
// the JSON-RPC endpoint discovers Transfer logs and the Solidity API endpoint
// verifies that a matching transaction is irreversible before crediting it.
var (
	USDTTRC20RPCURL      string
	USDTTRC20SolidityURL string
	USDTTRC20Addresses   string
)
