package setting

// USDT BEP-20 direct-payment configuration. The RPC URL is intentionally an
// operator setting: it may contain a provider API key and must never be sent
// to browsers or committed as a deployment default.
var (
	USDTBEP20RPCURL    string
	USDTBEP20Addresses string
)
