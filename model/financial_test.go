package model

import (
	"testing"

	"github.com/stretchr/testify/require"
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
