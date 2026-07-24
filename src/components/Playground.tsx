import React, { useState, useMemo } from 'react';
import type { SchemaField, ArrayItemProperty, ModelOption, UploadedFile, ExtractionApiResponse } from '../types/extraction';
import { extractDocument } from '../services/api';

export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash-Lite',
    badge: 'DEFAULT / FAST',
    description: 'GA model optimized for high-volume tasks ($0.30/1M in, $1.50/1M out)',
    inputRate: 0.30,
    outputRate: 1.50,
    inputRateText: '$0.30 / 1M',
    outputRateText: '$1.50 / 1M',
    isDefault: true,
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    description: 'High-volume agentic tasks & translation ($0.30/1M in, $2.50/1M out)',
    inputRate: 0.30,
    outputRate: 2.50,
    inputRateText: '$0.30 / 1M',
    outputRateText: '$2.50 / 1M',
    badge: 'BALANCED',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    description: 'Frontier intelligence with superior search & vision ($1.50/1M in, $7.50/1M out)',
    inputRate: 1.50,
    outputRate: 7.50,
    inputRateText: '$1.50 / 1M',
    outputRateText: '$7.50 / 1M',
    badge: 'FRONTIER VISION',
  },
];

export const PRESET_TEMPLATES = [
  {
    name: 'Invoice Extractor',
    documentType: 'invoice',
    description: 'Extracts invoice numbers, dates, client names, line items, and totals.',
    fields: [
      { key: 'invoiceNumber', type: 'string', description: 'Invoice number', required: true },
      { key: 'date', type: 'string', description: 'Invoice date', required: true },
      { key: 'clientName', type: 'string', description: 'Client or company name', required: true },
      { key: 'totalAmount', type: 'number', description: 'Total amount due', required: true },
      { key: 'taxAmount', type: 'number', description: 'Tax amount', required: false },
      {
        key: 'lineItems',
        type: 'array',
        itemsType: 'object',
        itemProperties: [
          { key: 'description', type: 'string', description: 'Line item description' },
          { key: 'amount', type: 'number', description: 'Item cost' },
        ],
        description: 'List of billed items',
        required: false,
      },
    ],
  },
  {
    name: 'Receipt Scanner',
    documentType: 'receipt',
    description: 'Extracts merchant name, purchase date, payment method, tax, and total.',
    fields: [
      { key: 'storeName', type: 'string', description: 'Store or vendor name', required: true },
      { key: 'transactionDate', type: 'string', description: 'Date of transaction', required: true },
      { key: 'total', type: 'number', description: 'Grand total cost', required: true },
      { key: 'tax', type: 'number', description: 'Tax paid', required: false },
      {
        key: 'items',
        type: 'array',
        itemsType: 'object',
        itemProperties: [
          { key: 'name', type: 'string', description: 'Item name' },
          { key: 'price', type: 'number', description: 'Item price' },
        ],
        description: 'Purchased items',
        required: false,
      },
    ],
  },
  {
    name: 'Resume / CV Parser',
    documentType: 'resume',
    description: 'Extracts candidate name, email, skills, and experience.',
    fields: [
      { key: 'candidateName', type: 'string', description: 'Full name of candidate', required: true },
      { key: 'email', type: 'string', description: 'Email address', required: true },
      { key: 'phone', type: 'string', description: 'Phone number', required: false },
      { key: 'skills', type: 'array', itemsType: 'string', description: 'Key technical skills', required: true },
      { key: 'yearsExperience', type: 'number', description: 'Total years of experience', required: false },
    ],
  },
];

