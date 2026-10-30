package model

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

const (
	GroupBusinessLedgerPayment          = "payment"
	GroupBusinessLedgerTrialCredit      = "trial_credit"
	GroupBusinessLedgerUpstreamPurchase = "upstream_purchase"
	GroupBusinessLedgerUpstreamBalance  = "upstream_balance"
	GroupBusinessLedgerRefund           = "refund"
	GroupBusinessLedgerOtherIncome      = "other_income"
	GroupBusinessLedgerOtherExpense     = "other_expense"
)

var (
	ErrInvalidGroupBusinessRecord = errors.New("invalid group business record")
	ErrGroupBusinessNotFound      = errors.New("group business record not found")
	ErrGroupBusinessSnapshotSealed = errors.New("group business daily snapshot is sealed")
)

// GroupBusinessProduct binds a private commercial product to one existing
// platform user group. Its CNY rates are deliberately snapshotted into each
// daily report so future price edits never rewrite historical profit.
type GroupBusinessProduct struct {
	Id                 int    `json:"id"`
	Name               string `json:"name" gorm:"type:varchar(80);uniqueIndex"`
	GroupName          string `json:"group_name" gorm:"type:varchar(64);uniqueIndex"`
	SettlementRateCNY  string `json:"settlement_rate_cny" gorm:"type:varchar(32)"`
	UpstreamCostCNY    string `json:"upstream_cost_cny" gorm:"type:varchar(32)"`
	SalesShareRate     string `json:"sales_share_rate" gorm:"type:varchar(32)"`
	PartnerShareRate   string `json:"partner_share_rate" gorm:"type:varchar(32)"`
	OwnerShareRate     string `json:"owner_share_rate" gorm:"type:varchar(32)"`
	StartedAt          int64  `json:"started_at" gorm:"bigint;index"`
	Active             bool   `json:"active" gorm:"index"`
	CreatedAt          int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt          int64  `json:"updated_at" gorm:"bigint;index"`
}

type GroupBusinessSalesperson struct {
	Id        int    `json:"id"`
	Name      string `json:"name" gorm:"type:varchar(80);uniqueIndex"`
	Active    bool   `json:"active" gorm:"index"`
	CreatedAt int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt int64  `json:"updated_at" gorm:"bigint;index"`
}

// GroupBusinessCustomer is an administrative enrollment only. It never
// changes the platform wallet or a user's group; the controller validates the
// selected user already belongs to the product group.
type GroupBusinessCustomer struct {
	Id            int    `json:"id"`
	ProductId     int    `json:"product_id" gorm:"uniqueIndex:idx_group_business_product_user;index"`
	UserId        int    `json:"user_id" gorm:"uniqueIndex:idx_group_business_product_user;index"`
	SalespersonId int    `json:"salesperson_id" gorm:"index"`
	Username      string `json:"username" gorm:"type:varchar(64)"`
	ChatName      string `json:"chat_name" gorm:"type:varchar(160)"`
	EffectiveAt   int64  `json:"effective_at" gorm:"bigint;index"`
	Active        bool   `json:"active" gorm:"index"`
	Note          string `json:"note" gorm:"type:text"`
	CreatedAt     int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt     int64  `json:"updated_at" gorm:"bigint;index"`
}

// GroupBusinessLedger is a manual, product-scoped cash and credit journal.
// Payment and trial records can belong to a customer; upstream and other
// records are product-level. It is intentionally separate from wallet writes.
type GroupBusinessLedger struct {
	Id                    int    `json:"id"`
	ProductId             int    `json:"product_id" gorm:"index"`
	CustomerId            int    `json:"customer_id" gorm:"index"`
	Type                  string `json:"type" gorm:"type:varchar(32);index"`
	CashAmountCNY         string `json:"cash_amount_cny" gorm:"type:varchar(32)"`
	CreditAmountCNY       string `json:"credit_amount_cny" gorm:"type:varchar(32)"`
	UpstreamBalanceCNY    string `json:"upstream_balance_cny" gorm:"type:varchar(32)"`
	IncludeInDistribution bool   `json:"include_in_distribution"`
	OccurredAt            int64  `json:"occurred_at" gorm:"bigint;index"`
	Note                  string `json:"note" gorm:"type:text"`
	CreatedBy             int    `json:"created_by" gorm:"index"`
	CreatedAt             int64  `json:"created_at" gorm:"bigint;index"`
}

