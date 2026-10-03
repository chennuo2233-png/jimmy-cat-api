/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type ApiProtocol = 'openai' | 'claude'
export type CodeLanguage = 'python' | 'typescript' | 'curl' | 'powershell'

export const codeSamples: Record<ApiProtocol, Record<CodeLanguage, string>> = {
  openai: {
    python: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_AGAM_API_KEY",
    base_url="https://agamai.online/v1",
)

response = client.chat.completions.create(
    model="agam-fable-5-1",
    messages=[
        {"role": "user", "content": "Introduce yourself briefly."}
    ],
)

print(response.choices[0].message.content)`,
    typescript: `import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.AGAM_API_KEY,
  baseURL: 'https://agamai.online/v1',
})

const response = await client.chat.completions.create({
  model: 'agam-fable-5-1',
  messages: [
    { role: 'user', content: 'Introduce yourself briefly.' },
  ],
})

console.log(response.choices[0].message.content)`,
    curl: `curl https://agamai.online/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_AGAM_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "agam-fable-5-1",
    "messages": [
      {"role": "user", "content": "Introduce yourself briefly."}
    ]
  }'`,
    powershell: `$headers = @{
  Authorization = "Bearer YOUR_AGAM_API_KEY"
}

$body = @{
  model = "agam-fable-5-1"
  messages = @(
    @{
      role = "user"
      content = "Introduce yourself briefly."
    }
  )
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod \`
  -Uri "https://agamai.online/v1/chat/completions" \`
  -Method Post \`
  -Headers $headers \`
  -ContentType "application/json" \`
  -Body $body

$response.choices[0].message.content`,
  },
  claude: {
    python: `from anthropic import Anthropic

client = Anthropic(
    api_key="YOUR_AGAM_API_KEY",
    base_url="https://agamai.online",
)

message = client.messages.create(
    model="agam-fable-5-1",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Introduce yourself briefly."}
    ],
)

print(message.content[0].text)`,
    typescript: `import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.AGAM_API_KEY,
  baseURL: 'https://agamai.online',
})

const message = await client.messages.create({
  model: 'agam-fable-5-1',
  max_tokens: 1024,
  messages: [
    { role: 'user', content: 'Introduce yourself briefly.' },
  ],
})

console.log(message.content)`,
    curl: `curl https://agamai.online/v1/messages \\
  -H "x-api-key: YOUR_AGAM_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "agam-fable-5-1",
    "max_tokens": 1024,
    "messages": [
      {"role": "user", "content": "Introduce yourself briefly."}
    ]
  }'`,
    powershell: `$headers = @{
  "x-api-key" = "YOUR_AGAM_API_KEY"
  "anthropic-version" = "2023-06-01"
}

$body = @{
  model = "agam-fable-5-1"
  max_tokens = 1024
  messages = @(
    @{
      role = "user"
      content = "Introduce yourself briefly."
    }
  )
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod \`
  -Uri "https://agamai.online/v1/messages" \`
  -Method Post \`
  -Headers $headers \`
  -ContentType "application/json" \`
  -Body $body

$response.content[0].text`,
  },
}
