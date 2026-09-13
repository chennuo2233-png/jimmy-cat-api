package controller

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const (
	usdtBEP20Contract              = "0x55d398326f99059ff775485246999027b3197955"
	transferTopic                  = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
	usdtBEP20OrderLifetime         = 30 * time.Minute
	usdtBEP20RequiredConfirmations = 12
	usdtBEP20ScanBlockWindow       = int64(1000)
)

type usdtBEP20OrderResponse struct {
	OrderID   string `json:"order_id"`
	Address   string `json:"address"`
	Amount    string `json:"amount"`
	Network   string `json:"network"`
	ExpiresAt int64  `json:"expires_at"`
	Status    string `json:"status"`
}

// RequestUSDTBEP20Pay reserves a unique six-decimal USDT amount. The extra
// 0.001000–0.009999 USDT suffix lets one receiving wallet safely match many
// concurrent orders without trusting a browser-supplied transaction hash.
func RequestUSDTBEP20Pay(c *gin.Context) {
	var req struct {
		Amount int64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount < getMinTopup() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid amount"})
		return
	}
	addresses := usdtBEP20ReceivingAddresses()
	if strings.TrimSpace(setting.USDTBEP20RPCURL) == "" || len(addresses) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "USDT BEP-20 is not configured"})
		return
	}

	userID := c.GetInt("id")
	creditQuota, err := validateTopUpQuota(req.Amount)
	if err != nil || model.ValidateTopUpQuotaCapacity(userID, creditQuota) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid amount"})
		return
	}
	group, err := model.GetUserGroup(userID, true)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	baseAmount := decimal.NewFromFloat(getPayMoney(req.Amount, group)).Round(2)
	if !baseAmount.IsPositive() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid amount"})
		return
	}

	address := addresses[0]
	for attempt := 0; attempt < 20; attempt++ {
		address = addresses[attempt%len(addresses)]
		suffix, err := rand.Int(rand.Reader, big.NewInt(9000))
		if err != nil {
			common.ApiError(c, err)
			return
		}
		paymentAmount := baseAmount.Add(decimal.NewFromInt(suffix.Int64() + 1000).Shift(-6)).StringFixed(6)
		tradeNo := fmt.Sprintf("USDT_BEP20-%d-%s", userID, common.GetRandomString(16))
		expiresAt := time.Now().Add(usdtBEP20OrderLifetime).Unix()
		order := &model.TopUp{
			UserId:          userID,
			Amount:          int64(creditQuota),
			Money:           decimal.RequireFromString(paymentAmount).InexactFloat64(),
			TradeNo:         tradeNo,
			PaymentMethod:   model.PaymentMethodUSDTBEP20,
			PaymentProvider: model.PaymentProviderUSDTBEP20,
			CreateTime:      common.GetTimestamp(),
			Status:          common.TopUpStatusPending,
			PaymentAddress:  address,
			PaymentAmount:   paymentAmount,
			PaymentExpireAt: expiresAt,
		}
		if err := model.CreateUSDTBEP20TopUp(order); errors.Is(err, model.ErrUSDTBEP20AmountReserved) {
			continue
		} else if err != nil {
			common.ApiError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtBEP20OrderResponse{
			OrderID: tradeNo, Address: address, Amount: paymentAmount, Network: "BEP-20", ExpiresAt: expiresAt, Status: common.TopUpStatusPending,
		}})
		return
	}
	c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "could not reserve a unique payment amount"})
}

func usdtBEP20ReceivingAddresses() []string {
	values := strings.Split(strings.ToLower(setting.USDTBEP20Addresses), ",")
	addresses := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if len(value) == 42 && strings.HasPrefix(value, "0x") {
			addresses = append(addresses, value)
		}
	}
	return addresses
}