type GroupBusinessDailySnapshot struct {
	Id                         int    `json:"id"`
	ProductId                  int    `json:"product_id" gorm:"uniqueIndex:idx_group_business_daily;index"`
	Date                       string `json:"date" gorm:"type:char(10);uniqueIndex:idx_group_business_daily"`
	StartAt                    int64  `json:"start_at" gorm:"bigint;index"`
	EndAt                      int64  `json:"end_at" gorm:"bigint;index"`
	CustomerPaymentCNY         string `json:"customer_payment_cny" gorm:"type:varchar(32)"`
	RefundCNY                  string `json:"refund_cny" gorm:"type:varchar(32)"`
	NetCashCNY                 string `json:"net_cash_cny" gorm:"type:varchar(32)"`
	PaidCreditIssuedCNY        string `json:"paid_credit_issued_cny" gorm:"type:varchar(32)"`
	TrialCreditIssuedCNY       string `json:"trial_credit_issued_cny" gorm:"type:varchar(32)"`
	PaidConsumptionCNY         string `json:"paid_consumption_cny" gorm:"type:varchar(32)"`
	TrialConsumptionCNY        string `json:"trial_consumption_cny" gorm:"type:varchar(32)"`
	TotalConsumptionCNY        string `json:"total_consumption_cny" gorm:"type:varchar(32)"`
	PaidUpstreamCostCNY        string `json:"paid_upstream_cost_cny" gorm:"type:varchar(32)"`
	TrialUpstreamCostCNY       string `json:"trial_upstream_cost_cny" gorm:"type:varchar(32)"`
	GrossMarginCNY             string `json:"gross_margin_cny" gorm:"type:varchar(32)"`
	OtherIncomeCNY             string `json:"other_income_cny" gorm:"type:varchar(32)"`
	OtherExpenseCNY            string `json:"other_expense_cny" gorm:"type:varchar(32)"`
	DistributableMarginCNY     string `json:"distributable_margin_cny" gorm:"type:varchar(32)"`
	SalesCommissionCNY         string `json:"sales_commission_cny" gorm:"type:varchar(32)"`
	PartnerShareCNY            string `json:"partner_share_cny" gorm:"type:varchar(32)"`
	OwnerShareCNY              string `json:"owner_share_cny" gorm:"type:varchar(32)"`
	UpstreamPurchasedCNY       string `json:"upstream_purchased_cny" gorm:"type:varchar(32)"`
	LatestUpstreamBalanceCNY   string `json:"latest_upstream_balance_cny" gorm:"type:varchar(32)"`
	CustomerCount              int    `json:"customer_count"`
	SettlementRateCNY          string `json:"settlement_rate_cny" gorm:"type:varchar(32)"`
	UpstreamCostRateCNY        string `json:"upstream_cost_cny" gorm:"type:varchar(32)"`
	SalesShareRate             string `json:"sales_share_rate" gorm:"type:varchar(32)"`
	PartnerShareRate           string `json:"partner_share_rate" gorm:"type:varchar(32)"`
	OwnerShareRate             string `json:"owner_share_rate" gorm:"type:varchar(32)"`
	QuotaPerUnit               string `json:"quota_per_unit" gorm:"type:varchar(32)"`
	CreatedAt                  int64  `json:"created_at" gorm:"bigint;index"`
}

type GroupBusinessDailyCustomerSnapshot struct {
	Id                 int    `json:"id"`
	DailySnapshotId    int    `json:"daily_snapshot_id" gorm:"uniqueIndex:idx_group_business_daily_customer;index"`
	CustomerId         int    `json:"customer_id" gorm:"uniqueIndex:idx_group_business_daily_customer;index"`
	UserId             int    `json:"user_id" gorm:"index"`
	SalespersonId      int    `json:"salesperson_id" gorm:"index"`
	Username           string `json:"username" gorm:"type:varchar(64)"`
	SalespersonName    string `json:"salesperson_name" gorm:"type:varchar(80)"`
	ChatName           string `json:"chat_name" gorm:"type:varchar(160)"`
	PaidConsumptionCNY string `json:"paid_consumption_cny" gorm:"type:varchar(32)"`
	TrialConsumptionCNY string `json:"trial_consumption_cny" gorm:"type:varchar(32)"`
	UpstreamCostCNY    string `json:"upstream_cost_cny" gorm:"type:varchar(32)"`
	MarginCNY          string `json:"margin_cny" gorm:"type:varchar(32)"`
	SalesCommissionCNY string `json:"sales_commission_cny" gorm:"type:varchar(32)"`
}

