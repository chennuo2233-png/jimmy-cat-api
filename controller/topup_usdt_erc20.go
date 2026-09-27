package controller

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const (
	// Tether's official USDT contract on Ethereum mainnet uses six decimals.
	usdtERC20Contract              = "0xdac17f958d2ee523a2206206994597c13d831ec7"
	usdtERC20OrderLifetime         = 30 * time.Minute
	usdtERC20RequiredConfirmations = 12
	// One thousand Ethereum blocks cover far longer than the 30-minute order
	// lifetime while remaining within common eth_getLogs provider limits.
	usdtERC20ScanBlockWindow = int64(1000)
)

type usdtERC20OrderResponse struct {
	OrderID   string `json:"order_id"`
	Address   string `json:"address"`
	Amount    string `json:"amount"`
	Network   string `json:"network"`
	ExpiresAt int64  `json:"expires_at"`
	Status    string `json:"status"`
}

func RequestUSDTERC20Pay(c *gin.Context) {
	var req struct {
		Amount int64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount < getMinTopup() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid amount"})
		return
	}
	addresses := usdtERC20ReceivingAddresses()
	if strings.TrimSpace(setting.USDTERC20RPCURL) == "" || len(addresses) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "USDT ERC-20 is not configured"})
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

	for attempt := 0; attempt < 20; attempt++ {
		address := addresses[attempt%len(addresses)]
		suffix, err := rand.Int(rand.Reader, big.NewInt(9000))
		if err != nil {
			common.ApiError(c, err)
			return
		}
		paymentAmount := baseAmount.Add(decimal.NewFromInt(suffix.Int64() + 1000).Shift(-6)).StringFixed(6)
		tradeNo := fmt.Sprintf("USDT_ERC20-%d-%s", userID, common.GetRandomString(16))
		expiresAt := time.Now().Add(usdtERC20OrderLifetime).Unix()
		order := &model.TopUp{
			UserId:          userID,
			Amount:          int64(creditQuota),
			Money:           decimal.RequireFromString(paymentAmount).InexactFloat64(),
			TradeNo:         tradeNo,
			PaymentMethod:   model.PaymentMethodUSDTERC20,
			PaymentProvider: model.PaymentProviderUSDTERC20,
			CreateTime:      common.GetTimestamp(),
			Status:          common.TopUpStatusPending,
			PaymentAddress:  address,
			PaymentAmount:   paymentAmount,
			PaymentExpireAt: expiresAt,
		}
		if err := model.CreateUSDTERC20TopUp(order); errors.Is(err, model.ErrUSDTERC20AmountReserved) {
			continue
		} else if err != nil {
			common.ApiError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtERC20OrderResponse{
			OrderID: tradeNo, Address: address, Amount: paymentAmount, Network: "ERC-20", ExpiresAt: expiresAt, Status: common.TopUpStatusPending,
		}})
		return
	}
	c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "could not reserve a unique payment amount"})
}

func usdtERC20ReceivingAddresses() []string {
	values := strings.Split(strings.ToLower(setting.USDTERC20Addresses), ",")
	addresses := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if isEthereumAddress(value) {
			addresses = append(addresses, value)
		}
	}
	return addresses
}

func GetUSDTERC20PayStatus(c *gin.Context) {
	order, err := model.GetUSDTERC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	if errors.Is(err, model.ErrTopUpNotFound) || order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	if order.Status == common.TopUpStatusPending && order.PaymentExpireAt <= common.GetTimestamp() {
		if err := model.UpdatePendingTopUpStatus(order.TradeNo, model.PaymentProviderUSDTERC20, common.TopUpStatusExpired); err != nil && !errors.Is(err, model.ErrTopUpStatusInvalid) {
			common.SysError(fmt.Sprintf("usdt erc20 expire trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTERC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	} else if order.Status == common.TopUpStatusPending {
		if _, err := scanUSDTERC20Order(c.Request.Context(), *order); err != nil {
			common.SysError(fmt.Sprintf("usdt erc20 status scan trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTERC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	}
	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtERC20OrderResponse{
		OrderID: order.TradeNo, Address: order.PaymentAddress, Amount: order.PaymentAmount, Network: "ERC-20", ExpiresAt: order.PaymentExpireAt, Status: order.Status,
	}})
}

func ConfirmUSDTERC20Pay(c *gin.Context) {
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
			GetUSDTERC20PayStatus(c)
			return
		}
	}
	c.Params = append(c.Params, gin.Param{Key: "order_id", Value: req.OrderID})
	GetUSDTERC20PayStatus(c)
}

func ScanUSDTERC20PendingOrders(ctx context.Context) (int, error) {
	if err := model.ExpireUSDTERC20PendingTopUps(); err != nil {
		return 0, err
	}
	orders, err := model.GetPendingUSDTERC20TopUps()
	if err != nil {
		return 0, err
	}
	completed := 0
	for _, order := range orders {
		settled, err := scanUSDTERC20Order(ctx, order)
		if err != nil {
			common.SysError(fmt.Sprintf("usdt erc20 scan trade_no=%s: %v", order.TradeNo, err))
			continue
		}
		if settled {
			completed++
		}
	}
	return completed, nil
}

func scanUSDTERC20Order(ctx context.Context, order model.TopUp) (bool, error) {
	if order.PaymentExpireAt <= common.GetTimestamp() || order.Status != common.TopUpStatusPending {
		return false, nil
	}
	var latestHex string
	if err := callJSONRPC(ctx, setting.USDTERC20RPCURL, "eth_blockNumber", []any{}, &latestHex); err != nil {
		return false, err
	}
	latest, err := strconv.ParseInt(strings.TrimPrefix(latestHex, "0x"), 16, 64)
	if err != nil {
		return false, err
	}
	fromBlock := latest - usdtERC20ScanBlockWindow
	if fromBlock < 0 {
		fromBlock = 0
	}
	toTopic := "0x" + strings.Repeat("0", 24) + strings.TrimPrefix(strings.ToLower(order.PaymentAddress), "0x")
	filter := map[string]any{
		"fromBlock": fmt.Sprintf("0x%x", fromBlock),
		"toBlock":   "latest",
		"address":   usdtERC20Contract,
		"topics":    []any{transferTopic, nil, toTopic},
	}
	var logs []tokenTransferLog
	if err := callJSONRPC(ctx, setting.USDTERC20RPCURL, "eth_getLogs", []any{filter}, &logs); err != nil {
		return false, err
	}
	expected := decimal.RequireFromString(order.PaymentAmount)
	for _, log := range logs {
		if strings.ToLower(log.Address) != usdtERC20Contract || len(log.Topics) < 3 || strings.ToLower(log.Topics[0]) != transferTopic {
			continue
		}
		blockNumber, err := strconv.ParseInt(strings.TrimPrefix(log.BlockNumber, "0x"), 16, 64)
		if err != nil || latest-blockNumber < usdtERC20RequiredConfirmations {
			continue
		}
		amount := new(big.Int)
		if _, ok := amount.SetString(strings.TrimPrefix(log.Data, "0x"), 16); !ok {
			continue
		}
		if !decimal.NewFromBigInt(amount, -6).Equal(expected) {
			continue
		}
		settled, err := model.CompleteUSDTERC20TopUp(order.TradeNo, strings.ToLower(log.TransactionHash))
		if err != nil {
			return false, err
		}
		return settled, nil
	}
	return false, nil
}
