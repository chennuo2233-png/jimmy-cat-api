package model

import (
	"errors"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/shopspring/decimal"
)

const (
	FinancialDirectionIncome  = "income"
	FinancialDirectionExpense = "expense"

	FinancialCategoryOtherIncome      = "other_income"
	FinancialCategoryUpstreamPurchase = "upstream_purchase"
	FinancialCategoryCustomerTest     = "customer_test"
	FinancialCategoryOtherExpense     = "other_expense"

	FinancialCurrencyUSD  = "USD"
	FinancialCurrencyUSDT = "USDT"
	FinancialCurrencyCNY  = "CNY"

	FinancialCNYPerUSDOption = "financial_setting.cny_per_usd"
)

// FinancialEntry is a manual cash ledger item. Customer top-ups are already
// recorded in TopUp and are deliberately not duplicated here.
//
// Amounts and the USD snapshot are stored as decimal strings so the same
// values work consistently on SQLite, MySQL, and PostgreSQL.
type FinancialEntry struct {
	Id           int    `json:"id"`
	Direction    string `json:"direction" gorm:"type:varchar(16);index"`
	Category     string `json:"category" gorm:"type:varchar(32);index"`
	Currency     string `json:"currency" gorm:"type:varchar(8)"`
	Amount       string `json:"amount" gorm:"type:varchar(32)"`
	ExchangeRate string `json:"exchange_rate" gorm:"type:varchar(32)"`
	USDValue     string `json:"usd_value" gorm:"type:varchar(32)"`
	OccurredAt   int64  `json:"occurred_at" gorm:"bigint;index"`
	Note         string `json:"note" gorm:"type:text"`
	CreatedBy    int    `json:"created_by" gorm:"index"`
	CreatedAt    int64  `json:"created_at" gorm:"bigint;index"`
}

var (
	ErrInvalidFinancialEntry = errors.New("invalid financial entry")
	ErrFinancialEntryNotFound = errors.New("financial entry not found")
)

func IsFinancialCategoryValid(direction string, category string) bool {
	if direction == FinancialDirectionIncome {
		return category == FinancialCategoryOtherIncome
	}
	if direction == FinancialDirectionExpense {
		return category == FinancialCategoryUpstreamPurchase ||
			category == FinancialCategoryCustomerTest ||
			category == FinancialCategoryOtherExpense
	}
	return false
}

func NormalizeFinancialCurrency(value string) string {
	return strings.ToUpper(strings.TrimSpace(value))
}

func GetFinancialCNYPerUSD() decimal.Decimal {
	option := Option{}
	if err := DB.Where("key = ?", FinancialCNYPerUSDOption).First(&option).Error; err != nil {
		return decimal.NewFromFloat(6.7)
	}
	rate, err := decimal.NewFromString(option.Value)
	if err != nil || !rate.IsPositive() {
		return decimal.NewFromFloat(6.7)
	}
	return rate
}

func UpdateFinancialCNYPerUSD(rate decimal.Decimal) error {
	if !rate.IsPositive() {
		return ErrInvalidFinancialEntry
	}
	option := Option{Key: FinancialCNYPerUSDOption}
	if err := DB.FirstOrCreate(&option, Option{Key: FinancialCNYPerUSDOption}).Error; err != nil {
		return err
	}
	option.Value = rate.String()
	return DB.Save(&option).Error
}

func CreateFinancialEntry(entry *FinancialEntry) error {
	if entry == nil || !IsFinancialCategoryValid(entry.Direction, entry.Category) {
		return ErrInvalidFinancialEntry
	}

	entry.Currency = NormalizeFinancialCurrency(entry.Currency)
	if entry.Currency != FinancialCurrencyUSD && entry.Currency != FinancialCurrencyUSDT && entry.Currency != FinancialCurrencyCNY {
		return ErrInvalidFinancialEntry
	}

	amount, err := decimal.NewFromString(strings.TrimSpace(entry.Amount))
	if err != nil || !amount.IsPositive() || amount.GreaterThan(decimal.NewFromInt(1000000000)) {
		return ErrInvalidFinancialEntry
	}

	rate := decimal.NewFromInt(1)
	if entry.Currency == FinancialCurrencyCNY {
		rate = GetFinancialCNYPerUSD()
	}
	if !rate.IsPositive() {
		return ErrInvalidFinancialEntry
	}

	entry.Amount = amount.String()
	entry.ExchangeRate = rate.String()
	entry.USDValue = amount.Div(rate).Round(6).String()
	entry.Note = strings.TrimSpace(entry.Note)
	if len(entry.Note) > 1000 || entry.OccurredAt <= 0 {
		return ErrInvalidFinancialEntry
	}
	entry.CreatedAt = time.Now().Unix()
	return DB.Create(entry).Error
}