type GroupBusinessUsageRow struct {
	UserId int
	Quota  int64
}

func groupBusinessDecimal(value string) (decimal.Decimal, error) {
	parsed, err := decimal.NewFromString(strings.TrimSpace(value))
	if err != nil || parsed.IsNegative() || parsed.GreaterThan(decimal.NewFromInt(1_000_000_000)) {
		return decimal.Zero, ErrInvalidGroupBusinessRecord
	}
	return parsed, nil
}

func normalizeGroupBusinessProduct(product *GroupBusinessProduct) error {
	if product == nil {
		return ErrInvalidGroupBusinessRecord
	}
	product.Name = strings.TrimSpace(product.Name)
	product.GroupName = strings.TrimSpace(product.GroupName)
	if product.Name == "" || len(product.Name) > 80 || product.GroupName == "" || len(product.GroupName) > 64 || product.StartedAt <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	for _, field := range []*string{&product.SettlementRateCNY, &product.UpstreamCostCNY, &product.SalesShareRate, &product.PartnerShareRate, &product.OwnerShareRate} {
		amount, err := groupBusinessDecimal(*field)
		if err != nil || !amount.IsPositive() {
			return ErrInvalidGroupBusinessRecord
		}
		*field = amount.String()
	}
	settlement, _ := decimal.NewFromString(product.SettlementRateCNY)
	cost, _ := decimal.NewFromString(product.UpstreamCostCNY)
	sales, _ := decimal.NewFromString(product.SalesShareRate)
	partner, _ := decimal.NewFromString(product.PartnerShareRate)
	owner, _ := decimal.NewFromString(product.OwnerShareRate)
	if !settlement.GreaterThan(cost) || sales.Add(partner).Add(owner).GreaterThan(decimal.NewFromInt(1)) {
		return ErrInvalidGroupBusinessRecord
	}
	return nil
}

func CreateGroupBusinessProduct(product *GroupBusinessProduct) error {
	if err := normalizeGroupBusinessProduct(product); err != nil {
		return err
	}
	now := common.GetTimestamp()
	product.CreatedAt = now
	product.UpdatedAt = now
	return DB.Create(product).Error
}

func UpdateGroupBusinessProduct(product *GroupBusinessProduct) error {
	if product == nil || product.Id <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	if err := normalizeGroupBusinessProduct(product); err != nil {
		return err
	}
	product.UpdatedAt = common.GetTimestamp()
	return DB.Save(product).Error
}

func ListGroupBusinessProducts() ([]*GroupBusinessProduct, error) {
	items := make([]*GroupBusinessProduct, 0)
	err := DB.Order("active desc, id asc").Find(&items).Error
	return items, err
}

func GetGroupBusinessProduct(id int) (*GroupBusinessProduct, error) {
	item := &GroupBusinessProduct{}
	if err := DB.First(item, id).Error; err != nil {
		return nil, err
	}
	return item, nil
}

func CreateGroupBusinessSalesperson(item *GroupBusinessSalesperson) error {
	if item == nil {
		return ErrInvalidGroupBusinessRecord
	}
	item.Name = strings.TrimSpace(item.Name)
	if item.Name == "" || len(item.Name) > 80 {
		return ErrInvalidGroupBusinessRecord
	}
	now := common.GetTimestamp()
	item.CreatedAt, item.UpdatedAt = now, now
	return DB.Create(item).Error
}

