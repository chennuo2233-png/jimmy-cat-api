package controller

import (
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// SaveUSDTERC20Config requires the administrator's current password because a
// receiving-address change redirects customer funds. Only public addresses and
// a read-only Ethereum JSON-RPC endpoint are stored.
func SaveUSDTERC20Config(c *gin.Context) {
	var req struct {
		Password  string   `json:"password"`
		RPCURL    string   `json:"rpc_url"`
		Addresses []string `json:"addresses"`
	}
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		common.ApiError(c, err)
		return
	}
	user, err := model.GetUserById(c.GetInt("id"), true)
	if err != nil || user.Password == "" || !common.ValidatePasswordAndHash(req.Password, user.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid password"})
		return
	}

	rpcURL := strings.TrimSpace(req.RPCURL)
	if !strings.HasPrefix(rpcURL, "https://") || len(req.Addresses) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid USDT ERC-20 configuration"})
		return
	}

	clean := make([]string, 0, len(req.Addresses))
	seen := make(map[string]struct{}, len(req.Addresses))
	for _, address := range req.Addresses {
		address = strings.ToLower(strings.TrimSpace(address))
		if !isEthereumAddress(address) {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid Ethereum address"})
			return
		}
		if _, ok := seen[address]; ok {
			continue
		}
		seen[address] = struct{}{}
		clean = append(clean, address)
	}
	if err := model.UpdateOption("USDTERC20RPCURL", rpcURL); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateOption("USDTERC20Addresses", strings.Join(clean, ",")); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": ""})
}

func isEthereumAddress(address string) bool {
	if len(address) != 42 || !strings.HasPrefix(address, "0x") {
		return false
	}
	_, err := hex.DecodeString(strings.TrimPrefix(address, "0x"))
	return err == nil
}