func GetUSDTBEP20PayStatus(c *gin.Context) {
	order, err := model.GetUSDTBEP20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	if errors.Is(err, model.ErrTopUpNotFound) || order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	if order.Status == common.TopUpStatusPending && order.PaymentExpireAt <= common.GetTimestamp() {
		if err := model.UpdatePendingTopUpStatus(order.TradeNo, model.PaymentProviderUSDTBEP20, common.TopUpStatusExpired); err != nil && !errors.Is(err, model.ErrTopUpStatusInvalid) {
			common.SysError(fmt.Sprintf("usdt bep20 expire trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTBEP20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	} else if order.Status == common.TopUpStatusPending {
		if _, err := scanUSDTBEP20Order(c.Request.Context(), *order); err != nil {
			common.SysError(fmt.Sprintf("usdt bep20 status scan trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTBEP20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	}
	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtBEP20OrderResponse{OrderID: order.TradeNo, Address: order.PaymentAddress, Amount: order.PaymentAmount, Network: "BEP-20", ExpiresAt: order.PaymentExpireAt, Status: order.Status}})
}

// ConfirmUSDTBEP20Pay remains a compatibility endpoint. It does not trust a
// user-provided transaction hash; the server scans the chain itself.
func ConfirmUSDTBEP20Pay(c *gin.Context) {
	var req struct {
		OrderID string `json:"order_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.OrderID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid order"})
		return
	}
	for index, param := range c.Params {
		if param.Key == "order_id" {
			c.Params[index].Value = req.OrderID
			GetUSDTBEP20PayStatus(c)
			return
		}
	}
	c.Params = append(c.Params, gin.Param{Key: "order_id", Value: req.OrderID})
	GetUSDTBEP20PayStatus(c)
}

func ScanUSDTBEP20PendingOrders(ctx context.Context) (int, error) {
	if err := model.ExpireUSDTBEP20PendingTopUps(); err != nil {
		return 0, err
	}
	orders, err := model.GetPendingUSDTBEP20TopUps()
	if err != nil {
		return 0, err
	}
	completed := 0
	for _, order := range orders {
		settled, err := scanUSDTBEP20Order(ctx, order)
		if err != nil {
			common.SysError(fmt.Sprintf("usdt bep20 scan trade_no=%s: %v", order.TradeNo, err))
			continue
		}
		if settled {
			completed++
		}
	}
	return completed, nil
}

type tokenTransferLog struct {
	Address         string   `json:"address"`
	Topics          []string `json:"topics"`
	Data            string   `json:"data"`
	TransactionHash string   `json:"transactionHash"`
	BlockNumber     string   `json:"blockNumber"`
}

func scanUSDTBEP20Order(ctx context.Context, order model.TopUp) (bool, error) {
	if order.PaymentExpireAt <= common.GetTimestamp() || order.Status != common.TopUpStatusPending {
		return false, nil
	}
	var latestHex string
	if err := callJSONRPC(ctx, setting.USDTBEP20RPCURL, "eth_blockNumber", []any{}, &latestHex); err != nil {
		return false, err
	}
	latest, err := strconv.ParseInt(strings.TrimPrefix(latestHex, "0x"), 16, 64)
	if err != nil {
		return false, err
	}
	fromBlock := latest - usdtBEP20ScanBlockWindow
	if fromBlock < 0 {
		fromBlock = 0
	}
	toTopic := "0x" + strings.Repeat("0", 24) + strings.TrimPrefix(strings.ToLower(order.PaymentAddress), "0x")
	filter := map[string]any{
		"fromBlock": fmt.Sprintf("0x%x", fromBlock),
		"toBlock":   "latest",
		"address":   usdtBEP20Contract,
		"topics":    []any{transferTopic, nil, toTopic},
	}
	var logs []tokenTransferLog
	if err := callJSONRPC(ctx, setting.USDTBEP20RPCURL, "eth_getLogs", []any{filter}, &logs); err != nil {
		return false, err
	}
	expected := decimal.RequireFromString(order.PaymentAmount)
	for _, log := range logs {
		if strings.ToLower(log.Address) != usdtBEP20Contract || len(log.Topics) < 3 || strings.ToLower(log.Topics[0]) != transferTopic {
			continue
		}
		blockNumber, err := strconv.ParseInt(strings.TrimPrefix(log.BlockNumber, "0x"), 16, 64)
		if err != nil || latest-blockNumber < usdtBEP20RequiredConfirmations {
			continue
		}
		amount := new(big.Int)
		if _, ok := amount.SetString(strings.TrimPrefix(log.Data, "0x"), 16); !ok {
			continue
		}
		if !decimal.NewFromBigInt(amount, -18).Equal(expected) {
			continue
		}
		settled, err := model.CompleteUSDTBEP20TopUp(order.TradeNo, strings.ToLower(log.TransactionHash))
		if err != nil {
			return false, err
		}
		return settled, nil
	}
	return false, nil
}

func callJSONRPC(ctx context.Context, rpcURL, method string, params any, result any) error {
	payload, err := common.Marshal(map[string]any{"jsonrpc": "2.0", "id": 1, "method": method, "params": params})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, rpcURL, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := service.GetHttpClient().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("rpc returned HTTP %d", resp.StatusCode)
	}
	var response struct {
		Result json.RawMessage `json:"result"`
		Error  *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := common.DecodeJson(resp.Body, &response); err != nil {
		return err
	}
	if response.Error != nil {
		return errors.New(response.Error.Message)
	}
	return common.Unmarshal(response.Result, result)
}