func UpdateGroupBusinessSalesperson(item *GroupBusinessSalesperson) error {
	if item == nil || item.Id <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	item.Name = strings.TrimSpace(item.Name)
	if item.Name == "" || len(item.Name) > 80 {
		return ErrInvalidGroupBusinessRecord
	}
	item.UpdatedAt = common.GetTimestamp()
	return DB.Save(item).Error
}

func ListGroupBusinessSalespeople() ([]*GroupBusinessSalesperson, error) {
	items := make([]*GroupBusinessSalesperson, 0)
	err := DB.Order("active desc, id asc").Find(&items).Error
	return items, err
}

func CreateGroupBusinessCustomer(item *GroupBusinessCustomer) error {
	if err := validateGroupBusinessCustomer(item); err != nil {
		return err
	}
	now := common.GetTimestamp()
	item.CreatedAt, item.UpdatedAt = now, now
	return DB.Create(item).Error
}

func UpdateGroupBusinessCustomer(item *GroupBusinessCustomer) error {
	if item == nil || item.Id <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	if err := validateGroupBusinessCustomer(item); err != nil {
		return err
	}
	item.UpdatedAt = common.GetTimestamp()
	return DB.Save(item).Error
}

func validateGroupBusinessCustomer(item *GroupBusinessCustomer) error {
	if item == nil || item.ProductId <= 0 || item.UserId <= 0 || item.SalespersonId <= 0 || item.EffectiveAt <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	item.ChatName = strings.TrimSpace(item.ChatName)
	item.Note = strings.TrimSpace(item.Note)
	if len(item.ChatName) > 160 || len(item.Note) > 1000 {
		return ErrInvalidGroupBusinessRecord
	}
	product, err := GetGroupBusinessProduct(item.ProductId)
	if err != nil {
		return err
	}
	user := &User{}
	if err := DB.First(user, item.UserId).Error; err != nil {
		return err
	}
	if user.Group != product.GroupName {
		return fmt.Errorf("%w: user is not in product group", ErrInvalidGroupBusinessRecord)
	}
	salesperson := &GroupBusinessSalesperson{}
	if err := DB.First(salesperson, item.SalespersonId).Error; err != nil {
		return ErrInvalidGroupBusinessRecord
	}
	item.Username = user.Username
	return nil
}

func ListGroupBusinessCustomers(productID int) ([]*GroupBusinessCustomer, error) {
	items := make([]*GroupBusinessCustomer, 0)
	query := DB.Order("active desc, username asc")
	if productID > 0 {
		query = query.Where("product_id = ?", productID)
	}
	err := query.Find(&items).Error
	return items, err
}

func ListGroupBusinessEligibleUsers(productID int) ([]*User, error) {
	product, err := GetGroupBusinessProduct(productID)
	if err != nil {
		return nil, err
	}
	users := make([]*User, 0)
	err = DB.Select("id", "username", commonGroupCol).
		Where(commonGroupCol+" = ?", product.GroupName).
		Order("id asc").
		Find(&users).Error
	return users, err
}

func CreateGroupBusinessLedger(item *GroupBusinessLedger) error {
	if err := normalizeGroupBusinessLedger(item); err != nil {
		return err
	}
	if err := ensureGroupBusinessLedgerDateOpen(item.ProductId, item.OccurredAt); err != nil {
		return err
	}
	item.CreatedAt = common.GetTimestamp()
	return DB.Create(item).Error
}

// ensureGroupBusinessLedgerDateOpen keeps the daily archive immutable. A
// correction belongs in a later-day adjustment instead of silently changing
// the source data behind an already sealed report.
func ensureGroupBusinessLedgerDateOpen(productID int, occurredAt int64) error {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return err
	}
	date := time.Unix(occurredAt, 0).In(location).Format(time.DateOnly)
	var count int64
	if err := DB.Model(&GroupBusinessDailySnapshot{}).
		Where("product_id = ? AND date = ?", productID, date).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrGroupBusinessSnapshotSealed
	}
	return nil
}

