package controller

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// SaveUSDTBEP20Config keeps custody addresses and the RPC endpoint behind a
// fresh password check. It is intentionally separate from UpdateOption so a
// stale administrator session cannot change where customer funds are sent.
func SaveUSDTBEP20Config(c *gin.Context) {
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
		// The authenticated administrator supplied an incorrect confirmation
		// password. This is a validation failure, not an expired login session.
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid password"})
		return
	}
	if !strings.HasPrefix(strings.TrimSpace(req.RPCURL), "https://") || len(req.Addresses) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid USDT BEP-20 configuration"})
		return
	}
	clean := make([]string, 0, len(req.Addresses))
	for _, address := range req.Addresses {
		address = strings.TrimSpace(address)
		if len(address) != 42 || !strings.HasPrefix(address, "0x") {
			c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid BSC address"})
			return
		}
		clean = append(clean, address)
	}
	if err := model.UpdateOption("USDTBEP20RPCURL", strings.TrimSpace(req.RPCURL)); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.UpdateOption("USDTBEP20Addresses", strings.Join(clean, ",")); err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": ""})
}
