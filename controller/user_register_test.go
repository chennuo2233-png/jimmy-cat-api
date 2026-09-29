package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRegisterPersistsSelectedLanguage(t *testing.T) {
	setupManageUserTestDB(t)
	gin.SetMode(gin.TestMode)

	originalRegisterEnabled := common.RegisterEnabled
	originalPasswordRegisterEnabled := common.PasswordRegisterEnabled
	originalEmailVerificationEnabled := common.EmailVerificationEnabled
	originalGenerateDefaultToken := constant.GenerateDefaultToken
	t.Cleanup(func() {
		common.RegisterEnabled = originalRegisterEnabled
		common.PasswordRegisterEnabled = originalPasswordRegisterEnabled
		common.EmailVerificationEnabled = originalEmailVerificationEnabled
		constant.GenerateDefaultToken = originalGenerateDefaultToken
	})

	common.RegisterEnabled = true
	common.PasswordRegisterEnabled = true
	common.EmailVerificationEnabled = false
	constant.GenerateDefaultToken = false

	body := `{"username":"language-user","password":"password123","language":"zhCN"}`
	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodPost, "/api/user/register", strings.NewReader(body))
	context.Request.Header.Set("Content-Type", "application/json")

	Register(context)

	require.Equal(t, http.StatusOK, recorder.Code)
	assert.Contains(t, recorder.Body.String(), `"success":true`)

	var user model.User
	require.NoError(t, model.DB.Where("username = ?", "language-user").First(&user).Error)
	assert.Equal(t, "zhCN", user.GetSetting().Language)
}

func TestNormalizeRegistrationLanguage(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "simplified Chinese", input: "zh-CN", expected: "zhCN"},
		{name: "traditional Chinese", input: "zh_TW", expected: "zhTW"},
		{name: "English", input: "en", expected: "en"},
		{name: "unsupported language", input: "de", expected: "ru"},
		{name: "missing language", input: "", expected: "ru"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.expected, normalizeRegistrationLanguage(test.input))
		})
	}
}