func normalizeGroupBusinessLedger(item *GroupBusinessLedger) error {
	if item == nil || item.ProductId <= 0 || item.OccurredAt <= 0 {
		return ErrInvalidGroupBusinessRecord
	}
	product, err := GetGroupBusinessProduct(item.ProductId)
	if err != nil || product == nil {
		return ErrInvalidGroupBusinessRecord
	}
	item.Type = strings.TrimSpace(item.Type)
	item.Note = strings.TrimSpace(item.Note)
	if len(item.Note) > 1000 {
		return ErrInvalidGroupBusinessRecord
	}
	for _, field := range []*string{&item.CashAmountCNY, &item.CreditAmountCNY, &item.UpstreamBalanceCNY} {
		amount, err := groupBusinessDecimal(*field)
		if err != nil {
			return err
		}
		*field = amount.String()
	}
	needsCustomer := item.Type == GroupBusinessLedgerPayment || item.Type == GroupBusinessLedgerTrialCredit || item.Type == GroupBusinessLedgerRefund
	if needsCustomer != (item.CustomerId > 0) {
		return ErrInvalidGroupBusinessRecord
	}
	if needsCustomer {
		customer := &GroupBusinessCustomer{}
		if err := DB.Where("id = ? AND product_id = ?", item.CustomerId, item.ProductId).First(customer).Error; err != nil {
			return ErrInvalidGroupBusinessRecord
		}
	}
	switch item.Type {
	case GroupBusinessLedgerPayment:
		if item.CashAmountCNY == "0" || item.CreditAmountCNY == "0" {
			return ErrInvalidGroupBusinessRecord
		}
	case GroupBusinessLedgerTrialCredit:
		if item.CreditAmountCNY == "0" {
			return ErrInvalidGroupBusinessRecord
		}
	case GroupBusinessLedgerUpstreamPurchase:
		if item.CashAmountCNY == "0" {
			return ErrInvalidGroupBusinessRecord
		}
	case GroupBusinessLedgerUpstreamBalance:
		// A zero balance is meaningful and must be recordable during a
		// manual upstream balance check.
	case GroupBusinessLedgerRefund:
		if item.CashAmountCNY == "0" || item.CreditAmountCNY == "0" {
			return ErrInvalidGroupBusinessRecord
		}
	case GroupBusinessLedgerOtherIncome, GroupBusinessLedgerOtherExpense:
		if item.CashAmountCNY == "0" {
			return ErrInvalidGroupBusinessRecord
		}
		if item.Type == GroupBusinessLedgerOtherExpense {
			item.IncludeInDistribution = true
		}
	default:
		return ErrInvalidGroupBusinessRecord
	}
	return nil
}

func ListGroupBusinessLedger(productID int, startAt int64, endAt int64) ([]*GroupBusinessLedger, error) {
	items := make([]*GroupBusinessLedger, 0)
	query := DB.Where("product_id = ?", productID).Order("occurred_at desc, id desc")
	if startAt > 0 && endAt > startAt {
		query = query.Where("occurred_at >= ? AND occurred_at < ?", startAt, endAt)
	}
	err := query.Find(&items).Error
	return items, err
}

func DeleteGroupBusinessLedger(id int) error {
	item := &GroupBusinessLedger{}
	if err := DB.First(item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrGroupBusinessNotFound
		}
		return err
	}
	if err := ensureGroupBusinessLedgerDateOpen(item.ProductId, item.OccurredAt); err != nil {
		return err
	}
	result := DB.Delete(&GroupBusinessLedger{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrGroupBusinessNotFound
	}
	return nil
}

func GetGroupBusinessUsageByUser(product *GroupBusinessProduct, userIDs []int, startAt int64, endAt int64) (map[int]decimal.Decimal, error) {
	result := make(map[int]decimal.Decimal, len(userIDs))
	if product == nil || len(userIDs) == 0 || endAt <= startAt {
		return result, nil
	}
	type row struct {
		UserId int   `gorm:"column:user_id"`
		Quota  int64 `gorm:"column:quota"`
	}
	rows := make([]row, 0)
	err := LOG_DB.Model(&Log{}).
		Select("user_id, SUM(quota) AS quota").
		Where("type = ? AND "+commonGroupCol+" = ? AND created_at >= ? AND created_at < ?", LogTypeConsume, product.GroupName, startAt, endAt).
		Where("user_id IN ?", userIDs).
		Group("user_id").
		Find(&rows).Error
	if err != nil {
		return nil, err
	}
	quotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
	if !quotaPerUnit.IsPositive() {
		return nil, ErrInvalidGroupBusinessRecord
	}
	for _, item := range rows {
		result[item.UserId] = decimal.NewFromInt(item.Quota).Div(quotaPerUnit)
	}
	return result, nil
}