func GetFinancialEntries(startAt int64, endAt int64) ([]*FinancialEntry, error) {
	entries := make([]*FinancialEntry, 0)
	err := DB.Where("occurred_at >= ? AND occurred_at < ?", startAt, endAt).
		Order("occurred_at desc, id desc").
		Find(&entries).Error
	return entries, err
}

func DeleteFinancialEntry(id int) error {
	result := DB.Delete(&FinancialEntry{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrFinancialEntryNotFound
	}
	return nil
}

// FinancialSummary contains cash-basis totals normalized to USD. It uses the
// existing successful top-up records as the source of customer recharge income.
type FinancialSummary struct {
	CustomerTopUpUSD      string            `json:"customer_top_up_usd"`
	CustomerTopUpCount    int               `json:"customer_top_up_count"`
	OtherIncomeUSD        string            `json:"other_income_usd"`
	UpstreamPurchaseUSD string          `json:"upstream_purchase_usd"`
	CustomerTestUSD       string            `json:"customer_test_usd"`
	OtherExpenseUSD       string            `json:"other_expense_usd"`
	TotalIncomeUSD        string            `json:"total_income_usd"`
	TotalExpenseUSD       string            `json:"total_expense_usd"`
	NetProfitUSD          string            `json:"net_profit_usd"`
	CNYPerUSD             string            `json:"cny_per_usd"`
	Entries               []*FinancialEntry `json:"entries"`
}

func GetFinancialSummary(startAt int64, endAt int64) (*FinancialSummary, error) {
	entries, err := GetFinancialEntries(startAt, endAt)
	if err != nil {
		return nil, err
	}

	var topUps []*TopUp
	if err = DB.Where("status = ?", common.TopUpStatusSuccess).Find(&topUps).Error; err != nil {
		return nil, err
	}

	customerTopUp := decimal.Zero
	customerTopUpCount := 0
	for _, topUp := range topUps {
		occurredAt := topUp.CompleteTime
		if occurredAt <= 0 {
			occurredAt = topUp.CreateTime
		}
		if occurredAt < startAt || occurredAt >= endAt {
			continue
		}
		if topUp.Money <= 0 {
			continue
		}
		customerTopUp = customerTopUp.Add(decimal.NewFromFloat(topUp.Money))
		customerTopUpCount++
	}

	otherIncome := decimal.Zero
	upstreamPurchase := decimal.Zero
	customerTest := decimal.Zero
	otherExpense := decimal.Zero
	for _, entry := range entries {
		value, parseErr := decimal.NewFromString(entry.USDValue)
		if parseErr != nil || !value.IsPositive() {
			continue
		}
		switch entry.Category {
		case FinancialCategoryOtherIncome:
			otherIncome = otherIncome.Add(value)
		case FinancialCategoryUpstreamPurchase:
			upstreamPurchase = upstreamPurchase.Add(value)
		case FinancialCategoryCustomerTest:
			customerTest = customerTest.Add(value)
		case FinancialCategoryOtherExpense:
			otherExpense = otherExpense.Add(value)
		}
	}

	totalIncome := customerTopUp.Add(otherIncome)
	totalExpense := upstreamPurchase.Add(customerTest).Add(otherExpense)
	return &FinancialSummary{
		CustomerTopUpUSD:      customerTopUp.Round(6).String(),
		CustomerTopUpCount: customerTopUpCount,
		OtherIncomeUSD: otherIncome.Round(6).String(),
		UpstreamPurchaseUSD: upstreamPurchase.Round(6).String(),
		CustomerTestUSD: customerTest.Round(6).String(),
		OtherExpenseUSD: otherExpense.Round(6).String(),
		TotalIncomeUSD: totalIncome.Round(6).String(),
		TotalExpenseUSD: totalExpense.Round(6).String(),
		NetProfitUSD: totalIncome.Sub(totalExpense).Round(6).String(),
		CNYPerUSD: GetFinancialCNYPerUSD().String(),
		Entries: entries,
	}, nil
}
