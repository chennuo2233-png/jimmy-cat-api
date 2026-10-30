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
)

func groupBusinessID(c *gin.Context, key string) (int, bool) {
	id, err := strconv.Atoi(c.Param(key))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "无效的业务财务记录")
		return 0, false
	}
	return id, true
}

func groupBusinessDate(value string) (int64, bool) {
	location, err := time.LoadLocation(beijingTimeZone)
	if err != nil {
		return 0, false
	}
	date, err := time.ParseInLocation(
		time.DateOnly,
		strings.TrimSpace(value),
		location,
	)
	if err != nil {
		return 0, false
	}
	return date.Unix(), true
}

func groupBusinessModelError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, model.ErrGroupBusinessSnapshotSealed):
		common.ApiErrorMsg(c, "该日期的日报已封存，请新增后续日期的调整记录")
	case errors.Is(err, model.ErrGroupBusinessNotFound):
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "账目记录不存在"})
	default:
		common.ApiError(c, err)
	}
}

type groupBusinessProductRequest struct {
	Name              string `json:"name"`
	GroupName         string `json:"group_name"`
	SettlementRateCNY string `json:"settlement_rate_cny"`
	UpstreamCostCNY   string `json:"upstream_cost_cny"`
	SalesShareRate    string `json:"sales_share_rate"`
	PartnerShareRate  string `json:"partner_share_rate"`
	OwnerShareRate    string `json:"owner_share_rate"`
	StartedOn         string `json:"started_on"`
	Active            bool   `json:"active"`
}

func groupBusinessProductFromRequest(request groupBusinessProductRequest) (*model.GroupBusinessProduct, error) {
	startedAt, ok := groupBusinessDate(request.StartedOn)
	if !ok {
		return nil, model.ErrInvalidGroupBusinessRecord
	}
	return &model.GroupBusinessProduct{
		Name:              request.Name,
		GroupName:         request.GroupName,
		SettlementRateCNY: request.SettlementRateCNY,
		UpstreamCostCNY:   request.UpstreamCostCNY,
		SalesShareRate:    request.SalesShareRate,
		PartnerShareRate:  request.PartnerShareRate,
		OwnerShareRate:    request.OwnerShareRate,
		StartedAt:          startedAt,
		Active:             request.Active,
	}, nil
}

func CreateGroupBusinessProduct(c *gin.Context) {
	request := groupBusinessProductRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的产品资料")
		return
	}
	product, err := groupBusinessProductFromRequest(request)
	if err != nil {
		common.ApiErrorMsg(c, "开始日期无效")
		return
	}
	if err := model.CreateGroupBusinessProduct(product); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, product)
}

func UpdateGroupBusinessProduct(c *gin.Context) {
	id, ok := groupBusinessID(c, "id")
	if !ok {
		return
	}
	request := groupBusinessProductRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的产品资料")
		return
	}
	product, err := groupBusinessProductFromRequest(request)
	if err != nil {
		common.ApiErrorMsg(c, "开始日期无效")
		return
	}
	product.Id = id
	if err := model.UpdateGroupBusinessProduct(product); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, product)
}

type groupBusinessSalespersonRequest struct {
	Name   string `json:"name"`
	Active bool   `json:"active"`
}

func CreateGroupBusinessSalesperson(c *gin.Context) {
	request := groupBusinessSalespersonRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的销售资料")
		return
	}
	item := &model.GroupBusinessSalesperson{Name: request.Name, Active: request.Active}
	if err := model.CreateGroupBusinessSalesperson(item); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

func UpdateGroupBusinessSalesperson(c *gin.Context) {
	id, ok := groupBusinessID(c, "id")
	if !ok {
		return
	}
	request := groupBusinessSalespersonRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的销售资料")
		return
	}
	item := &model.GroupBusinessSalesperson{Id: id, Name: request.Name, Active: request.Active}
	if err := model.UpdateGroupBusinessSalesperson(item); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

type groupBusinessCustomerRequest struct {
	UserId        int    `json:"user_id"`
	SalespersonId int    `json:"salesperson_id"`
	ChatName      string `json:"chat_name"`
	EffectiveOn   string `json:"effective_on"`
	Active        bool   `json:"active"`
	Note          string `json:"note"`
}

func groupBusinessCustomerFromRequest(productID int, request groupBusinessCustomerRequest) (*model.GroupBusinessCustomer, error) {
	effectiveAt, validDate := groupBusinessDate(request.EffectiveOn)
	if !validDate {
		return nil, model.ErrInvalidGroupBusinessRecord
	}
	return &model.GroupBusinessCustomer{
		ProductId:     productID,
		UserId:        request.UserId,
		SalespersonId: request.SalespersonId,
		ChatName:      request.ChatName,
		EffectiveAt:   effectiveAt,
		Active:        request.Active,
		Note:          request.Note,
	}, nil
}

