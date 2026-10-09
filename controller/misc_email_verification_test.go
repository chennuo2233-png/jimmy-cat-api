package controller

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildEmailVerificationMessageUsesSelectedLanguageAndEnglish(t *testing.T) {
	subject, content := buildEmailVerificationMessage("ru", "AGAM AI", "123456", 10)

	assert.Contains(t, subject, "Код подтверждения электронной почты")
	assert.Contains(t, subject, "Email verification code")
	assert.Contains(t, content, "Ваш код подтверждения")
	assert.Contains(t, content, "English")
	assert.Contains(t, content, "Your verification code is")
	assert.Contains(t, content, "123456")
}

func TestBuildEmailVerificationMessageFallsBackToEnglish(t *testing.T) {
	subject, content := buildEmailVerificationMessage("de", "AGAM AI", "123456", 10)

	assert.Equal(t, "AGAM AI: Email verification code", subject)
	assert.Contains(t, content, "Hello,")
	assert.Contains(t, content, "Your verification code is")
	assert.NotContains(t, content, "<hr>")
}

func TestBuildEmailVerificationMessageEscapesDynamicValues(t *testing.T) {
	_, content := buildEmailVerificationMessage("vi", "AGAM <AI>", "12<3456", 10)

	assert.Contains(t, content, "AGAM &lt;AI&gt;")
	assert.Contains(t, content, "12&lt;3456")
}

func TestNormalizeVerificationEmailLanguage(t *testing.T) {
	tests := map[string]string{
		"zh-CN": "zhCN",
		"zh_TW": "zhTW",
		"ru":    "ru",
		"de":    "en",
		"":      "en",
	}

	for input, expected := range tests {
		t.Run(input, func(t *testing.T) {
			assert.Equal(t, expected, normalizeVerificationEmailLanguage(input))
		})
	}
}

func TestVerificationEmailCopyIncludesEnglishForNonEnglishLanguages(t *testing.T) {
	for _, language := range []string{"zhCN", "zhTW", "fr", "ja", "ru", "vi"} {
		t.Run(language, func(t *testing.T) {
			_, content := buildEmailVerificationMessage(language, "AGAM AI", "123456", 10)
			assert.Equal(t, 1, strings.Count(content, "<hr>"))
			assert.Contains(t, content, "Your verification code is")
		})
	}
}
