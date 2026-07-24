import React, { useState } from 'react';

export const CodeExporter: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go'>('curl');

  const snippets = {
    curl: `curl -X POST "https://extract.paralux.digital/api/extract" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: px_live_99812471829471" \\
  -d '{
    "model": "gemini-3.1-flash-lite",
    "documentType": "invoice",
    "schema": {
      "invoiceNumber": { "type": "string", "description": "Invoice number" },
      "totalAmount": { "type": "number", "description": "Total cost" },
      "lineItems": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "description": { "type": "string" },
            "amount": { "type": "number" }
          }
        }
      }
    },
    "document": "PARALUX DIGITAL INVOICE\\nINV-2026-001\\nTotal: $13,562.50"
  }'`,
    node: `import fetch from 'node-fetch';

async function extractInvoice() {
  const response = await fetch('https://extract.paralux.digital/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'px_live_99812471829471',
    },
    body: JSON.stringify({
      model: 'gemini-3.1-flash-lite',
      documentType: 'invoice',
      schema: {
        invoiceNumber: { type: 'string', description: 'Invoice number' },
        totalAmount: { type: 'number', description: 'Total cost' },
      },
      document: {
        data: 'JVBERi0xLjQK...', // base64 string
        mimeType: 'application/pdf',
      },
    }),
  });

  const result = await response.json();
  console.log('Extracted Data:', result.data);
}

extractInvoice();`,
    python: `import requests

url = "https://extract.paralux.digital/api/extract"
headers = {
    "Content-Type": "application/json",
    "x-api-key": "px_live_99812471829471"
}

payload = {
    "model": "gemini-3.1-flash-lite",
    "documentType": "invoice",
    "schema": {
        "invoiceNumber": {"type": "string", "description": "Invoice number"},
        "totalAmount": {"type": "number", "description": "Total cost"}
    },
    "document": "PARALUX DIGITAL INVOICE\\nINV-2026-001\\nTotal: $13,562.50"
}

response = requests.post(url, json=payload, headers=headers)
print("Extracted Output:", response.json()["data"])`,
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
		"model": "gemini-3.1-flash-lite",
		"schema": map[string]interface{}{
			"invoiceNumber": map[string]string{"type": "string"},
			"totalAmount":   map[string]string{"type": "number"},
		},
		"document": "PARALUX INVOICE INV-2026-001 Total: $13,562.50",
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", "px_live_99812471829471")

	client := &http.Client{}
	resp, _ := client.Do(req)
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}`,
  };

  return (
    <section id="snippets" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div>
            <span className="text-xs font-bold font-mono text-indigo-400 uppercase tracking-widest block mb-1">
              Developer SDK & Integration
            </span>
            <h2 className="text-2xl font-bold text-white">Instant API Code Snippets</h2>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['curl', 'node', 'python', 'go'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeLang === lang ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
          <pre className="text-xs text-indigo-300 font-mono leading-relaxed m-0">
            <code>{snippets[activeLang]}</code>
          </pre>
        </div>

      </div>
    </section>
  );
};
