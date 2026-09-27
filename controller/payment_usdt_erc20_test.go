package controller

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestIsEthereumAddressRejectsMalformedReceivingAddresses(t *testing.T) {
	tests := []struct {
		name    string
		address string
		valid   bool
	}{
		{name: "valid lowercase", address: "0x1234567890abcdef1234567890abcdef12345678", valid: true},
		{name: "valid checksum case", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", valid: true},
		{name: "missing prefix", address: "1234567890abcdef1234567890abcdef12345678", valid: false},
		{name: "wrong length", address: "0x1234", valid: false},
		{name: "non hex", address: "0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz", valid: false},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			assert.Equal(t, test.valid, isEthereumAddress(test.address))
		})
	}
}