func GetGroupBusinessSnapshots(productID int, startAt int64, endAt int64) ([]*GroupBusinessDailySnapshot, error) {
	items := make([]*GroupBusinessDailySnapshot, 0)
	query := DB.Where("product_id = ?", productID).Order("date desc")
	if startAt > 0 && endAt > startAt {
		query = query.Where("start_at >= ? AND start_at < ?", startAt, endAt)
	}
	err := query.Find(&items).Error
	return items, err
}

func GetGroupBusinessDailyCustomerSnapshots(snapshotID int) ([]*GroupBusinessDailyCustomerSnapshot, error) {
	items := make([]*GroupBusinessDailyCustomerSnapshot, 0)
	err := DB.Where("daily_snapshot_id = ?", snapshotID).Order("margin_cny desc, id asc").Find(&items).Error
	return items, err
}

func GenerateGroupBusinessDailySnapshot(productID int, date string) (*GroupBusinessDailySnapshot, error) {
	product, err := GetGroupBusinessProduct(productID)
	if err != nil {
		return nil, err
	}
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return nil, err
	}
	dayStart, err := time.ParseInLocation(time.DateOnly, date, location)
	if err != nil {
		return nil, ErrInvalidGroupBusinessRecord
	}
	dayEnd := dayStart.AddDate(0, 0, 1)
	// A product created during the day still needs its first partial-day
	// report at 00:05. Only dates that ended before the product existed are
	// invalid.
	if dayEnd.Unix() <= product.StartedAt {
		return nil, ErrInvalidGroupBusinessRecord
	}
	existing := &GroupBusinessDailySnapshot{}
	if err := DB.Where("product_id = ? AND date = ?", productID, date).First(existing).Error; err == nil {
		return existing, nil
	}

	customers, err := ListGroupBusinessCustomers(productID)
	if err != nil {
		return nil, err
	}
	activeCustomers := make([]*GroupBusinessCustomer, 0, len(customers))
	userIDs := make([]int, 0, len(customers))
	for _, customer := range customers {
		if customer.Active && customer.EffectiveAt < dayEnd.Unix() {
			activeCustomers = append(activeCustomers, customer)
			userIDs = append(userIDs, customer.UserId)
		}
	}
	usageToday, err := GetGroupBusinessUsageByUser(product, userIDs, dayStart.Unix(), dayEnd.Unix())
	if err != nil {
		return nil, err
	}
	ledger, err := ListGroupBusinessLedger(productID, 0, 0)
	if err != nil {
		return nil, err
	}
	salespeople, err := ListGroupBusinessSalespeople()
	if err != nil {
		return nil, err
	}
	salesNames := make(map[int]string, len(salespeople))
	for _, person := range salespeople {
		salesNames[person.Id] = person.Name
	}

	settlement, _ := decimal.NewFromString(product.SettlementRateCNY)
	costRate, _ := decimal.NewFromString(product.UpstreamCostCNY)
	salesRate, _ := decimal.NewFromString(product.SalesShareRate)
	partnerRate, _ := decimal.NewFromString(product.PartnerShareRate)
	ownerRate, _ := decimal.NewFromString(product.OwnerShareRate)
	zero := decimal.Zero
	payment, refunds, paidCredit, trialCredit, upstreamPurchased := zero, zero, zero, zero, zero
	otherIncome, otherExpense := zero, zero
	latestUpstreamBalance := zero
	latestBalanceAt := int64(0)
	trialCreditByCustomer := map[int]decimal.Decimal{}
	for _, entry := range ledger {
		if entry.OccurredAt >= dayEnd.Unix() {
			continue
		}
		cash, _ := decimal.NewFromString(entry.CashAmountCNY)
		credit, _ := decimal.NewFromString(entry.CreditAmountCNY)
		balance, _ := decimal.NewFromString(entry.UpstreamBalanceCNY)
		switch entry.Type {
		case GroupBusinessLedgerPayment:
			if entry.OccurredAt >= dayStart.Unix() { payment = payment.Add(cash) }
			if entry.OccurredAt >= dayStart.Unix() { paidCredit = paidCredit.Add(credit) }
		case GroupBusinessLedgerRefund:
			if entry.OccurredAt >= dayStart.Unix() { refunds = refunds.Add(cash) }
		case GroupBusinessLedgerTrialCredit:
			trialCreditByCustomer[entry.CustomerId] = trialCreditByCustomer[entry.CustomerId].Add(credit)
			if entry.OccurredAt >= dayStart.Unix() { trialCredit = trialCredit.Add(credit) }
		case GroupBusinessLedgerUpstreamPurchase:
			if entry.OccurredAt >= dayStart.Unix() { upstreamPurchased = upstreamPurchased.Add(cash) }
		case GroupBusinessLedgerUpstreamBalance:
			if entry.OccurredAt >= latestBalanceAt {
				latestUpstreamBalance, latestBalanceAt = balance, entry.OccurredAt
			}
		case GroupBusinessLedgerOtherIncome:
			if entry.OccurredAt >= dayStart.Unix() { otherIncome = otherIncome.Add(cash) }
		case GroupBusinessLedgerOtherExpense:
			if entry.OccurredAt >= dayStart.Unix() && entry.IncludeInDistribution { otherExpense = otherExpense.Add(cash) }
		}
	}
	snapshot := &GroupBusinessDailySnapshot{ProductId: product.Id, Date: date, StartAt: dayStart.Unix(), EndAt: dayEnd.Unix(), SettlementRateCNY: product.SettlementRateCNY, UpstreamCostRateCNY: product.UpstreamCostCNY, SalesShareRate: product.SalesShareRate, PartnerShareRate: product.PartnerShareRate, OwnerShareRate: product.OwnerShareRate, QuotaPerUnit: decimal.NewFromFloat(common.QuotaPerUnit).String(), CreatedAt: common.GetTimestamp()}
	details := make([]*GroupBusinessDailyCustomerSnapshot, 0, len(activeCustomers))
	totalConsumption, paidConsumption, trialConsumption, paidCost, trialCost, grossMargin, salesCommission := zero, zero, zero, zero, zero, zero, zero
	for _, customer := range activeCustomers {
		if customer.EffectiveAt >= dayEnd.Unix() { continue }
		beforeStart := customer.EffectiveAt
		if beforeStart < product.StartedAt { beforeStart = product.StartedAt }
		usageBefore, usageErr := GetGroupBusinessUsageByUser(product, []int{customer.UserId}, beforeStart, dayStart.Unix())
		if usageErr != nil { return nil, usageErr }
		before := usageBefore[customer.UserId]
		today := usageToday[customer.UserId]
		throughToday := before.Add(today)
		trialLimit := trialCreditByCustomer[customer.Id]
		trialBefore := decimal.Min(before, trialLimit)
		trialThrough := decimal.Min(throughToday, trialLimit)
		customerTrial := trialThrough.Sub(trialBefore)
		customerPaid := today.Sub(customerTrial)
		customerPaidCost := customerPaid.Div(settlement).Mul(costRate)
		customerTrialCost := customerTrial.Div(settlement).Mul(costRate)
		customerMargin := customerPaid.Sub(customerPaidCost)
		totalConsumption = totalConsumption.Add(today)
		paidConsumption = paidConsumption.Add(customerPaid)
		trialConsumption = trialConsumption.Add(customerTrial)
		paidCost = paidCost.Add(customerPaidCost)
		trialCost = trialCost.Add(customerTrialCost)
		grossMargin = grossMargin.Add(customerMargin)
		if !today.IsZero() {
			details = append(details, &GroupBusinessDailyCustomerSnapshot{CustomerId: customer.Id, UserId: customer.UserId, SalespersonId: customer.SalespersonId, Username: customer.Username, SalespersonName: salesNames[customer.SalespersonId], ChatName: customer.ChatName, PaidConsumptionCNY: customerPaid.Round(6).String(), TrialConsumptionCNY: customerTrial.Round(6).String(), UpstreamCostCNY: customerPaidCost.Add(customerTrialCost).Round(6).String(), MarginCNY: customerMargin.Round(6).String()})
		}
	}
	// Test usage is a real upstream cost but earns no commission. Manual
	// expenses also reduce the distributable result, while other income is
	// kept outside of sales commission because it is not tied to a customer.
	distributable := grossMargin.Sub(trialCost).Add(otherIncome).Sub(otherExpense)
	commissionBase := grossMargin.Sub(trialCost).Sub(otherExpense)
	if commissionBase.IsNegative() {
		commissionBase = decimal.Zero
	}
	if distributable.IsNegative() {
		commissionBase = decimal.Zero
	}
	salesCommission = commissionBase.Mul(salesRate)
	if grossMargin.IsPositive() && salesCommission.IsPositive() {
		for _, detail := range details {
			margin, _ := decimal.NewFromString(detail.MarginCNY)
			commission := margin.Div(grossMargin).Mul(salesCommission)
			detail.SalesCommissionCNY = commission.Round(6).String()
		}
	}
	if distributable.IsNegative() {
		salesCommission = decimal.Zero
	}
	for _, detail := range details {
		if detail.SalesCommissionCNY == "" {
			detail.SalesCommissionCNY = decimal.Zero.String()
		}
	}
	remainingDistribution := distributable.Sub(salesCommission)
	if remainingDistribution.IsNegative() {
		remainingDistribution = decimal.Zero
	}
	partnerOwnerRate := partnerRate.Add(ownerRate)
	partnerShare, ownerShare := decimal.Zero, decimal.Zero
	if partnerOwnerRate.IsPositive() {
		partnerShare = remainingDistribution.Mul(partnerRate).Div(partnerOwnerRate)
		ownerShare = remainingDistribution.Sub(partnerShare)
	}
	snapshot.CustomerPaymentCNY, snapshot.RefundCNY, snapshot.NetCashCNY = payment.Round(6).String(), refunds.Round(6).String(), payment.Sub(refunds).Round(6).String()
	snapshot.PaidCreditIssuedCNY, snapshot.TrialCreditIssuedCNY = paidCredit.Round(6).String(), trialCredit.Round(6).String()
	snapshot.PaidConsumptionCNY, snapshot.TrialConsumptionCNY, snapshot.TotalConsumptionCNY = paidConsumption.Round(6).String(), trialConsumption.Round(6).String(), totalConsumption.Round(6).String()
	snapshot.PaidUpstreamCostCNY, snapshot.TrialUpstreamCostCNY, snapshot.GrossMarginCNY = paidCost.Round(6).String(), trialCost.Round(6).String(), grossMargin.Round(6).String()
	snapshot.OtherIncomeCNY, snapshot.OtherExpenseCNY, snapshot.DistributableMarginCNY = otherIncome.Round(6).String(), otherExpense.Round(6).String(), distributable.Round(6).String()
	snapshot.SalesCommissionCNY, snapshot.PartnerShareCNY, snapshot.OwnerShareCNY = salesCommission.Round(6).String(), partnerShare.Round(6).String(), ownerShare.Round(6).String()
	snapshot.UpstreamPurchasedCNY, snapshot.LatestUpstreamBalanceCNY, snapshot.CustomerCount = upstreamPurchased.Round(6).String(), latestUpstreamBalance.Round(6).String(), len(activeCustomers)

	err = DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(snapshot).Error; err != nil {
			return err
		}
		for _, detail := range details {
			detail.DailySnapshotId = snapshot.Id
		}
		if len(details) == 0 {
			return nil
		}
		return tx.Create(&details).Error
	})
	if err != nil {
		// Parallel schedulers can race; return the existing immutable archive.
		if DB.Where("product_id = ? AND date = ?", productID, date).First(existing).Error == nil {
			return existing, nil
		}
		return nil, err
	}
	return snapshot, nil
}

func ListGroupBusinessSnapshotDates(productID int) ([]string, error) {
	var dates []string
	err := DB.Model(&GroupBusinessDailySnapshot{}).Where("product_id = ?", productID).Pluck("date", &dates).Error
	sort.Strings(dates)
	return dates, err
}
