import React, { useState } from 'react';

export const CodeExporter: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go'>('curl');
  const [copied, setCopied] = useState(false);

  const snippets = {
    curl: `curl -X POST "https://extract.paralux.digital/api/extract" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: px_live_your_api_key_here" \\
  -d '{
    "extractionMode": 1,
    "documentType": "invoice",
    "schema": {
      "invoiceNumber": { "type": "string", "description": "Invoice unique identifier" },
      "totalAmount": { "type": "number", "description": "Total amount due in USD" },
      "lineItems": {
        "type": "array",
        "description": "List of billed items",
        "items": {
          "type": "object",
          "properties": {
            "description": { "type": "string" },
            "amount": { "type": "number" }
          }
        }
      }
    },
    "document": "PARALUX DIGITAL INVOICE\\nINV-2026-889\\nTotal: $11,000.00"
  }'`,
    node: `import fetch from 'node-fetch';

async function extractInvoice() {
  const response = await fetch('https://extract.paralux.digital/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'px_live_your_api_key_here',
    },
    body: JSON.stringify({
      extractionMode: 1, // 1 = Standard (1 credit), 2 = Advanced (2 credits)
      documentType: 'invoice',
      schema: {
        invoiceNumber: { type: 'string', description: 'Invoice number' },
        totalAmount: { type: 'number', description: 'Total cost' },
        lineItems: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
      },
      document: {
        data: 'JVBERi0xLjQK...', // base64 encoded PDF or image
        mimeType: 'application/pdf',
      },
    }),
  });

  const result = await response.json();
  console.log('Extracted Data:', result.data);
  console.log('Credits Remaining:', result.creditsRemaining);
}

extractInvoice();`,
    python: `import requests

url = "https://extract.paralux.digital/api/extract"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "px_live_your_api_key_here"
}

payload = {
    "extractionMode": 1, # 1 = Standard (1 credit), 2 = Advanced (2 credits)
    "documentType": "invoice",
    "schema": {
        "invoiceNumber": {"type": "string", "description": "Invoice number"},
        "totalAmount": {"type": "number", "description": "Total cost"}
    },
    "document": "PARALUX DIGITAL INVOICE\\nINV-2026-889\\nTotal: $11,000.00"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Extracted Data:", data.get("data"))
print("Credits Consumed:", data.get("creditsUsed"))`,
    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://extract.paralux.digital/api/extract"
	payload := map[string]interface{}{
		"extractionMode": 1,
		"documentType":   "invoice",
		"schema": map[string]interface{}{
			"invoiceNumber": map[string]string{"type": "string"},
			"totalAmount":   map[string]string{"type": "number"},
		},
		"document": "PARALUX DIGITAL INVOICE INV-2026-889 Total: $11,000.00",
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "px_live_your_api_key_here")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="snippets" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#2d3748] p-6 sm:p-8 rounded-3xl border border-[#4a5568] shadow-lg">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#4a5568] mb-6">
          <div>
            <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-1">
              Developer SDK & Integration
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc]">Instant API Code Snippets</h2>
          </div>

          <div className="flex bg-[#202734] p-1 rounded-xl border border-[#4a5568]">
            {(['curl', 'node', 'python', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeLang === lang
                    ? 'bg-[#dd6b20] text-white shadow-sm border border-[#dd6b20]'
                    : 'text-[#a0aec0] hover:text-[#f7fafc]'
                }`}
              >
                {lang === 'node' ? 'Node.js' : lang}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Container */}
        <div className="bg-[#1a202c] rounded-2xl border border-[#4a5568] overflow-hidden shadow-inner">
          {/* Terminal Window Bar */}
          <div className="bg-[#202734] px-4 py-3 border-b border-[#4a5568] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#e53e3e]"></span>
              <span className="size-3 rounded-full bg-[#ecc94b]"></span>
              <span className="size-3 rounded-full bg-[#2f9e44]"></span>
              <span className="text-xs font-mono text-[#a0aec0] ml-2">
                {activeLang === 'curl' ? 'terminal.sh' : activeLang === 'node' ? 'extract.ts' : activeLang === 'python' ? 'extract.py' : 'main.go'}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1a202c] border border-[#4a5568] text-xs font-medium text-[#f7fafc] hover:border-[#dd6b20] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#dd6b20]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied!' : 'Copy Snippet'}</span>
            </button>
          </div>

          <div className="p-5 overflow-x-auto">
            <pre className="text-xs text-[#f7fafc] font-mono leading-relaxed m-0 selection:bg-[#dd6b20]/30 selection:text-[#dd6b20]">
              <code>{snippets[activeLang]}</code>
            </pre>
          </div>
        </div>

      </div>
    </section>
  );
};
