package controller

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
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
	// Tether's official TRON USDT contract is
	// TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t. Ankr's Ethereum-compatible TRON
	// JSON-RPC expects the same address without TRON's 0x41 network prefix.
	usdtTRC20ContractHex     = "0xa614f803b6fd780986a42c78ec9c7f77e6ded13c"
	usdtTRC20OrderLifetime   = 30 * time.Minute
	usdtTRC20ScanBlockWindow = int64(1000)
	tronMainnetAddressPrefix = byte(0x41)
	tronBase58Alphabet       = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
)

type usdtTRC20OrderResponse struct {
	OrderID   string `json:"order_id"`
	Address   string `json:"address"`
	Amount    string `json:"amount"`
	Network   string `json:"network"`
	ExpiresAt int64  `json:"expires_at"`
	Status    string `json:"status"`
}

func RequestUSDTTRC20Pay(c *gin.Context) {
	var req struct {
		Amount int64 `json:"amount"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount < getMinTopup() {
		c.JSON(http.StatusBadRequest, gin.H{"message": "error", "data": "invalid amount"})
		return
	}
	addresses := usdtTRC20ReceivingAddresses()
	if strings.TrimSpace(setting.USDTTRC20RPCURL) == "" || strings.TrimSpace(setting.USDTTRC20SolidityURL) == "" || len(addresses) == 0 {
		c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "USDT TRC-20 is not configured"})
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
		tradeNo := fmt.Sprintf("USDT_TRC20-%d-%s", userID, common.GetRandomString(16))
		expiresAt := time.Now().Add(usdtTRC20OrderLifetime).Unix()
		order := &model.TopUp{
			UserId:          userID,
			Amount:          int64(creditQuota),
			Money:           decimal.RequireFromString(paymentAmount).InexactFloat64(),
			TradeNo:         tradeNo,
			PaymentMethod:   model.PaymentMethodUSDTTRC20,
			PaymentProvider: model.PaymentProviderUSDTTRC20,
			CreateTime:      common.GetTimestamp(),
			Status:          common.TopUpStatusPending,
			PaymentAddress:  address,
			PaymentAmount:   paymentAmount,
			PaymentExpireAt: expiresAt,
		}
		if err := model.CreateUSDTTRC20TopUp(order); errors.Is(err, model.ErrUSDTTRC20AmountReserved) {
			continue
		} else if err != nil {
			common.ApiError(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtTRC20OrderResponse{
			OrderID: tradeNo, Address: address, Amount: paymentAmount, Network: "TRC-20", ExpiresAt: expiresAt, Status: common.TopUpStatusPending,
		}})
		return
	}
	c.JSON(http.StatusServiceUnavailable, gin.H{"message": "error", "data": "could not reserve a unique payment amount"})
}

func usdtTRC20ReceivingAddresses() []string {
	values := strings.Split(setting.USDTTRC20Addresses, ",")
	addresses := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if _, err := tronAddressToEVMHex(value); err == nil {
			addresses = append(addresses, value)
		}
	}
	return addresses
}

func GetUSDTTRC20PayStatus(c *gin.Context) {
	order, err := model.GetUSDTTRC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	if errors.Is(err, model.ErrTopUpNotFound) || order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	if order.Status == common.TopUpStatusPending && order.PaymentExpireAt <= common.GetTimestamp() {
		if err := model.UpdatePendingTopUpStatus(order.TradeNo, model.PaymentProviderUSDTTRC20, common.TopUpStatusExpired); err != nil && !errors.Is(err, model.ErrTopUpStatusInvalid) {
			common.SysError(fmt.Sprintf("usdt trc20 expire trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTTRC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	} else if order.Status == common.TopUpStatusPending {
		if _, err := scanUSDTTRC20Order(c.Request.Context(), *order); err != nil {
			common.SysError(fmt.Sprintf("usdt trc20 status scan trade_no=%s: %v", order.TradeNo, err))
		}
		order, _ = model.GetUSDTTRC20TopUpForUser(c.Param("order_id"), c.GetInt("id"))
	}
	if order == nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "error", "data": "order not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "success", "data": usdtTRC20OrderResponse{
		OrderID: order.TradeNo, Address: order.PaymentAddress, Amount: order.PaymentAmount, Network: "TRC-20", ExpiresAt: order.PaymentExpireAt, Status: order.Status,
	}})
}

func ConfirmUSDTTRC20Pay(c *gin.Context) {
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
			GetUSDTTRC20PayStatus(c)
			return
		}
	}
	c.Params = append(c.Params, gin.Param{Key: "order_id", Value: req.OrderID})
	GetUSDTTRC20PayStatus(c)
}

func ScanUSDTTRC20PendingOrders(ctx context.Context) (int, error) {
	if err := model.ExpireUSDTTRC20PendingTopUps(); err != nil {
		return 0, err
	}
	orders, err := model.GetPendingUSDTTRC20TopUps()
	if err != nil {
		return 0, err
	}
	completed := 0
	for _, order := range orders {
		settled, err := scanUSDTTRC20Order(ctx, order)
		if err != nil {
			common.SysError(fmt.Sprintf("usdt trc20 scan trade_no=%s: %v", order.TradeNo, err))
			continue
		}
		if settled {
			completed++
		}
	}
	return completed, nil
}

func scanUSDTTRC20Order(ctx context.Context, order model.TopUp) (bool, error) {
	if order.PaymentExpireAt <= common.GetTimestamp() || order.Status != common.TopUpStatusPending {
		return false, nil
	}
	recipientHex, err := tronAddressToEVMHex(order.PaymentAddress)
	if err != nil {
		return false, err
	}
	var latestHex string
	if err := callJSONRPC(ctx, setting.USDTTRC20RPCURL, "eth_blockNumber", []any{}, &latestHex); err != nil {
		return false, err
	}
	latest, err := strconv.ParseInt(strings.TrimPrefix(latestHex, "0x"), 16, 64)
	if err != nil {
		return false, err
	}
	fromBlock := latest - usdtTRC20ScanBlockWindow
	if fromBlock < 0 {
		fromBlock = 0
	}
	toTopic := "0x" + strings.Repeat("0", 24) + strings.TrimPrefix(recipientHex, "0x")
	filter := map[string]any{
		"fromBlock": fmt.Sprintf("0x%x", fromBlock),
		"toBlock":   "latest",
		"address":   usdtTRC20ContractHex,
		"topics":    []any{transferTopic, nil, toTopic},
	}
	var logs []tokenTransferLog
	if err := callJSONRPC(ctx, setting.USDTTRC20RPCURL, "eth_getLogs", []any{filter}, &logs); err != nil {
		return false, err
	}
	expected := decimal.RequireFromString(order.PaymentAmount)
	for _, log := range logs {
		if strings.ToLower(log.Address) != usdtTRC20ContractHex || len(log.Topics) < 3 || strings.ToLower(log.Topics[0]) != transferTopic {
			continue
		}
		amount := new(big.Int)
		if _, ok := amount.SetString(strings.TrimPrefix(log.Data, "0x"), 16); !ok || !decimal.NewFromBigInt(amount, -6).Equal(expected) {
			continue
		}
		solidified, err := isTRONTransactionSolidified(ctx, log.TransactionHash)
		if err != nil {
			return false, err
		}
		if !solidified {
			continue
		}
		settled, err := model.CompleteUSDTTRC20TopUp(order.TradeNo, strings.ToLower(strings.TrimPrefix(log.TransactionHash, "0x")))
		if err != nil {
			return false, err
		}
		return settled, nil
	}
	return false, nil
}

func isTRONTransactionSolidified(ctx context.Context, txHash string) (bool, error) {
	endpoint := strings.TrimRight(setting.USDTTRC20SolidityURL, "/")
	if !strings.HasSuffix(strings.ToLower(endpoint), "/walletsolidity/gettransactioninfobyid") {
		endpoint += "/walletsolidity/gettransactioninfobyid"
	}
	payload, err := common.Marshal(map[string]string{"value": strings.TrimPrefix(txHash, "0x")})
	if err != nil {
		return false, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return false, err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := service.GetHttpClient().Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return false, fmt.Errorf("TRON Solidity API returned HTTP %d", resp.StatusCode)
	}
	var info struct {
		ID      string `json:"id"`
		Result  string `json:"result"`
		Receipt struct {
			Result string `json:"result"`
		} `json:"receipt"`
	}
	if err := common.DecodeJson(resp.Body, &info); err != nil {
		return false, err
	}
	expectedHash := strings.TrimPrefix(txHash, "0x")
	if info.ID == "" {
		return false, nil
	}
	if !strings.EqualFold(info.ID, expectedHash) {
		return false, errors.New("TRON Solidity API returned a different transaction")
	}
	if strings.EqualFold(info.Result, "FAILED") || (info.Receipt.Result != "" && !strings.EqualFold(info.Receipt.Result, "SUCCESS")) {
		return false, errors.New("TRON transaction execution failed")
	}
	return true, nil
}

func tronAddressToEVMHex(address string) (string, error) {
	if len(address) < 26 || len(address) > 36 || address[0] != 'T' {
		return "", errors.New("invalid TRON address")
	}
	value := big.NewInt(0)
	radix := big.NewInt(58)
	for _, char := range address {
		index := strings.IndexRune(tronBase58Alphabet, char)
		if index < 0 {
			return "", errors.New("invalid TRON address")
		}
		value.Mul(value, radix)
		value.Add(value, big.NewInt(int64(index)))
	}
	decoded := value.Bytes()
	leadingZeroes := 0
	for leadingZeroes < len(address) && address[leadingZeroes] == '1' {
		leadingZeroes++
	}
	full := make([]byte, leadingZeroes+len(decoded))
	copy(full[leadingZeroes:], decoded)
	if len(full) != 25 || full[0] != tronMainnetAddressPrefix {
		return "", errors.New("invalid TRON address")
	}
	payload := full[:21]
	firstHash := sha256.Sum256(payload)
	secondHash := sha256.Sum256(firstHash[:])
	if !bytes.Equal(full[21:], secondHash[:4]) {
		return "", errors.New("invalid TRON address checksum")
	}
	return "0x" + hex.EncodeToString(payload[1:]), nil
}
