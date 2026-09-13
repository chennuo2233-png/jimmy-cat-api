package controller

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// SaveUSDTTRC20Config requires the administrator's current password because a
// receiving-address change redirects customer funds. Only public addresses and
// read-only Ankr endpoints are stored; wallet private keys are never required.
func SaveUSDTTRC20Config(c *gin.Context) {
	var req struct {
		Password    string   `json:"password"`
		RPCURL      string   `json:"rpc_url"`
		SolidityURL string   `json:"solidity_url"`
		Addresses   []string `json:"addresses"`
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
	solidityURL := strings.TrimRight(strings.TrimSpace(req.SolidityURL), "/")
	if !strings.HasPrefix(rpcURL, "https://") || !strings.HasPrefix(solidityURL, "https://") || len(req.Addresses) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid USDT TRC-20 configuration"})
		return
	}

	clean := make([]string, 0, len(req.Addresses))
	seen := make(map[string]struct{}, len(req.Addresses))
	for _, address := range req.Addresses {
		address = strings.TrimSpace(address)
		if _, err := tronAddressToEVMHex(address); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid TRON address"})
			return
		}
		if _, ok := seen[address]; ok {
			continue
		}
		seen[address] = struct{}{}
		clean = append(clean, address)
	}
	if err := model.UpdateOption("USDTTRC20RPCURL", rpcURL); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateOption("USDTTRC20SolidityURL", solidityURL); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateOption("USDTTRC20Addresses", strings.Join(clean, ",")); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": ""})
}
