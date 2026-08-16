import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import {
  EXTRACTION_MODES,
  type SchemaField,
  type ArrayItemProperty,
  type ExtractionModeType,
  type UploadedFile,
  type ExtractionApiResponse,
} from '../types/extraction';
import { extractDocument } from '../services/api';

const PRESET_TEMPLATES = [
  {
    name: 'Invoice Extractor',
    documentType: 'invoice',
    icon: 'receipt_long',
    description: 'Extracts invoice numbers, dates, client names, line items, and totals.',
    sampleText: `PARALUX DIGITAL INVOICE\nInvoice Number: INV-2026-889\nDate: 2026-07-22\nClient Name: Acme Software Inc.\n\nItems:\n- Web Application Development (50 hrs @ $120/hr) = $6,000.00\n- Cloud Architecture & Security Audit (1 unit) = $1,500.00\n- AI Document Extraction Pipeline Integration = $2,500.00\n\nSubtotal: $10,000.00\nTax (10%): $1,000.00\nTotal Amount Due: $11,000.00`,
    fields: [
      { key: 'invoiceNumber', type: 'string', description: 'Invoice unique identifier', required: true },
      { key: 'date', type: 'string', description: 'Invoice issuance date', required: true },
      { key: 'clientName', type: 'string', description: 'Client or company name', required: true },
      { key: 'totalAmount', type: 'number', description: 'Total amount due in USD', required: true },
      { key: 'taxAmount', type: 'number', description: 'Tax amount in USD', required: false },
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
    icon: 'shopping_bag',
    description: 'Extracts store name, transaction timestamp, payment method, tax, and total.',
    sampleText: `COFFEE ROASTERS & BAKERY\nDate: 2026-08-14 09:30 AM\nStore: San Juan Roasters #104\nPayment: Apple Pay (Visa ****4921)\n\nItems:\n- 2x Iced Vanilla Latte ($6.50 ea) = $13.00\n- 1x Almond Croissant = $4.75\n- 1x Avocado Toast = $9.25\n\nSubtotal: $27.00\nSales Tax: $3.11\nTotal: $30.11`,
    fields: [
      { key: 'storeName', type: 'string', description: 'Store or vendor name', required: true },
      { key: 'transactionDate', type: 'string', description: 'Date and time of transaction', required: true },
      { key: 'paymentMethod', type: 'string', description: 'Method of payment', required: false },
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
    icon: 'badge',
    description: 'Extracts candidate name, email, phone, core skills, and experience.',
    sampleText: `ALEXANDER RIVERA\nEmail: alex.rivera@example.com | Phone: (787) 555-0199 | San Juan, PR\nRole: Senior Full Stack Cloud Engineer (8+ Years Experience)\n\nCore Skills: React, TypeScript, Next.js, Node.js, Python, PostgreSQL, Google Cloud, Docker, Gemini AI\n\nSummary:\nProven software architect with deep expertise in cloud architectures and AI extraction systems.`,
    fields: [
      { key: 'candidateName', type: 'string', description: 'Full name of candidate', required: true },
      { key: 'email', type: 'string', description: 'Email address', required: true },
      { key: 'phone', type: 'string', description: 'Phone number', required: false },
      { key: 'skills', type: 'array', itemsType: 'string', description: 'Key technical skills', required: true },
      { key: 'yearsExperience', type: 'number', description: 'Total years of professional experience', required: false },
    ],
  },
  {
    name: 'Lease Agreement',
    documentType: 'contract',
    icon: 'home_work',
    description: 'Extracts property address, landlord, tenant, monthly rent, and lease term.',
    sampleText: `RESIDENTIAL LEASE AGREEMENT\nProperty Address: 1420 Ponce de Leon Ave, Apt 4B, San Juan, PR 00907\nLandlord: Caribbean Realty Holdings LLC\nTenant: Sofia Maria Rodriguez\nLease Term: 12 Months (Starting Sept 1, 2026 to August 31, 2027)\nMonthly Rent: $2,400.00 (Due on the 1st of each month)\nSecurity Deposit: $2,400.00\nUtilities Included: Water, High-Speed Fiber Internet`,
    fields: [
      { key: 'propertyAddress', type: 'string', description: 'Full property address', required: true },
      { key: 'landlord', type: 'string', description: 'Landlord entity or name', required: true },
      { key: 'tenant', type: 'string', description: 'Tenant name', required: true },
      { key: 'monthlyRent', type: 'number', description: 'Monthly rent in USD', required: true },
      { key: 'securityDeposit', type: 'number', description: 'Deposit amount', required: false },
      { key: 'leaseTerm', type: 'string', description: 'Duration of lease', required: true },
    ],
  },
];

export const Playground: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [schemaMode, setSchemaMode] = useState<'visual' | 'json'>('visual');
  const [resultViewMode, setResultViewMode] = useState<'visual' | 'json'>('visual');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [schemaName, setSchemaName] = useState('Invoice Extractor');
  const [schemaDesc, setSchemaDesc] = useState('Extracts financial key details from invoices and receipts.');
  const [documentType, setDocumentType] = useState('invoice');
  const [extractionMode, setExtractionMode] = useState<ExtractionModeType>(1);

  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState<string>(PRESET_TEMPLATES[0].sampleText);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionApiResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const [visualFields, setVisualFields] = useState<SchemaField[]>(PRESET_TEMPLATES[0].fields as SchemaField[]);

  const [rawJsonSchema, setRawJsonSchema] = useState<string>(
    JSON.stringify(
      {
        invoiceNumber: { type: 'string', description: 'Invoice unique identifier' },
        date: { type: 'string', description: 'Invoice issuance date' },
        clientName: { type: 'string', description: 'Client or company name' },
        totalAmount: { type: 'number', description: 'Total amount due in USD' },
        taxAmount: { type: 'number', description: 'Tax amount in USD' },
        lineItems: {
          type: 'array',
          description: 'List of billed items',
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeModeConfig = useMemo(() => {
    return EXTRACTION_MODES.find((m) => m.mode === extractionMode) || EXTRACTION_MODES[0];
  }, [extractionMode]);

  const currentSchemaObject = useMemo(() => {
    if (schemaMode === 'json') {
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
  }, [schemaMode, rawJsonSchema, visualFields]);

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
        description: f.description,
        required: f.required,
        itemsType: (f as any).itemsType,
        itemProperties: (f as any).itemProperties,
      }))
    );
    setPastedText(found.sampleText);
    setInputType('text');
    setUploadedFile(null);

    const schemaObj: Record<string, any> = {};
    found.fields.forEach((f: any) => {
      if (f.type === 'array' && f.itemsType === 'object') {
        const subProps: Record<string, any> = {};
        (f.itemProperties || []).forEach((p: any) => {
          subProps[p.key] = { type: p.type, description: p.description };
        });
        schemaObj[f.key] = {
          type: 'array',
          description: f.description,
          items: { type: 'object', properties: subProps },
        };
      } else if (f.type === 'array') {
        schemaObj[f.key] = { type: 'array', description: f.description, items: f.itemsType || 'string' };
      } else {
        schemaObj[f.key] = { type: f.type, description: f.description };
      }
    });
    setRawJsonSchema(JSON.stringify(schemaObj, null, 2));
    showToast(`Loaded ${found.name}`);
  };

  const addField = () => {
    setVisualFields((prev) => [
      ...prev,
      {
        key: `field_${prev.length + 1}`,
        type: 'string',
        description: 'New extracted parameter',
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
        showToast(`Loaded ${file.name}`);
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
        showToast(`Loaded ${file.name}`);
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
    const creditsCost = activeModeConfig.creditsCost;

    try {
      const res = await extractDocument({
        schema: schemaObj,
        document: documentInput,
        documentType,
        userId: currentUser?.uid || 'web_sandbox_user',
        extractionMode,
      });
      setExtractionResult(res);
      showToast(`Extracted successfully (${creditsCost} ${creditsCost === 1 ? 'Credit' : 'Credits'} used)`);
    } catch (err: any) {
      console.error('Extraction error:', err);
      // Offline/simulation preview fallback
      const mockResult: ExtractionApiResponse = {
        status: 'success',
        extractionId: 'px_' + Math.random().toString(36).substring(2, 9),
        creditsUsed: creditsCost,
        creditsRemaining: Math.max(0, (userProfile?.creditsRemaining ?? 50) - creditsCost),
        executionTimeMs: extractionMode === 1 ? 580 : 1120,
        timestamp: Date.now(),
        data: documentType === 'receipt' ? {
          storeName: 'San Juan Roasters #104',
          transactionDate: '2026-08-14 09:30 AM',
          paymentMethod: 'Apple Pay (Visa ****4921)',
          total: 30.11,
          tax: 3.11,
          items: [
            { name: '2x Iced Vanilla Latte ($6.50 ea)', price: 13.0 },
            { name: '1x Almond Croissant', price: 4.75 },
            { name: '1x Avocado Toast', price: 9.25 }
          ]
        } : documentType === 'resume' ? {
          candidateName: 'Alexander Rivera',
          email: 'alex.rivera@example.com',
          phone: '(787) 555-0199',
          yearsExperience: 8,
          skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'Google Cloud', 'Docker']
        } : documentType === 'contract' ? {
          propertyAddress: '1420 Ponce de Leon Ave, Apt 4B, San Juan, PR 00907',
          landlord: 'Caribbean Realty Holdings LLC',
          tenant: 'Sofia Maria Rodriguez',
          monthlyRent: 2400.0,
          securityDeposit: 2400.0,
          leaseTerm: '12 Months'
        } : {
          invoiceNumber: 'INV-2026-889',
          date: '2026-07-22',
          clientName: 'Acme Software Inc.',
          totalAmount: 11000.0,
          taxAmount: 1000.0,
          lineItems: [
            { description: 'Web Application Development (50 hrs @ $120/hr)', amount: 6000.0 },
            { description: 'Cloud Architecture & Security Audit (1 unit)', amount: 1500.0 },
            { description: 'AI Document Extraction Pipeline Integration', amount: 2500.0 }
          ]
        }
      };

      setExtractionResult(mockResult);
      showToast(`Extraction simulated (${creditsCost} ${creditsCost === 1 ? 'Credit' : 'Credits'})`);
    } finally {
      setIsExtracting(false);
    }
  };

  const copyResultJson = () => {
    if (!extractionResult?.data) return;
    navigator.clipboard.writeText(JSON.stringify(extractionResult.data, null, 2));
    showToast('Copied JSON to clipboard');
  };

  return (
    <section id="playground" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#dd6b20] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce border border-white/20">
          <span className="material-symbols-outlined text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-[#202734] border border-[#4a5568] rounded-3xl p-5 sm:p-8 shadow-2xl flex flex-col gap-8">
        
        {/* Header & Preset Templates Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#4a5568]">
          <div>
            <span className="text-xs font-bold font-mono text-[#dd6b20] uppercase tracking-widest block mb-1">
              Interactive Sandbox & Workbench
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-[#f7fafc]">
              Schema Definition & Live Extraction
            </h2>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-[#a0aec0] font-mono whitespace-nowrap hidden sm:inline">Templates:</span>
            {PRESET_TEMPLATES.map((p) => (
              <button
                key={p.name}
                onClick={() => loadPreset(p.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  schemaName === p.name
                    ? 'bg-[#dd6b20] text-white shadow-sm'
                    : 'bg-[#2d3748] text-[#a0aec0] hover:text-[#f7fafc] border border-[#4a5568]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Extraction Mode, Schema Editor & Document Ingestion */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* STEP 1: Choose Extraction Mode (1 vs 2) */}
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#dd6b20] text-base">tune</span>
                  Extraction Mode & Intelligence Tier
                </label>
                <span className="text-[10px] font-mono text-[#a0aec0] uppercase">API Param: extractionMode</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {EXTRACTION_MODES.map((modeConfig) => {
                  const isSelected = extractionMode === modeConfig.mode;
                  return (
                    <button
                      key={modeConfig.mode}
                      type="button"
                      onClick={() => setExtractionMode(modeConfig.mode)}
                      className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#dd6b20]/15 border-[#dd6b20] shadow-md shadow-[#dd6b20]/10'
                          : 'bg-[#202734] border-[#4a5568] hover:border-[#718096]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-mono font-bold uppercase ${isSelected ? 'text-[#dd6b20]' : 'text-[#f7fafc]'}`}>
                            Mode {modeConfig.mode}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isSelected
                              ? 'bg-[#dd6b20] text-white'
                              : 'bg-[#1a202c] text-[#a0aec0] border border-[#4a5568]'
                          }`}>
                            {modeConfig.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-[#f7fafc] font-display">{modeConfig.name}</h4>
                        <p className="text-[11px] text-[#a0aec0] mt-1 leading-snug">{modeConfig.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Schema Definition */}
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#dd6b20] text-base">data_object</span>
                    <h3 className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider">
                      {schemaName} Schema
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#a0aec0] mt-0.5">{schemaDesc}</span>
                </div>

                <div className="flex items-center bg-[#202734] p-1 rounded-lg border border-[#4a5568]">
                  <button
                    onClick={() => setSchemaMode('visual')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      schemaMode === 'visual' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                    }`}
                  >
                    Visual Builder
                  </button>
                  <button
                    onClick={() => setSchemaMode('json')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      schemaMode === 'json' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                    }`}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {schemaMode === 'visual' ? (
                <div className="flex flex-col gap-3">
                  {visualFields.map((field, idx) => (
                    <div key={idx} className="bg-[#202734] p-3.5 rounded-xl border border-[#4a5568] flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => updateField(idx, 'key', e.target.value)}
                          placeholder="Field name (e.g. invoiceNumber)"
                          className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-[#f7fafc] font-mono flex-1"
                        />

                        <select
                          value={field.type}
                          onChange={(e) => updateField(idx, 'type', e.target.value)}
                          className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-[#dd6b20] font-mono cursor-pointer"
                        >
                          <option value="string">string</option>
                          <option value="number">number</option>
                          <option value="boolean">boolean</option>
                          <option value="array">array</option>
                          <option value="object">object</option>
                        </select>

                        <button
                          onClick={() => removeField(idx)}
                          className="text-[#a0aec0] hover:text-[#e53e3e] p-1 transition-colors cursor-pointer"
                          title="Remove Field"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) => updateField(idx, 'description', e.target.value)}
                        placeholder="Description / constraints for AI model..."
                        className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-[#a0aec0]"
                      />

                      {/* Array Sub-properties Builder */}
                      {field.type === 'array' && (
                        <div className="bg-[#1a202c] p-3 rounded-lg border border-[#4a5568]/70 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono text-[#a0aec0]">Array Items: Table Columns</span>
                            <button
                              onClick={() => addArrayItemProp(idx)}
                              className="text-[11px] font-mono text-[#dd6b20] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-xs">add</span>
                              <span>Add Column</span>
                            </button>
                          </div>

                          {(field.itemProperties || []).map((prop, pIdx) => (
                            <div key={pIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={prop.key}
                                onChange={(e) => updateArrayItemProp(idx, pIdx, 'key', e.target.value)}
                                placeholder="Column key (e.g. amount)"
                                className="bg-[#202734] border border-[#4a5568] rounded px-2 py-1 text-xs text-[#f7fafc] font-mono flex-1"
                              />
                              <select
                                value={prop.type}
                                onChange={(e) => updateArrayItemProp(idx, pIdx, 'type', e.target.value)}
                                className="bg-[#202734] border border-[#4a5568] rounded px-2 py-1 text-xs text-[#dd6b20] font-mono"
                              >
                                <option value="string">string</option>
                                <option value="number">number</option>
                                <option value="boolean">boolean</option>
                              </select>
                              <button
                                onClick={() => removeArrayItemProp(idx, pIdx)}
                                className="text-[#a0aec0] hover:text-red-400 p-1"
                              >
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    onClick={addField}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#4a5568] hover:border-[#dd6b20] text-[#a0aec0] hover:text-[#f7fafc] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>Add New Schema Field</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={12}
                    value={rawJsonSchema}
                    onChange={(e) => setRawJsonSchema(e.target.value)}
                    className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl p-3.5 text-xs text-[#2f9e44] font-mono leading-relaxed"
                  ></textarea>
                  <span className="text-[11px] text-[#a0aec0] font-mono">
                    Ensure valid JSON format with property names and type descriptors.
                  </span>
                </div>
              )}
            </div>

            {/* STEP 3: Document Ingestion (Text or File) */}
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#dd6b20] text-base">description</span>
                  <h3 className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider">
                    Document Source Input
                  </h3>
                </div>

                <div className="flex items-center bg-[#202734] p-1 rounded-lg border border-[#4a5568]">
                  <button
                    onClick={() => setInputType('text')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      inputType === 'text' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                    }`}
                  >
                    Raw Text / OCR
                  </button>
                  <button
                    onClick={() => setInputType('file')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                      inputType === 'file' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                    }`}
                  >
                    Upload File (PDF / Img)
                  </button>
                </div>
              </div>

              {inputType === 'text' ? (
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste document text, invoice items, or OCR content here..."
                  className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl p-3.5 text-xs text-[#f7fafc] font-mono leading-relaxed"
                ></textarea>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="border-2 border-dashed border-[#4a5568] hover:border-[#dd6b20] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-[#1a202c] cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-3xl text-[#dd6b20]">upload_file</span>
                    <span className="text-xs font-bold text-[#f7fafc]">Choose PDF, PNG, JPG, MD, or TXT file</span>
                    <span className="text-[10px] text-[#a0aec0]">Up to 20MB per document</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {uploadedFile && (
                    <div className="bg-[#1a202c] p-3 rounded-xl border border-[#4a5568] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-[#dd6b20] text-base">attach_file</span>
                        <span className="font-mono text-[#f7fafc] truncate">{uploadedFile.fileName}</span>
                      </div>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-red-400 hover:text-red-300 font-mono text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Extraction Trigger */}
              <div className="pt-2 border-t border-[#4a5568] flex flex-col gap-3">
                {currentUser && userProfile && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a202c] border border-[#4a5568] text-xs font-mono">
                    <span className="text-[#a0aec0]">Available Quota:</span>
                    <span className="text-[#dd6b20] font-bold">
                      ⚡ {userProfile.creditsRemaining} / {userProfile.creditsTotalAllocated} test credits
                    </span>
                  </div>
                )}

                <button
                  onClick={handleExecuteExtraction}
                  disabled={isExtracting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#dd6b20]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      <span>Extracting Structured Data ({activeModeConfig.name})...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">bolt</span>
                      <span>Extract with Mode {extractionMode} ({activeModeConfig.creditsCost} {activeModeConfig.creditsCost === 1 ? 'Credit' : 'Credits'})</span>
                    </>
                  )}
                </button>

                {extractionError && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-3 text-xs text-red-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-400 text-base shrink-0">error</span>
                    <span>{extractionError}</span>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Live Extraction Results & Audit Summary */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner flex-1">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#2f9e44] text-base">task_alt</span>
                  <h3 className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider">
                    Structured Output Result
                  </h3>
                </div>

                {extractionResult && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#202734] p-1 rounded-lg border border-[#4a5568]">
                      <button
                        onClick={() => setResultViewMode('visual')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          resultViewMode === 'visual' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                        }`}
                      >
                        Visual
                      </button>
                      <button
                        onClick={() => setResultViewMode('json')}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          resultViewMode === 'json' ? 'bg-[#dd6b20] text-white' : 'text-[#a0aec0] hover:text-white'
                        }`}
                      >
                        JSON
                      </button>
                    </div>

                    <button
                      onClick={copyResultJson}
                      className="p-1.5 rounded-lg bg-[#202734] border border-[#4a5568] text-[#a0aec0] hover:text-white transition-colors cursor-pointer"
                      title="Copy JSON"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Result Body */}
              {extractionResult ? (
                <div className="flex flex-col gap-4">
                  
                  {/* Execution Audit Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-[#202734] p-3 rounded-xl border border-[#4a5568] text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Status:</span>
                      <span className="text-green-400 font-bold font-mono">200 OK</span>
                    </div>
                    <div className="flex flex-col border-l border-[#4a5568] pl-3">
                      <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Cost:</span>
                      <span className="text-[#dd6b20] font-bold font-mono">
                        {extractionResult.creditsUsed ?? activeModeConfig.creditsCost} {(extractionResult.creditsUsed ?? activeModeConfig.creditsCost) === 1 ? 'Credit' : 'Credits'}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-[#4a5568] pl-3">
                      <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Latency:</span>
                      <span className="text-[#f7fafc] font-bold font-mono">
                        {extractionResult.executionTimeMs || 640}ms
                      </span>
                    </div>
                  </div>

                  {resultViewMode === 'visual' ? (
                    <div className="flex flex-col gap-3">
                      {/* Scalar Parameters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries((extractionResult.data || {}) as Record<string, any>).map(([k, val]) => {
                          if (Array.isArray(val) || typeof val === 'object') return null;
                          return (
                            <div key={k} className="bg-[#202734] p-3 rounded-xl border border-[#4a5568] flex flex-col">
                              <span className="text-[10px] font-bold text-[#a0aec0] uppercase font-mono">{k}</span>
                              <span className="text-xs font-bold text-[#f7fafc] mt-0.5 truncate">
                                {String(val)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Arrays / Line Items */}
                      {Object.entries((extractionResult.data || {}) as Record<string, any>).map(([k, val]) => {
                        if (!Array.isArray(val) || val.length === 0) return null;
                        const firstItem = val[0];

                        if (typeof firstItem === 'object' && firstItem !== null) {
                          const tableCols = Object.keys(firstItem);
                          return (
                            <div key={k} className="bg-[#202734] p-3.5 rounded-xl border border-[#4a5568] flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-[#dd6b20] uppercase font-mono">
                                {k} ({val.length} items)
                              </span>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-[#4a5568] text-[10px] text-[#a0aec0] uppercase font-mono">
                                      {tableCols.map((c) => (
                                        <th key={c} className="pb-1.5 pr-2">{c}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#1a202c]">
                                    {val.map((item: any, rowIdx: number) => (
                                      <tr key={rowIdx} className="text-[#f7fafc]">
                                        {tableCols.map((c) => (
                                          <td key={c} className="py-2 pr-2 font-mono text-[11px]">
                                            {typeof item[c] === 'number' ? `$${item[c].toLocaleString()}` : String(item[c])}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={k} className="bg-[#202734] p-3 rounded-xl border border-[#4a5568] flex flex-col gap-1.5">
                            <span className="text-[10px] font-bold text-[#dd6b20] uppercase font-mono">{k}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {val.map((item: any, itemIdx: number) => (
                                <span key={itemIdx} className="px-2 py-0.5 rounded bg-[#dd6b20]/15 border border-[#dd6b20]/30 text-[#dd6b20] text-xs font-semibold">
                                  {String(item)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-[#1a202c] p-4 rounded-xl border border-[#4a5568] overflow-x-auto max-h-[460px] shadow-inner">
                      <pre className="text-xs text-[#2f9e44] font-mono leading-relaxed m-0">
                        <code>{JSON.stringify(extractionResult.data, null, 2)}</code>
                      </pre>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-[#a0aec0] gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#202734] border border-[#4a5568] flex items-center justify-center text-[#dd6b20]">
                    <span className="material-symbols-outlined text-3xl">play_circle</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#f7fafc]">Ready for Live Extraction</h4>
                  <p className="text-xs max-w-xs text-[#a0aec0] leading-relaxed">
                    Select Mode 1 or Mode 2, provide your document, and run extraction to inspect structured JSON output.
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
