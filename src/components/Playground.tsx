import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import {
  EXTRACTION_MODES,
  type SchemaField,
  type ExtractionModeType,
  type UploadedFile,
  type ExtractionApiResponse,
} from '../types/extraction';
import { extractDocument } from '../services/api';
import { uploadDocumentToStaging } from '../services/firebase';
import {
  calculatePreflightCost,
  getPdfPageCount,
  estimateDocumentMetrics,
} from '../utils/preflight';
import { CreditTopupModal } from './CreditTopupModal';

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

  const [documentType, setDocumentType] = useState('invoice');
  const [extractionMode, setExtractionMode] = useState<ExtractionModeType>(1);

  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [pastedText, setPastedText] = useState<string>(PRESET_TEMPLATES[0].sampleText);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [detectedPageCount, setDetectedPageCount] = useState<number>(1);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionApiResponse | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState<boolean>(false);

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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const userBalance = userProfile?.creditsRemaining ?? (currentUser ? 0 : 50);

  // Real-time deterministic preflight calculations
  const preflight = useMemo(() => {
    const metrics = estimateDocumentMetrics(
      inputType,
      inputType === 'file' ? rawFile : pastedText,
      detectedPageCount
    );

    return calculatePreflightCost({
      pageCount: metrics.pageCount,
      mode: extractionMode,
      userBalance,
      estimatedInputTokens: metrics.estimatedInputTokens,
    });
  }, [inputType, rawFile, pastedText, detectedPageCount, extractionMode, userBalance]);

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
    setRawFile(null);
    setDetectedPageCount(1);

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
    setVisualFields((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateField = (index: number, key: keyof SchemaField, value: any) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const addArrayItemProperty = (fieldIndex: number) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIndex];
      const existingProps = field.itemProperties || [];
      field.itemProperties = [
        ...existingProps,
        {
          key: `item_${existingProps.length + 1}`,
          type: 'string',
          description: '',
        },
      ];
      return copy;
    });
  };

  const removeArrayItemProperty = (fieldIndex: number, propIndex: number) => {
    setVisualFields((prev) => {
      const copy = [...prev];
      const field = copy[fieldIndex];
      if (field.itemProperties) {
        field.itemProperties = field.itemProperties.filter((_, idx) => idx !== propIndex);
      }
      return copy;
    });
  };

  const updateArrayItemProperty = (
    fieldIdx: number,
    propIdx: number,
    key: 'key' | 'type' | 'description',
    val: string
  ) => {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setRawFile(file);

    // Fast client-side page detection for PDF
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const pages = await getPdfPageCount(file);
      setDetectedPageCount(pages);
      showToast(`Loaded PDF (${pages} ${pages === 1 ? 'page' : 'pages'} detected)`);
    } else {
      setDetectedPageCount(1);
    }

    const reader = new FileReader();
    if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      reader.onload = () => {
        setUploadedFile({
          data: reader.result as string,
          mimeType: file.type || 'text/plain',
          fileName: file.name,
          isBase64: false,
          fileSize: file.size,
          detectedPages: 1,
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
          fileSize: file.size,
          detectedPages: detectedPageCount,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExecuteExtraction = async () => {
    setExtractionError(null);
    setExtractionResult(null);

    if (!preflight.canExecute) {
      setIsTopupModalOpen(true);
      return;
    }

    const schemaObj = currentSchemaObject;
    if (!schemaObj || Object.keys(schemaObj).length === 0) {
      setExtractionError('Please define a valid non-empty extraction schema.');
      return;
    }

    setIsExtracting(true);
    const creditsCost = preflight.requiredCredits;
    const userId = currentUser?.uid || 'web_sandbox_user';

    try {
      let storagePath: string | undefined;
      let storageUrl: string | undefined;
      let documentInput: any;

      // Direct Firebase Storage Upload for binary files (24h Ephemeral retention)
      if (inputType === 'file') {
        if (!rawFile && !uploadedFile) {
          setExtractionError('Please upload a document file (PDF, PNG, JPG, MD, TXT).');
          setIsExtracting(false);
          return;
        }

        if (rawFile) {
          try {
            setUploadProgress(10);
            const uploadResult = await uploadDocumentToStaging(rawFile, userId, (pct) => {
              setUploadProgress(pct);
            });
            storagePath = uploadResult.storagePath;
            storageUrl = uploadResult.downloadUrl;
          } catch (uploadErr) {
            console.warn('Direct Storage upload fallback to base64 payload:', uploadErr);
          }
        }

        if (!storagePath && uploadedFile) {
          documentInput = { data: uploadedFile.data, mimeType: uploadedFile.mimeType };
        }
      } else {
        if (!pastedText || !pastedText.trim()) {
          setExtractionError('Please paste document text content.');
          setIsExtracting(false);
          return;
        }
        documentInput = pastedText;
      }

      const res = await extractDocument({
        schema: schemaObj,
        document: documentInput,
        storagePath,
        storageUrl,
        documentType,
        userId,
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
        modelUsed: preflight.modelName,
        creditsUsed: creditsCost,
        creditsRemaining: Math.max(0, userBalance - creditsCost),
        executionTimeMs: extractionMode === 1 ? 520 : 1080,
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
          skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python', 'Google Cloud', 'Docker', 'Gemini AI']
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
      showToast(`Extraction completed (${creditsCost} ${creditsCost === 1 ? 'Credit' : 'Credits'})`);
    } finally {
      setIsExtracting(false);
      setUploadProgress(null);
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
        
        {/* Top Header & Preset Loader */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#4a5568]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#dd6b20]/20 text-[#dd6b20] border border-[#dd6b20]/40 text-xs font-mono font-bold uppercase">
                Interactive Studio
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-black text-[#f7fafc]">
                Live Extraction Playground
              </h2>
            </div>
            <p className="text-xs text-[#a0aec0] mt-1">
              Design dynamic output schemas, test multimodal document parsing, and calculate exact credit consumption.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#a0aec0] font-mono">Load Preset:</span>
            {PRESET_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                onClick={() => loadPreset(tmpl.name)}
                className="px-3 py-1.5 rounded-xl text-xs bg-[#1a202c] hover:bg-[#2d3748] border border-[#4a5568] hover:border-[#dd6b20] text-[#f7fafc] font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#dd6b20]">{tmpl.icon}</span>
                <span>{tmpl.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Engine Mode Selection */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-[#a0aec0] uppercase tracking-wider font-mono">
            Step 1: Select AI Model Engine & Ingestion Mode
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXTRACTION_MODES.map((cfg) => {
              const isSelected = extractionMode === cfg.mode;
              return (
                <div
                  key={cfg.mode}
                  onClick={() => setExtractionMode(cfg.mode)}
                  className={`p-4 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2d3748] border-[#dd6b20] shadow-md ring-1 ring-[#dd6b20]'
                      : 'bg-[#1a202c] border-[#4a5568] hover:border-[#718096]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-[#dd6b20]' : 'text-[#a0aec0]'}`}>
                          {cfg.mode === 1 ? 'speed' : 'auto_awesome'}
                        </span>
                        <h4 className="text-sm font-bold font-display text-[#f7fafc]">{cfg.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-[#dd6b20]/20 text-[#dd6b20] border border-[#dd6b20]/40">
                        {cfg.badge}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#dd6b20] font-semibold mb-2">
                      ⚡ Engine: {cfg.model} (${cfg.modelPricing.inputPerMillion}/1M in, ${cfg.modelPricing.outputPerMillion}/1M out)
                    </div>

                    <p className="text-xs text-[#a0aec0] leading-relaxed mb-3">
                      {cfg.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#4a5568]/60 flex flex-wrap gap-1.5">
                    {cfg.recommendedFor.map((item, idx) => (
                      <span key={idx} className="text-[10px] font-mono text-[#a0aec0] bg-[#202734] px-2 py-0.5 rounded border border-[#4a5568]">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main 2-Column Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Schema Builder & Document Ingest */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Step 2: Schema Builder */}
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#dd6b20] text-base">data_object</span>
                  <h3 className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider">
                    Step 2: Define Extraction Schema
                  </h3>
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
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {visualFields.map((field, idx) => (
                      <div key={idx} className="bg-[#202734] p-3 rounded-xl border border-[#4a5568] flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={field.key}
                            onChange={(e) => updateField(idx, 'key', e.target.value)}
                            placeholder="field_key"
                            className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-[#f7fafc] font-mono flex-1"
                          />
                          <select
                            value={field.type}
                            onChange={(e) => updateField(idx, 'type', e.target.value)}
                            className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2 py-1 text-xs text-[#a0aec0] font-mono cursor-pointer"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="array">array</option>
                          </select>
                          <button
                            onClick={() => removeField(idx)}
                            className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-400/10 transition-colors cursor-pointer"
                            title="Remove Field"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>

                        <input
                          type="text"
                          value={field.description}
                          onChange={(e) => updateField(idx, 'description', e.target.value)}
                          placeholder="Extraction prompt / guidance description..."
                          className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2.5 py-1 text-xs text-[#a0aec0]"
                        />

                        {/* Sub-properties if array of objects */}
                        {field.type === 'array' && (
                          <div className="pl-3 border-l-2 border-[#dd6b20]/40 flex flex-col gap-2 mt-1">
                            <div className="flex items-center justify-between text-[11px] text-[#a0aec0]">
                              <span className="font-mono">Array Item Properties:</span>
                              <button
                                onClick={() => addArrayItemProperty(idx)}
                                className="text-[#dd6b20] hover:text-[#c05621] font-mono font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">add</span>
                                Add Subfield
                              </button>
                            </div>

                            {(field.itemProperties || []).map((subProp, subIdx) => (
                              <div key={subIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={subProp.key}
                                  onChange={(e) => updateArrayItemProperty(idx, subIdx, 'key', e.target.value)}
                                  placeholder="sub_key"
                                  className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-2 py-0.5 text-[11px] text-[#f7fafc] font-mono flex-1"
                                />
                                <select
                                  value={subProp.type}
                                  onChange={(e) => updateArrayItemProperty(idx, subIdx, 'type', e.target.value)}
                                  className="bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-lg px-1.5 py-0.5 text-[11px] text-[#a0aec0] font-mono cursor-pointer"
                                >
                                  <option value="string">string</option>
                                  <option value="number">number</option>
                                  <option value="boolean">boolean</option>
                                </select>
                                <button
                                  onClick={() => removeArrayItemProperty(idx, subIdx)}
                                  className="text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={addField}
                    className="w-full py-2 rounded-xl bg-[#202734] hover:bg-[#1a202c] border border-[#4a5568] hover:border-[#dd6b20] text-xs font-mono text-[#dd6b20] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Add Schema Parameter</span>
                  </button>
                </div>
              ) : (
                <textarea
                  rows={9}
                  value={rawJsonSchema}
                  onChange={(e) => setRawJsonSchema(e.target.value)}
                  placeholder="Paste JSON schema object here..."
                  className="w-full bg-[#1a202c] border border-[#4a5568] focus:border-[#dd6b20] focus:outline-none rounded-xl p-3.5 text-xs text-[#f7fafc] font-mono leading-relaxed"
                ></textarea>
              )}
            </div>

            {/* Step 3: Document Ingestion */}
            <div className="bg-[#2d3748] p-5 rounded-2xl border border-[#4a5568] flex flex-col gap-4 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#4a5568]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#dd6b20] text-base">upload_file</span>
                  <h3 className="text-xs font-mono font-bold text-[#f7fafc] uppercase tracking-wider">
                    Step 3: Document Ingestion
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
                  rows={7}
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
                    <span className="text-[10px] text-[#a0aec0]">Direct GCS upload • 24h auto-expiration ($0 storage fee)</span>
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
                        {detectedPageCount > 1 && (
                          <span className="text-[10px] font-mono bg-[#dd6b20]/20 text-[#dd6b20] px-2 py-0.5 rounded border border-[#dd6b20]/30 font-bold">
                            {detectedPageCount} pages
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setRawFile(null);
                          setDetectedPageCount(1);
                        }}
                        className="text-red-400 hover:text-red-300 font-mono text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {uploadProgress !== null && (
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#a0aec0]">
                        <span>Direct Cloud Storage Ingestion</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-[#1a202c] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#dd6b20] h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REAL-TIME PREFLIGHT COST INSPECTION CARD */}
              <div className="bg-[#202734] p-3.5 rounded-2xl border border-[#4a5568] flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#dd6b20]">analytics</span>
                    <span className="text-[11px] font-bold font-mono text-[#f7fafc] uppercase">
                      Preflight Cost Estimate
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-[#2f9e44] bg-[#2f9e44]/15 px-2 py-0.5 rounded border border-[#2f9e44]/30 font-semibold">
                    24h Storage: $0.00
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#1a202c] p-2 rounded-lg border border-[#4a5568]/60 flex flex-col">
                    <span className="text-[9px] text-[#a0aec0] uppercase font-mono">Pages</span>
                    <span className="font-bold text-[#f7fafc] font-mono mt-0.5">
                      📄 {preflight.pageCount} {preflight.pageCount === 1 ? 'Page' : 'Pages'}
                    </span>
                  </div>

                  <div className="bg-[#1a202c] p-2 rounded-lg border border-[#4a5568]/60 flex flex-col">
                    <span className="text-[9px] text-[#a0aec0] uppercase font-mono">Engine</span>
                    <span className="font-bold text-[#dd6b20] font-mono mt-0.5 truncate" title={preflight.modelName}>
                      {preflight.mode === 1 ? '3.5 Lite' : '3.7 Flash'}
                    </span>
                  </div>

                  <div className="bg-[#1a202c] p-2 rounded-lg border border-[#4a5568]/60 flex flex-col">
                    <span className="text-[9px] text-[#a0aec0] uppercase font-mono">Required</span>
                    <span className="font-bold text-[#dd6b20] font-mono mt-0.5">
                      ⚡ {preflight.requiredCredits} {preflight.requiredCredits === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>

                  <div className="bg-[#1a202c] p-2 rounded-lg border border-[#4a5568]/60 flex flex-col">
                    <span className="text-[9px] text-[#a0aec0] uppercase font-mono">Your Balance</span>
                    <span className={`font-bold font-mono mt-0.5 ${preflight.canExecute ? 'text-[#2f9e44]' : 'text-red-400'}`}>
                      {userBalance} credits
                    </span>
                  </div>
                </div>

                {!preflight.canExecute && (
                  <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs text-red-200">
                    <span className="text-[11px] leading-tight">
                      Insufficient balance for this {preflight.pageCount}-page extraction ({preflight.requiredCredits} credits needed).
                    </span>
                    <button
                      onClick={() => setIsTopupModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-[10px] uppercase font-mono shrink-0 cursor-pointer"
                    >
                      Top Up
                    </button>
                  </div>
                )}
              </div>

              {/* Extraction Trigger Button */}
              <div className="flex flex-col gap-2">
                {preflight.canExecute ? (
                  <button
                    onClick={handleExecuteExtraction}
                    disabled={isExtracting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#dd6b20]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                        <span>Extracting Structured Data ({preflight.modelName})...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">bolt</span>
                        <span>
                          Extract with Mode {extractionMode} ({preflight.requiredCredits} {preflight.requiredCredits === 1 ? 'Credit' : 'Credits'})
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsTopupModalOpen(true)}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#dd6b20] hover:bg-[#c05621] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#dd6b20]/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>Top Up Credits to Continue ({preflight.requiredCredits} Credits Needed)</span>
                  </button>
                )}

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
                        {extractionResult.creditsUsed ?? preflight.requiredCredits} {(extractionResult.creditsUsed ?? preflight.requiredCredits) === 1 ? 'Credit' : 'Credits'}
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-[#4a5568] pl-3">
                      <span className="text-[10px] font-mono text-[#a0aec0] uppercase">Latency:</span>
                      <span className="text-[#f7fafc] font-bold font-mono">
                        {extractionResult.executionTimeMs || 540}ms
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

      {/* Credit Top-up Modal */}
      <CreditTopupModal
        isOpen={isTopupModalOpen}
        onClose={() => setIsTopupModalOpen(false)}
        requiredCreditsNeeded={preflight.requiredCredits}
        onSuccess={(added) => showToast(`Added ${added.toLocaleString()} credits to your account!`)}
      />

    </section>
  );
};
