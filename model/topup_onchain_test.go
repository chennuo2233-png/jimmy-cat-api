package model

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestCreateUSDTOnchainTopUpSharesPendingOrderLimitAcrossNetworks(t *testing.T) {
	previousDB := DB
	previousMainDatabaseType := common.MainDatabaseType()
	previousLogDatabaseType := common.LogDatabaseType()
	common.SetDatabaseTypes(common.DatabaseTypeSQLite, previousLogDatabaseType)
	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	require.NoError(t, db.AutoMigrate(
		&User{},
		&TopUp{},
		&USDTBEP20PaymentReference{},
		&USDTTRC20PaymentReference{},
		&USDTERC20PaymentReference{},
	))
	sqlDB, err := db.DB()
	require.NoError(t, err)
	t.Cleanup(func() {
		DB = previousDB
		common.SetDatabaseTypes(previousMainDatabaseType, previousLogDatabaseType)
		_ = sqlDB.Close()
	})

	user := &User{Username: "onchain-order-limit", Status: common.UserStatusEnabled}
	require.NoError(t, db.Create(user).Error)
	now := time.Now().Unix()
	orders := []*TopUp{
		{
			UserId: user.Id, TradeNo: "BEP20-first", PaymentMethod: PaymentMethodUSDTBEP20,
			PaymentProvider: PaymentProviderUSDTBEP20, PaymentAddress: "0x1111111111111111111111111111111111111111",
			PaymentAmount: "10.001001", PaymentExpireAt: now + 1800, CreateTime: now, Status: common.TopUpStatusPending,
		},
		{
			UserId: user.Id, TradeNo: "TRC20-second", PaymentMethod: PaymentMethodUSDTTRC20,
			PaymentProvider: PaymentProviderUSDTTRC20, PaymentAddress: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
			PaymentAmount: "10.001002", PaymentExpireAt: now + 1800, CreateTime: now + 1, Status: common.TopUpStatusPending,
		},
		{
			UserId: user.Id, TradeNo: "ERC20-third", PaymentMethod: PaymentMethodUSDTERC20,
			PaymentProvider: PaymentProviderUSDTERC20, PaymentAddress: "0x2222222222222222222222222222222222222222",
			PaymentAmount: "10.001003", PaymentExpireAt: now + 1800, CreateTime: now + 2, Status: common.TopUpStatusPending,
		},
	}

	require.NoError(t, CreateUSDTBEP20TopUp(orders[0]))
	require.NoError(t, CreateUSDTTRC20TopUp(orders[1]))
	require.NoError(t, CreateUSDTERC20TopUp(orders[2]))

	var stored []TopUp
	require.NoError(t, db.Order("create_time ASC").Find(&stored).Error)
	require.Len(t, stored, 3)
	assert.Equal(t, common.TopUpStatusExpired, stored[0].Status)
	assert.Equal(t, common.TopUpStatusPending, stored[1].Status)
	assert.Equal(t, common.TopUpStatusPending, stored[2].Status)
}
