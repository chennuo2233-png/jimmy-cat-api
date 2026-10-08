package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const registrationIPLimitWindow = 24 * time.Hour

var ErrRegistrationIPLimitReached = errors.New("registration IP limit reached")

func registrationIPLimitKey(ip string) string {
	return fmt.Sprintf("registration:v1:ip:%s", ip)
}

// ReserveRegistrationIP atomically reserves one registration per IP address for
// the next 24 hours. Redis is used in production to make concurrent attempts
// and restarts safe; the database remains a conservative fallback for
// installations without Redis.
func ReserveRegistrationIP(ctx context.Context, ip string) error {
	if ip == "" {
		return errors.New("registration IP is empty")
	}

	if common.RedisEnabled && common.RDB != nil {
		reserved, err := common.RDB.SetNX(ctx, registrationIPLimitKey(ip), "1", registrationIPLimitWindow).Result()
		if err != nil {
			return fmt.Errorf("reserve registration IP: %w", err)
		}
		if !reserved {
			return ErrRegistrationIPLimitReached
		}
		return nil
	}

	recentRegistration, err := model.HasRecentRegistrationFromIP(ip, time.Now().Add(-registrationIPLimitWindow).Unix())
	if err != nil {
		return fmt.Errorf("check recent registration IP: %w", err)
	}
	if recentRegistration {
		return ErrRegistrationIPLimitReached
	}
	return nil
}

// ReleaseRegistrationIP frees a reservation only when the corresponding user
// record was not created. A successfully created account must keep its window.
func ReleaseRegistrationIP(ctx context.Context, ip string) {
	if common.RedisEnabled && common.RDB != nil && ip != "" {
		if err := common.RDB.Del(ctx, registrationIPLimitKey(ip)).Err(); err != nil {
			common.SysError(fmt.Sprintf("release registration IP reservation: %v", err))
		}
	}
}
