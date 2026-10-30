package model

import (
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestNormalizeGroupBusinessProductRequiresPositiveMargin(t *testing.T) {
	product := &GroupBusinessProduct{
		Name:             "AWSB 渠道 A",
		GroupName:        "1.AWSB",
		SettlementRateCNY: "2.45",
		UpstreamCostCNY:   "2.4",
		SalesShareRate:    "0.2",
		PartnerShareRate:  "0.4",
		OwnerShareRate:    "0.4",
		StartedAt:         time.Now().Unix(),
	}
	require.NoError(t, normalizeGroupBusinessProduct(product))
	assert.Equal(t, "2.45", product.SettlementRateCNY)

	product.UpstreamCostCNY = "2.45"
	require.ErrorIs(t, normalizeGroupBusinessProduct(product), ErrInvalidGroupBusinessRecord)

	product.UpstreamCostCNY = "2.4"
	product.OwnerShareRate = "0.5"
	require.ErrorIs(t, normalizeGroupBusinessProduct(product), ErrInvalidGroupBusinessRecord)
}

func TestGroupBusinessLedgerAllowsZeroUpstreamBalance(t *testing.T) {
	previousDB := DB
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	require.NoError(t, db.AutoMigrate(&GroupBusinessProduct{}, &GroupBusinessLedger{}))
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() {
		DB = previousDB
		_ = sqlDB.Close()
	})

	product := &GroupBusinessProduct{
		Name:             "AWSB 渠道 A",
		GroupName:        "1.AWSB",
		SettlementRateCNY: "2.45",
		UpstreamCostCNY:   "2.4",
		SalesShareRate:    "0.2",
		PartnerShareRate:  "0.4",
		OwnerShareRate:    "0.4",
		StartedAt:         time.Now().Unix(),
	}
	require.NoError(t, db.Create(product).Error)

	ledger := &GroupBusinessLedger{
		ProductId:          product.Id,
		Type:               GroupBusinessLedgerUpstreamBalance,
		CashAmountCNY:      "0",
		CreditAmountCNY:    "0",
		UpstreamBalanceCNY: "0",
		OccurredAt:         time.Now().Unix(),
	}
	require.NoError(t, normalizeGroupBusinessLedger(ledger))
	assert.Equal(t, "0", ledger.UpstreamBalanceCNY)
}
