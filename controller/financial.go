package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const beijingTimeZone = "Asia/Shanghai"

func parseFinancialDateRange(c *gin.Context) (int64, int64, error) {
	location, err := time.LoadLocation(beijingTimeZone)
	if err != nil {
		return 0, 0, err
	}

	startDate := strings.TrimSpace(c.Query("start_date"))
	endDate := strings.TrimSpace(c.Query("end_date"))
	if startDate == "" || endDate == "" {
		now := time.Now().In(location)
		start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, location)
		end := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, location)
		return start.Unix(), end.Unix(), nil
	}

	start, err := time.ParseInLocation(time.DateOnly, startDate, location)
	if err != nil {
		return 0, 0, errors.New("invalid start date")
	}
	end, err := time.ParseInLocation(time.DateOnly, endDate, location)
	if err != nil {
		return 0, 0, errors.New("invalid end date")
	}
	end = end.AddDate(0, 0, 1)
	if !end.After(start) {
		return 0, 0, errors.New("invalid date range")
	}
	return start.Unix(), end.Unix(), nil
}

func GetFinancialReport(c *gin.Context) {
	startAt, endAt, err := parseFinancialDateRange(c)
	if err != nil {
		common.ApiErrorMsg(c, "Invalid financial date range")
		return
	}
	summary, err := model.GetFinancialSummary(startAt, endAt)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{
		"start_at": startAt,
		"end_at":   endAt,
		"summary":  summary,
	})
}

type createFinancialEntryRequest struct {
	Direction  string `json:"direction"`
	Category   string `json:"category"`
	Currency   string `json:"currency"`
	Amount     string `json:"amount"`
	OccurredOn string `json:"occurred_on"`
	Note       string `json:"note"`
}

func CreateFinancialEntry(c *gin.Context) {
	request := createFinancialEntryRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "Invalid financial entry")
		return
	}

	location, err := time.LoadLocation(beijingTimeZone)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	occurredOn, err := time.ParseInLocation(time.DateOnly, request.OccurredOn, location)
	if err != nil {
		common.ApiErrorMsg(c, "Invalid financial entry date")
		return
	}

	entry := &model.FinancialEntry{
		Direction:  strings.TrimSpace(request.Direction),
		Category:   strings.TrimSpace(request.Category),
		Currency:   strings.TrimSpace(request.Currency),
		Amount:     strings.TrimSpace(request.Amount),
		OccurredAt: occurredOn.Unix(),
		Note:       request.Note,
		CreatedBy:  c.GetInt("id"),
	}
	if err := model.CreateFinancialEntry(entry); err != nil {
		if errors.Is(err, model.ErrInvalidFinancialEntry) {
			common.ApiErrorMsg(c, "Invalid financial entry")
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, entry)
}

func DeleteFinancialEntry(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "Invalid financial entry")
		return
	}
	if err := model.DeleteFinancialEntry(id); err != nil {
		if errors.Is(err, model.ErrFinancialEntryNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Financial entry not found"})
			return
		}
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

type updateFinancialExchangeRateRequest struct {
	CNYPerUSD string `json:"cny_per_usd"`
}

func UpdateFinancialExchangeRate(c *gin.Context) {
	request := updateFinancialExchangeRateRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "Invalid exchange rate")
		return
	}
	rate, err := decimal.NewFromString(strings.TrimSpace(request.CNYPerUSD))
	if err != nil || !rate.IsPositive() || rate.GreaterThan(decimal.NewFromInt(1000)) {
		common.ApiErrorMsg(c, "Invalid exchange rate")
		return
	}
	if err := model.UpdateFinancialCNYPerUSD(rate); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"cny_per_usd": rate.String()})
}
