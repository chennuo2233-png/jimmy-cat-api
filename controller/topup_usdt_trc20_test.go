package controller

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTronAddressToEVMHexValidatesBase58Check(t *testing.T) {
	converted, err := tronAddressToEVMHex("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")
	require.NoError(t, err)
	assert.Equal(t, usdtTRC20ContractHex, converted)

	_, err = tronAddressToEVMHex("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6u")
	assert.Error(t, err)
}

func TestIsTRONTransactionSolidifiedRequiresMatchingSuccessfulReceipt(t *testing.T) {
	const txHash = "309b6fa3d01353e46f57dd8a8f27611f98e392b50d035cef213f2c55225a8bd2"
	service.InitHttpClient()
	originalURL := setting.USDTTRC20SolidityURL
	t.Cleanup(func() { setting.USDTTRC20SolidityURL = originalURL })

	tests := []struct {
		name      string
		response  string
		confirmed bool
		wantError bool
	}{
		{name: "solidified success", response: `{"id":"` + txHash + `","receipt":{"result":"SUCCESS"}}`, confirmed: true},
		{name: "not solidified yet", response: `{}`, confirmed: false},
		{name: "failed execution", response: `{"id":"` + txHash + `","receipt":{"result":"FAILED"}}`, wantError: true},
		{name: "different transaction", response: `{"id":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","receipt":{"result":"SUCCESS"}}`, wantError: true},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				assert.Equal(t, "/walletsolidity/gettransactioninfobyid", r.URL.Path)
				w.Header().Set("Content-Type", "application/json")
				_, err := w.Write([]byte(test.response))
				require.NoError(t, err)
			}))
			defer server.Close()
			setting.USDTTRC20SolidityURL = server.URL

			confirmed, err := isTRONTransactionSolidified(context.Background(), "0x"+txHash)
			if test.wantError {
				assert.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, test.confirmed, confirmed)
		})
	}
}