func CreateGroupBusinessCustomer(c *gin.Context) {
	productID, ok := groupBusinessID(c, "product_id")
	if !ok {
		return
	}
	request := groupBusinessCustomerRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的客户资料")
		return
	}
	item, err := groupBusinessCustomerFromRequest(productID, request)
	if err != nil {
		common.ApiErrorMsg(c, "客户生效日期无效")
		return
	}
	if err := model.CreateGroupBusinessCustomer(item); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

func UpdateGroupBusinessCustomer(c *gin.Context) {
	id, ok := groupBusinessID(c, "id")
	if !ok {
		return
	}
	productID, err := strconv.Atoi(c.Query("product_id"))
	if err != nil || productID <= 0 {
		common.ApiErrorMsg(c, "无效的产品资料")
		return
	}
	request := groupBusinessCustomerRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的客户资料")
		return
	}
	item, err := groupBusinessCustomerFromRequest(productID, request)
	if err != nil {
		common.ApiErrorMsg(c, "客户生效日期无效")
		return
	}
	item.Id = id
	if err := model.UpdateGroupBusinessCustomer(item); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

type groupBusinessLedgerRequest struct {
	CustomerId         int    `json:"customer_id"`
	Type               string `json:"type"`
	CashAmountCNY      string `json:"cash_amount_cny"`
	CreditAmountCNY    string `json:"credit_amount_cny"`
	UpstreamBalanceCNY string `json:"upstream_balance_cny"`
	OccurredOn         string `json:"occurred_on"`
	Note               string `json:"note"`
}

func CreateGroupBusinessLedger(c *gin.Context) {
	productID, ok := groupBusinessID(c, "product_id")
	if !ok {
		return
	}
	request := groupBusinessLedgerRequest{}
	if err := common.DecodeJson(c.Request.Body, &request); err != nil {
		common.ApiErrorMsg(c, "无效的账目记录")
		return
	}
	occurredAt, validDate := groupBusinessDate(request.OccurredOn)
	if !validDate {
		common.ApiErrorMsg(c, "业务日期无效")
		return
	}
	item := &model.GroupBusinessLedger{
		ProductId:          productID,
		CustomerId:         request.CustomerId,
		Type:               request.Type,
		CashAmountCNY:      defaultGroupBusinessAmount(request.CashAmountCNY),
		CreditAmountCNY:    defaultGroupBusinessAmount(request.CreditAmountCNY),
		UpstreamBalanceCNY: defaultGroupBusinessAmount(request.UpstreamBalanceCNY),
		OccurredAt:         occurredAt,
		Note:               request.Note,
		CreatedBy:          c.GetInt("id"),
	}
	if err := model.CreateGroupBusinessLedger(item); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, item)
}

func defaultGroupBusinessAmount(value string) string {
	if strings.TrimSpace(value) == "" {
		return "0"
	}
	return value
}

func DeleteGroupBusinessLedger(c *gin.Context) {
	id, ok := groupBusinessID(c, "id")
	if !ok {
		return
	}
	if err := model.DeleteGroupBusinessLedger(id); err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func GenerateGroupBusinessDailySnapshot(c *gin.Context) {
	productID, ok := groupBusinessID(c, "product_id")
	if !ok {
		return
	}
	date := strings.TrimSpace(c.Query("date"))
	if _, valid := groupBusinessDate(date); !valid {
		common.ApiErrorMsg(c, "日报日期无效")
		return
	}
	snapshot, err := model.GenerateGroupBusinessDailySnapshot(productID, date)
	if err != nil {
		groupBusinessModelError(c, err)
		return
	}
	common.ApiSuccess(c, snapshot)
}

func GetGroupBusinessOverview(c *gin.Context) {
	products, err := model.ListGroupBusinessProducts()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	salespeople, err := model.ListGroupBusinessSalespeople()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	productID, _ := strconv.Atoi(c.Query("product_id"))
	response := gin.H{"products": products, "salespeople": salespeople}
	if productID <= 0 {
		common.ApiSuccess(c, response)
		return
	}
	startAt, endAt, err := parseFinancialDateRange(c)
	if err != nil {
		common.ApiErrorMsg(c, "日期范围无效")
		return
	}
	customers, err := model.ListGroupBusinessCustomers(productID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	users, err := model.ListGroupBusinessEligibleUsers(productID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	ledger, err := model.ListGroupBusinessLedger(productID, startAt, endAt)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	snapshots, err := model.GetGroupBusinessSnapshots(productID, startAt, endAt)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	response["customers"] = customers
	response["eligible_users"] = users
	response["ledger"] = ledger
	response["snapshots"] = snapshots
	common.ApiSuccess(c, response)
}

func GetGroupBusinessSnapshotDetails(c *gin.Context) {
	id, ok := groupBusinessID(c, "id")
	if !ok {
		return
	}
	details, err := model.GetGroupBusinessDailyCustomerSnapshots(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, details)
}
