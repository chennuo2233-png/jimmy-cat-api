package service

import (
	"context"
	"fmt"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
)

// groupBusinessDailySnapshotHandler seals the previous Beijing business day.
// It only schedules within the 00:05 window so a normal restart cannot create
// a surprise historical report; missed reports stay explicitly manual.
type groupBusinessDailySnapshotHandler struct{}

func (groupBusinessDailySnapshotHandler) Type() string {
	return model.SystemTaskTypeGroupBusinessDailySnapshot
}

func (groupBusinessDailySnapshotHandler) Enabled() bool {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return false
	}
	now := time.Now().In(location)
	return now.Hour() == 0 && now.Minute() >= 5 && now.Minute() < 10
}

func (groupBusinessDailySnapshotHandler) Interval() time.Duration { return 5 * time.Minute }

func (groupBusinessDailySnapshotHandler) NewPayload() any { return nil }

func (groupBusinessDailySnapshotHandler) Run(ctx context.Context, task *model.SystemTask, runnerID string) {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		failSystemTask(task, runnerID, err)
		return
	}
	date := time.Now().In(location).AddDate(0, 0, -1).Format(time.DateOnly)
	products, err := model.ListGroupBusinessProducts()
	if err != nil {
		failSystemTask(task, runnerID, err)
		return
	}
	completed := 0
	for _, product := range products {
		if ctx.Err() != nil {
			logSystemTaskLockError(ctx, task, ctx.Err())
			return
		}
		if !product.Active {
			continue
		}
		if _, err := model.GenerateGroupBusinessDailySnapshot(product.Id, date); err != nil {
			failSystemTask(task, runnerID, fmt.Errorf("product %d: %w", product.Id, err))
			return
		}
		completed++
	}
	result := map[string]any{"date": date, "completed": completed}
	if err := model.FinishSystemTask(task.TaskID, runnerID, model.SystemTaskStatusSucceeded, result, ""); err != nil {
		logger.LogWarn(context.Background(), fmt.Sprintf("group business daily snapshot completion failed: %v", err))
	}
}

func init() {
	RegisterSystemTaskHandler(groupBusinessDailySnapshotHandler{})
	common.SysLog("group business daily snapshot scheduler registered")
}
