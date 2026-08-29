package controller

import (
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"
	"github.com/shopspring/decimal"

	"github.com/gin-gonic/gin"
)

// RequestUSDTBEP20Pay creates a pending, user-bound order. The wallet UI uses
// the returned address and amount, then polls the confirmation endpoint.
func RequestUSDTBEP20Pay(c *gin.Context) {
	var req struct { Amount int64 `json:"amount"` }
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount <= 0 { c.JSON(http.StatusBadRequest, gin.H{"message":"error","data":"invalid amount"}); return }
	addresses := strings.Split(strings.TrimSpace(setting.USDTBEP20Addresses), ",")
	if strings.TrimSpace(setting.USDTBEP20RPCURL) == "" || len(addresses) == 0 || strings.TrimSpace(addresses[0]) == "" { c.JSON(http.StatusServiceUnavailable, gin.H{"message":"error","data":"USDT BEP-20 is not configured"}); return }
	userID := c.GetInt("id")
	if rejectInvalidTopUpQuota(c, userID, req.Amount) { return }
	tradeNo := fmt.Sprintf("USDT_BEP20-%d-%d", userID, time.Now().UnixNano())
	// The final decimal suffix makes a shared receiving address attributable to one live order.
	money := float64(req.Amount)/float64(common.QuotaPerUnit) + float64(time.Now().UnixNano()%9000+1000)/1e8
	order := &model.TopUp{UserId:userID, Amount:req.Amount, Money:money, TradeNo:tradeNo, PaymentMethod:model.PaymentMethodUSDTBEP20, PaymentProvider:model.PaymentProviderUSDTBEP20, CreateTime:time.Now().Unix(), Status:common.TopUpStatusPending}
	if err := order.Insert(); err != nil { common.ApiError(c, err); return }
	c.JSON(http.StatusOK, gin.H{"message":"success","data":gin.H{"order_id":tradeNo,"address":strings.TrimSpace(addresses[int(time.Now().UnixNano())%len(addresses)]),"amount":fmt.Sprintf("%.6f", money),"network":"BEP-20","expires_at":time.Now().Add(30*time.Minute).Unix()}})
}

const usdtBEP20Contract = "0x55d398326f99059ff775485246999027b3197955"
const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"

func ConfirmUSDTBEP20Pay(c *gin.Context) {
	var req struct { OrderID string `json:"order_id"`; TxHash string `json:"tx_hash"` }
	if err := c.ShouldBindJSON(&req); err != nil || !strings.HasPrefix(req.TxHash, "0x") { c.JSON(http.StatusBadRequest, gin.H{"message":"error","data":"invalid transaction"}); return }
	order := model.GetTopUpByTradeNo(req.OrderID)
	if order == nil || order.UserId != c.GetInt("id") || order.PaymentProvider != model.PaymentProviderUSDTBEP20 { c.JSON(http.StatusNotFound, gin.H{"message":"error","data":"order not found"}); return }
	if order.Status == common.TopUpStatusSuccess { c.JSON(http.StatusOK, gin.H{"message":"success","data":"confirmed"}); return }
	body := strings.NewReader(fmt.Sprintf(`{"jsonrpc":"2.0","id":1,"method":"eth_getTransactionReceipt","params":["%s"]}`, req.TxHash))
	response, err := http.Post(setting.USDTBEP20RPCURL, "application/json", body)
	if err != nil { c.JSON(http.StatusBadGateway, gin.H{"message":"error","data":"RPC unavailable"}); return }
	defer response.Body.Close()
	var rpc struct { Result struct { Status string `json:"status"`; Logs []struct { Address string `json:"address"`; Topics []string `json:"topics"`; Data string `json:"data"` } `json:"logs"` } `json:"result"` }
	if err := common.DecodeJson(response.Body, &rpc); err != nil || rpc.Result.Status != "0x1" { c.JSON(http.StatusOK, gin.H{"message":"pending"}); return }
	expected := decimal.RequireFromString(fmt.Sprintf("%.6f", order.Money))
	addresses := strings.Split(strings.ToLower(setting.USDTBEP20Addresses), ",")
	for _, log := range rpc.Result.Logs {
		if strings.ToLower(log.Address) != usdtBEP20Contract || len(log.Topics) < 3 || strings.ToLower(log.Topics[0]) != transferTopic { continue }
		toTopic := strings.TrimPrefix(strings.ToLower(log.Topics[2]), "0x")
		if len(toTopic) != 64 { continue }
		to := "0x" + toTopic[24:]
		matched := false; for _, address := range addresses { if strings.TrimSpace(address) == to { matched = true; break } }; if !matched { continue }
		amount := new(big.Int); if _, ok := amount.SetString(strings.TrimPrefix(log.Data, "0x"), 16); !ok { continue }
		paid := decimal.NewFromBigInt(amount, -18); if !paid.Equal(expected) { continue }
		if err := model.RechargeUSDTBEP20(order.TradeNo); err != nil { common.ApiError(c, err); return }; c.JSON(http.StatusOK, gin.H{"message":"success","data":"confirmed"}); return
	}
	c.JSON(http.StatusOK, gin.H{"message":"pending"})
}
