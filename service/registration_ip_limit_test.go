package service

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/QuantumNous/new-api/common"
)

func TestReserveRegistrationIPAllowsOnlyOneRegistrationPerDay(t *testing.T) {
	server := miniredis.RunT(t)
	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	previousClient := common.RDB
	previousEnabled := common.RedisEnabled
	common.RDB = client
	common.RedisEnabled = true
	t.Cleanup(func() {
		common.RDB = previousClient
		common.RedisEnabled = previousEnabled
		require.NoError(t, client.Close())
	})

	ctx := context.Background()
	const ip = "203.0.113.10"
	require.NoError(t, ReserveRegistrationIP(ctx, ip))
	assert.ErrorIs(t, ReserveRegistrationIP(ctx, ip), ErrRegistrationIPLimitReached)

	ttl := server.TTL(registrationIPLimitKey(ip))
	assert.Greater(t, ttl, 23*time.Hour)
	assert.LessOrEqual(t, ttl, 24*time.Hour)

	ReleaseRegistrationIP(ctx, ip)
	require.NoError(t, ReserveRegistrationIP(ctx, ip))
}