export const Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [schemaName, setSchemaName] = useState('Invoice Extractor');
  const [schemaDesc, setSchemaDesc] = useState('Extracts financial key details from invoices and receipts.');
  const [documentType, setDocumentType] = useState('invoice');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [markupMultiplier, setMarkupMultiplier] = useState<number>(3.0);

  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState<string>(
    `PARALUX DIGITAL INVOICE\nInvoice Number: INV-2026-889\nDate: 2026-07-22\nClient Name: Acme Software Inc.\n\nItems:\n- Web Application Development (50 hrs @ $120/hr) = $6,000.00\n- Firebase Cloud Infrastructure Setup (1 unit) = $1,500.00\n\nSubtotal: $7,500.00\nTax (10%): $750.00\nTotal Amount Due: $8,250.00`
  );
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionApiResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [visualFields, setVisualFields] = useState<SchemaField[]>([
    { key: 'invoiceNumber', type: 'string', description: 'Invoice unique identifier', required: true },
    { key: 'date', type: 'string', description: 'Issue date of the invoice', required: true },
    { key: 'clientName', type: 'string', description: 'Name of the billed client', required: true },
    { key: 'totalAmount', type: 'number', description: 'Total amount due', required: true },
    { key: 'taxAmount', type: 'number', description: 'Tax amount', required: false },
    {
      key: 'lineItems',
      type: 'array',
      itemsType: 'object',
      itemProperties: [
        { key: 'description', type: 'string', description: 'Item description' },
        { key: 'amount', type: 'number', description: 'Item cost' },
      ],
      description: 'List of billed line items',
      required: false,
    },
  ]);

  const [rawJsonSchema, setRawJsonSchema] = useState<string>(
    JSON.stringify(
      {
        invoiceNumber: { type: 'string', description: 'Invoice unique identifier' },
        date: { type: 'string', description: 'Issue date of the invoice' },
        clientName: { type: 'string', description: 'Name of the billed client' },
        totalAmount: { type: 'number', description: 'Total amount due' },
        taxAmount: { type: 'number', description: 'Tax amount' },
        lineItems: {
          type: 'array',
          description: 'List of billed line items',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              amount: { type: 'number' },
            },
          },
        },
      },
      null,
      2
    )
  );

  const activeModelDetails = useMemo(() => {
    return AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];
  }, [selectedModel]);

  const currentSchemaObject = useMemo(() => {
    if (activeTab === 'json') {
      try {
        return JSON.parse(rawJsonSchema || '{}');
      } catch {
        return {};
      }
    } else {
      const obj: Record<string, any> = {};
      visualFields.forEach((field) => {
        if (!field.key || !field.key.trim()) return;
        const fieldKey = field.key.trim();

        if (field.type === 'array') {
          const itemsType = field.itemsType || 'string';
          if (itemsType === 'object') {
            const subProps: Record<string, any> = {};
            (field.itemProperties || []).forEach((prop) => {
              if (prop.key && prop.key.trim()) {
                subProps[prop.key.trim()] = {
                  type: prop.type || 'string',
                  description: prop.description || '',
                };
              }
            });
            obj[fieldKey] = {
              type: 'array',
              description: field.description,
              items: {
                type: 'object',
                properties: subProps,
              },
            };
          } else {
            obj[fieldKey] = {
              type: 'array',
              description: field.description,
              items: itemsType,
            };
          }
        } else {
          obj[fieldKey] = {
            type: field.type,
            description: field.description,
          };
        }
      });
      return obj;
    }
  }, [activeTab, rawJsonSchema, visualFields]);

  // Client-Side Cost Calculation
  const computedCosts = useMemo(() => {
    if (!extractionResult?.usage) return { providerCost: 0, clientPrice: 0 };
    const promptTokens = extractionResult.usage.promptTokens || 0;
    const candidatesTokens = extractionResult.usage.candidatesTokens || 0;

    const inputCost = (promptTokens / 1_000_000) * activeModelDetails.inputRate;
    const outputCost = (candidatesTokens / 1_000_000) * activeModelDetails.outputRate;
    const providerCost = Number((inputCost + outputCost).toFixed(6));
    const clientPrice = Number((providerCost * markupMultiplier).toFixed(6));
    return { providerCost, clientPrice };
  }, [extractionResult, activeModelDetails, markupMultiplier]);

  const loadPreset = (templateName: string) => {
    const found = PRESET_TEMPLATES.find((p) => p.name === templateName);
    if (!found) return;

    setSchemaName(found.name);
    setSchemaDesc(found.description);
    setDocumentType(found.documentType);
    setVisualFields(
      found.fields.map((f) => ({
        key: f.key,
        type: f.type as any,
        itemsType: (f as any).itemsType || 'string',
        itemProperties: (f as any).itemProperties || [],
        description: f.description,
        required: f.required,
      }))
    );
  };

  const addField = () => {
    setVisualFields((prev) => [
      ...prev,
      {
        key: `field_${prev.length + 1}`,
        type: 'string',
        itemsType: 'string',
        itemProperties: [],
        description: '',
        required: false,
      },
    ]);
  };

  const removeField = (index: number) => {
    setVisualFields((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [key]: value };
      if (key === 'type' && value === 'array' && !target.itemsType) {
        target.itemsType = 'object';
        target.itemProperties = [
          { key: 'description', type: 'string', description: 'Item description' },
          { key: 'amount', type: 'number', description: 'Item amount' },
        ];
      }
      copy[index] = target;
      return copy;
    });
  };

  const addArrayItemProp = (fieldIdx: number) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIdx];
      const props = field.itemProperties || [];
      field.itemProperties = [...props, { key: `prop_${props.length + 1}`, type: 'string', description: '' }];
      return copy;
    });
  };

  const removeArrayItemProp = (fieldIdx: number, propIdx: number) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIdx];
      if (field.itemProperties) {
        field.itemProperties = field.itemProperties.filter((_, i) => i !== propIdx);
      }
      return copy;
    });
  };

  const updateArrayItemProp = (fieldIdx: number, propIdx: number, key: keyof ArrayItemProperty, val: any) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIdx];
      if (field.itemProperties) {
        const props = [...field.itemProperties];
        props[propIdx] = { ...props[propIdx], [key]: val };
        field.itemProperties = props;
      }
      return copy;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      reader.onload = () => {
        setUploadedFile({
          data: reader.result as string,
          mimeType: file.type || 'text/plain',
          fileName: file.name,
          isBase64: false,
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        setUploadedFile({
          data: reader.result as string,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          isBase64: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteExtraction = async () => {
    setExtractionError(null);
    setExtractionResult(null);

    const schemaObj = currentSchemaObject;
    if (!schemaObj || Object.keys(schemaObj).length === 0) {
      setExtractionError('Please define a valid non-empty extraction schema.');
      return;
    }

    let documentInput: any;
    if (inputType === 'file') {
      if (!uploadedFile) {
        setExtractionError('Please upload a document file (PDF, PNG, JPG, MD, TXT).');
        return;
      }
      documentInput = { data: uploadedFile.data, mimeType: uploadedFile.mimeType };
    } else {
      if (!pastedText || !pastedText.trim()) {
        setExtractionError('Please paste document text content.');
        return;
      }
      documentInput = pastedText;
    }

    setIsExtracting(true);
    try {
      const res = await extractDocument({
        schema: schemaObj,
        document: documentInput,
        documentType,
        userId: 'react_web_user',
        model: selectedModel,
        markupMultiplier,
      });
      setExtractionResult(res);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionError(err?.message || 'Failed to extract document. Check console or API connectivity.');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <section id="playground" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Model & Billing Selection Bar */}
      <div className="bg-slate-900 p-6 rounded-xl mb-8 border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Model Selector */}
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-blue-400 text-base">tune</span>
              AI Provider Model Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {AVAILABLE_MODELS.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`p-3.5 rounded-lg cursor-pointer transition-all border ${
                    selectedModel === m.id
                      ? 'bg-blue-950/60 border-blue-500 text-white'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    {selectedModel === m.id && (
                      <span className="material-symbols-outlined text-sm text-blue-400">check_circle</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block line-clamp-1 mb-2">{m.description}</span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 font-semibold">
                    <span>In: {m.inputRateText}</span>
                    <span>•</span>
                    <span>Out: {m.outputRateText}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Client Markup Input */}
          <div className="w-full lg:w-auto shrink-0 bg-slate-950/80 p-4 rounded-lg border border-slate-800">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-emerald-400 text-base">payments</span>
              Client Markup Multiplier
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="10.0"
                value={markupMultiplier}
                onChange={(e) => setMarkupMultiplier(parseFloat(e.target.value) || 1.0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-blue-500"
              />
              <span className="text-xs text-emerald-400 font-bold font-mono">
                {markupMultiplier}x ({((markupMultiplier - 1) * 100).toFixed(0)}% margin)
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Schema Builder & Document Input (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* CARD 1: Extraction Schema Definition */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xl">schema</span>
                <h2 className="text-base font-bold text-white">1. Schema Definition</h2>
              </div>
              
              {/* Presets & Tabs */}
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setActiveTab('visual')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                      activeTab === 'visual' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Visual Builder
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                      activeTab === 'json' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    JSON Code
                  </button>
                </div>
              </div>
            </div>

            {/* Presets Quick Pills */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-blue-400">bookmarks</span>
                Presets:
              </span>
              {PRESET_TEMPLATES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => loadPreset(p.name)}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 hover:text-blue-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs text-blue-400">code_blocks</span>
                  {p.name}
                </button>
              ))}
            </div>

            {/* Schema Meta Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Schema Title & Description
                </label>
                <input
                  type="text"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 mb-2"
                />
                <input
                  type="text"
                  placeholder="Schema description"
                  value={schemaDesc}
                  onChange={(e) => setSchemaDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="resume">Resume / CV</option>
                  <option value="contact">Contact Card</option>
                  <option value="general">General Document</option>
                </select>
              </div>
            </div>

            {/* VISUAL BUILDER TAB */}
            {activeTab === 'visual' ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {visualFields.map((field, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Field Key"
                            value={field.key}
                            onChange={(e) => updateField(idx, 'key', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="col-span-3">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, 'type', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="array">Array</option>
                            <option value="object">Object</option>
                          </select>
                        </div>

                        <div className="col-span-4">
                          <input
                            type="text"
                            placeholder="Description Prompt"
                            value={field.description}
                            onChange={(e) => updateField(idx, 'description', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeField(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Array Items Config Sub-row */}
                      {field.type === 'array' && (
                        <div className="pl-3 border-l-2 border-blue-500 bg-slate-900/60 p-2.5 rounded flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                              Array Elements Type:
                            </span>
                            <select
                              value={field.itemsType || 'object'}
                              onChange={(e) => updateField(idx, 'itemsType', e.target.value)}
                              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                            >
                              <option value="object">Array of Objects (Line Items)</option>
                              <option value="string">Array of Strings</option>
                              <option value="number">Array of Numbers</option>
                            </select>
                          </div>

                          {field.itemsType === 'object' && (
                            <div className="flex flex-col gap-1.5 mt-1">
                              <span className="text-[10px] font-semibold text-slate-400">Object Item Properties:</span>
                              {(field.itemProperties || []).map((prop, propIdx) => (
                                <div key={propIdx} className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800">
                                  <input
                                    type="text"
                                    placeholder="Property key"
                                    value={prop.key}
                                    onChange={(e) => updateArrayItemProp(idx, propIdx, 'key', e.target.value)}
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-white font-mono"
                                  />
                                  <select
                                    value={prop.type}
                                    onChange={(e) => updateArrayItemProp(idx, propIdx, 'type', e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white"
                                  >
                                    <option value="string">String</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                  </select>
                                  <button
                                    onClick={() => removeArrayItemProp(idx, propIdx)}
                                    className="text-slate-500 hover:text-rose-400 p-0.5"
                                  >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => addArrayItemProp(idx)}
                                className="self-start text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-wider flex items-center gap-1 mt-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">add</span>
                                Add Item Property
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addField}
                  className="self-start px-3 py-1.5 rounded border border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer mt-1"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Add Schema Field
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Raw JSON Schema Descriptor
                </label>
                <textarea
                  rows={8}
                  value={rawJsonSchema}
                  onChange={(e) => setRawJsonSchema(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-blue-400 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                ></textarea>
              </div>
            )}

          </div>

          {/* CARD 2: Document Input */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xl">upload_file</span>
                <h2 className="text-base font-bold text-white">2. Document Input</h2>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setInputType('text')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    inputType === 'text' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setInputType('file')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    inputType === 'file' ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {inputType === 'text' ? (
              <div>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste invoice markdown, receipt raw text, or document text here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3.5 text-slate-200 font-sans text-sm focus:outline-none focus:border-blue-500 leading-relaxed"
                ></textarea>
              </div>
            ) : (
              <div>
                {!uploadedFile ? (
                  <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/80 bg-slate-950 p-8 rounded-xl text-center transition-colors">
                    <input
                      type="file"
                      id="docFileInput"
                      accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/markdown"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="docFileInput" className="cursor-pointer flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-blue-400">cloud_upload</span>
                      <span className="text-sm font-bold text-white uppercase tracking-wider">Click or Drag & Drop File</span>
                      <span className="text-xs text-slate-400">Supports PDF, PNG, JPG, WebP, Markdown (.md), TXT</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-2xl text-rose-400">picture_as_pdf</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{uploadedFile.fileName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{uploadedFile.mimeType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-xs font-semibold text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteExtraction}
              disabled={isExtracting}
              className="w-full py-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              {isExtracting ? (
                <>
                  <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting with {activeModelDetails.name}...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                  <span>Extract Document Data ({activeModelDetails.name})</span>
                </>
              )}
            </button>

            {extractionError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{extractionError}</span>
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: Extracted JSON Viewer & Usage Billing (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Extracted JSON Output */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-4 min-h-[420px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400 text-xl">output</span>
                <h2 className="text-base font-bold text-white">Extracted JSON Output</h2>
              </div>

              {extractionResult?.data && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(extractionResult.data, null, 2));
                    alert('Copied extracted JSON to clipboard!');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                  Copy JSON
                </button>
              )}
            </div>

            {isExtracting ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="size-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400">Extracting structured JSON conforming to target schema...</p>
              </div>
            ) : extractionResult?.data ? (
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto max-h-[460px]">
                <pre className="text-xs text-blue-300 font-mono leading-relaxed m-0">
                  <code>{JSON.stringify(extractionResult.data, null, 2)}</code>
                </pre>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 gap-2">
                <span className="material-symbols-outlined text-4xl font-light">analytics</span>
                <p className="text-xs max-w-xs leading-relaxed">
                  Select a schema, provide a document, and click "Extract Document Data" to view structured output.
                </p>
              </div>
            )}
          </div>

          {/* Usage Metrics & Billing Summary */}
          {extractionResult?.usage && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400 text-base">payments</span>
                  Usage & Billing Breakdown
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded uppercase">
                  Logged in Firestore
                </span>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider Cost (Us)</span>
                  <span className="text-2xl font-extrabold text-white font-mono">${computedCosts.providerCost.toFixed(6)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{activeModelDetails.inputRateText} in / {activeModelDetails.outputRateText} out</span>
                </div>

                <div className="flex flex-col border-l border-slate-800 pl-4">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Client Charge</span>
                  <span className="text-2xl font-extrabold text-blue-400 font-mono">${computedCosts.clientPrice.toFixed(6)}</span>
                  <span className="text-[10px] text-blue-300 font-bold font-mono">{markupMultiplier}x markup ({((markupMultiplier - 1) * 100).toFixed(0)}% margin)</span>
                </div>
              </div>

              {/* Tokens & Latency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Latency</span>
                  <span className="text-base font-extrabold text-blue-400 font-mono">{extractionResult.usage.executionTimeMs} ms</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Total Tokens</span>
                  <span className="text-base font-extrabold text-white font-mono">{extractionResult.usage.totalTokens}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
};
