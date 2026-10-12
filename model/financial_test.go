package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestFinancialEntryCategoriesMatchTheirDirection(t *testing.T) {
	require.True(t, IsFinancialCategoryValid(
		FinancialDirectionIncome,
		FinancialCategoryOtherIncome,
	))
	require.False(t, IsFinancialCategoryValid(
		FinancialDirectionIncome,
		FinancialCategoryUpstreamPurchase,
	))
	require.True(t, IsFinancialCategoryValid(
		FinancialDirectionExpense,
		FinancialCategoryUpstreamPurchase,
	))
	require.True(t, IsFinancialCategoryValid(
		FinancialDirectionExpense,
		FinancialCategoryCustomerTest,
	))
	require.True(t, IsFinancialCategoryValid(
		FinancialDirectionExpense,
		FinancialCategoryOtherExpense,
	))
	require.False(t, IsFinancialCategoryValid(
		FinancialDirectionExpense,
		FinancialCategoryOtherIncome,
	))
}

func TestNormalizeFinancialCurrency(t *testing.T) {
	require.Equal(t, FinancialCurrencyUSDT, NormalizeFinancialCurrency(" usdt "))
}

func TestFinancialSummaryExcludesRootUserTopUps(t *testing.T) {
	previousDB := DB
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	require.NoError(t, db.AutoMigrate(&User{}, &TopUp{}, &Option{}, &FinancialEntry{}))
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() {
		DB = previousDB
		_ = sqlDB.Close()
	})

	rootUser := &User{Username: "finance-root", Password: "password", Role: common.RoleRootUser}
	customer := &User{Username: "finance-customer", Password: "password", Role: common.RoleCommonUser}
	require.NoError(t, db.Create(rootUser).Error)
	require.NoError(t, db.Create(customer).Error)

	now := time.Now().Unix()
	require.NoError(t, db.Create(&TopUp{
		UserId: rootUser.Id, TradeNo: "finance-root-topup", Money: 10,
		Status: common.TopUpStatusSuccess, CompleteTime: now,
	}).Error)
	require.NoError(t, db.Create(&TopUp{
		UserId: customer.Id, TradeNo: "finance-customer-topup", Money: 7,
		Status: common.TopUpStatusSuccess, CompleteTime: now,
	}).Error)

	summary, err := GetFinancialSummary(now-1, now+1)
	require.NoError(t, err)
	require.Equal(t, "7", summary.CustomerTopUpUSD)
	require.Equal(t, 1, summary.CustomerTopUpCount)
}
