const SORT_OPTIONS = [
  { label: 'Price (Low to High)', value: '!price' },
  { label: 'Price (High to Low)', value: 'price' },
  { label: 'Newest', value: 'newest' },
  { label: 'Best Selling', value: 'best-selling' },
  { label: 'Availability', value: 'availability' },
  { label: 'Discount', value: 'discount' }
];

const OPERATIONS = [
  {
    id: 'products.list',
    label: 'Products: List',
    description: 'GET /api/v1/products with dedicated filter, sort, and pagination controls.',
    fields: [
      {
        key: 'filters.categories',
        label: 'Category IDs',
        type: 'number-list',
        section: 'filters',
        defaultValue: '73',
        placeholder: '73, 94'
      },
      {
        key: 'filters.availableOnly',
        label: 'Available Only',
        type: 'boolean',
        section: 'filters',
        defaultValue: true
      },
      {
        key: 'filters.discountedOnly',
        label: 'Discounted Only',
        type: 'boolean',
        section: 'filters',
        defaultValue: ''
      },
      {
        key: 'filters.priceMin',
        label: 'Min Price',
        type: 'number',
        section: 'filters',
        placeholder: '100000'
      },
      {
        key: 'filters.priceMax',
        label: 'Max Price',
        type: 'number',
        section: 'filters',
        placeholder: '900000'
      },
      {
        key: 'filters.pinnedIds',
        label: 'Pinned Product IDs',
        type: 'number-list',
        section: 'filters',
        placeholder: '101, 202'
      },
      {
        key: 'filters.similarTo',
        label: 'Similar To Product ID',
        type: 'number',
        section: 'filters',
        placeholder: '321'
      },
      {
        key: 'filters.sort',
        label: 'Sort',
        type: 'select',
        section: 'sort',
        options: SORT_OPTIONS,
        defaultValue: '!price'
      },
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 5,
        min: 1
      }
    ]
  },
  {
    id: 'products.get',
    label: 'Products: Get Single',
    description: 'GET /api/v1/entity_route/route?url_part=... resolved via products.get().',
    fields: [
      {
        key: 'slugOrPath',
        label: 'Slug or Path',
        type: 'text',
        section: 'request',
        defaultValue: '/product/تست-دیسکریپشن',
        required: true
      }
    ]
  },
  {
    id: 'search.search',
    label: 'Search: Global',
    description: 'GET /api/v1/search with SDK filter mapping and pagination controls.',
    fields: [
      {
        key: 'query',
        label: 'Search Query',
        type: 'text',
        section: 'request',
        defaultValue: 'بیج',
        required: true
      },
      {
        key: 'filters.categoryId',
        label: 'Category ID',
        type: 'number',
        section: 'filters',
        placeholder: '73'
      },
      {
        key: 'filters.minPrice',
        label: 'Min Price',
        type: 'number',
        section: 'filters',
        placeholder: '100000'
      },
      {
        key: 'filters.maxPrice',
        label: 'Max Price',
        type: 'number',
        section: 'filters',
        placeholder: '900000'
      },
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 5,
        min: 1
      }
    ]
  },
  {
    id: 'categories.list',
    label: 'Categories: List',
    description: 'GET /api/v1/product_categories with pagination form controls.',
    fields: [
      {
        key: 'filters.page',
        label: 'Page',
        type: 'number',
        section: 'pagination',
        defaultValue: 1,
        min: 1
      },
      {
        key: 'filters.pageSize',
        label: 'Page Size',
        type: 'number',
        section: 'pagination',
        defaultValue: 10,
        min: 1
      }
    ]
  },
  {
    id: 'categories.get',
    label: 'Categories: Get Single',
    description: 'GET /api/v1/product_categories/{idOrSlug}.',
    fields: [
      {
        key: 'idOrSlug',
        label: 'Category ID or Slug',
        type: 'text',
        section: 'request',
        defaultValue: '110',
        required: true
      }
    ]
  },
  {
    id: 'general.getInfo',
    label: 'General: Shop Info',
    description: 'GET /api/v2/general/info for store-level settings and feature flags.',
    fields: []
  },
  {
    id: 'visits.track',
    label: 'Visits: Track (POST)',
    description: 'POST /api/v1/visits to demonstrate request body transformation and response.',
    fields: [
      {
        key: 'visit',
        label: 'Visit Body JSON',
        type: 'json',
        section: 'request',
        defaultValue: {
          url: '/product/demo-item',
          referrer: 'visual-playground',
          userAgent: 'node-playground',
          entityType: 'product',
          entityId: 123
        }
      }
    ]
  }
];

const SECTION_LABELS = {
  request: 'Request',
  filters: 'Filters',
  sort: 'Sort',
  pagination: 'Pagination'
};

const domainInput = document.getElementById('domain');
const operationSelect = document.getElementById('operation');
const operationDescription = document.getElementById('operationDescription');
const dynamicFields = document.getElementById('dynamicFields');
const executeButton = document.getElementById('executeButton');
const expandAllButton = document.getElementById('expandAllButton');
const collapseAllButton = document.getElementById('collapseAllButton');
const copyFetchButton = document.getElementById('copyFetchButton');
const copyCurlButton = document.getElementById('copyCurlButton');
const statusOutput = document.getElementById('status');
const requestOutput = document.getElementById('requestOutput');
const responseOutput = document.getElementById('responseOutput');
const transportOutput = document.getElementById('transportOutput');
let lastCapturedRequest = null;

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function isContainer(value) {
  return Boolean(value) && typeof value === 'object';
}

function formatPrimitive(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  return 'undefined';
}

function getPrimitiveClass(value) {
  if (typeof value === 'string') return 'json-string';
  if (typeof value === 'number') return 'json-number';
  if (typeof value === 'boolean') return 'json-boolean';
  if (value === null) return 'json-null';
  return '';
}

function appendKey(target, key) {
  if (key === null || key === undefined) return;

  const keyToken = document.createElement('span');
  keyToken.className = 'json-key';
  keyToken.textContent = JSON.stringify(key);
  target.appendChild(keyToken);

  const colon = document.createElement('span');
  colon.className = 'json-punctuation';
  colon.textContent = ': ';
  target.appendChild(colon);
}

function buildSummaryLabel(value, isArray) {
  const size = isArray ? value.length : Object.keys(value).length;
  if (size === 0) return 'empty';
  return `${size} ${isArray ? 'items' : 'keys'}`;
}

function createPrimitiveLine(value, depth, key, isLast) {
  const line = document.createElement('div');
  line.className = 'json-line';
  line.style.setProperty('--depth', String(depth));

  appendKey(line, key);

  const valueToken = document.createElement('span');
  valueToken.className = getPrimitiveClass(value);
  valueToken.textContent = formatPrimitive(value);
  line.appendChild(valueToken);

  if (!isLast) {
    const comma = document.createElement('span');
    comma.className = 'json-punctuation';
    comma.textContent = ',';
    line.appendChild(comma);
  }

  return line;
}

function createContainerNode(value, depth, key, isLast, isArray) {
  const openToken = isArray ? '[' : '{';
  const closeToken = isArray ? ']' : '}';
  const entries = isArray ? value.map((item, index) => [index, item]) : Object.entries(value);

  const details = document.createElement('details');
  details.className = 'json-details';
  details.open = true;
  details.style.setProperty('--depth', String(depth));

  const summary = document.createElement('summary');
  summary.className = 'json-summary';

  appendKey(summary, key);

  const openBracket = document.createElement('span');
  openBracket.className = 'json-bracket';
  openBracket.textContent = `${openToken} `;
  summary.appendChild(openBracket);

  const meta = document.createElement('span');
  meta.className = 'json-meta';
  meta.textContent = buildSummaryLabel(value, isArray);
  summary.appendChild(meta);

  const closeBracket = document.createElement('span');
  closeBracket.className = 'json-bracket';
  closeBracket.textContent = ` ${closeToken}`;
  summary.appendChild(closeBracket);

  details.appendChild(summary);

  const children = document.createElement('div');
  children.className = 'json-children';
  children.style.setProperty('--depth', String(depth));

  entries.forEach((entry, index) => {
    const [entryKey, entryValue] = entry;
    const childKey = isArray ? null : entryKey;
    const childLast = index === entries.length - 1;
    children.appendChild(createJsonNode(entryValue, depth + 1, childKey, childLast));
  });

  details.appendChild(children);

  const closing = document.createElement('div');
  closing.className = 'json-line';
  closing.style.setProperty('--depth', String(depth));

  const close = document.createElement('span');
  close.className = 'json-bracket';
  close.textContent = closeToken;
  closing.appendChild(close);

  if (!isLast) {
    const comma = document.createElement('span');
    comma.className = 'json-punctuation';
    comma.textContent = ',';
    closing.appendChild(comma);
  }

  details.appendChild(closing);
  return details;
}

function createJsonNode(value, depth, key, isLast) {
  if (Array.isArray(value)) {
    return createContainerNode(value, depth, key, isLast, true);
  }

  if (isContainer(value)) {
    return createContainerNode(value, depth, key, isLast, false);
  }

  return createPrimitiveLine(value, depth, key, isLast);
}

function setJsonOutput(container, value) {
  const normalized = value === undefined ? null : value;
  container.innerHTML = '';
  container.appendChild(createJsonNode(normalized, 0, null, true));
}

function getActiveOutputContainer() {
  return document.querySelector('.tab-panel.active .json-output');
}

function setActiveOutputExpansion(expanded) {
  const container = getActiveOutputContainer();
  if (!container) return;

  const nodes = container.querySelectorAll('details.json-details');
  nodes.forEach(node => {
    node.open = expanded;
  });
}

function getOperationConfig(operationId) {
  return OPERATIONS.find(op => op.id === operationId);
}

function toFieldId(key) {
  return `field-${key.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
}

function getSdkFieldName(field) {
  if (field.sdkField) return field.sdkField;
  if (field.key.startsWith('filters.')) {
    return field.key.replace(/^filters\./, '');
  }
  return field.key;
}

function setDeepValue(target, path, value) {
  const keys = path.split('.');
  let ref = target;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    if (!ref[key] || typeof ref[key] !== 'object' || Array.isArray(ref[key])) {
      ref[key] = {};
    }
    ref = ref[key];
  }

  ref[keys[keys.length - 1]] = value;
}

function pruneEmptyObjects(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const cleaned = {};
  for (const [key, current] of Object.entries(value)) {
    if (current === undefined) continue;

    const normalized = pruneEmptyObjects(current);
    if (normalized === undefined) continue;
    if (typeof normalized === 'object' && !Array.isArray(normalized) && Object.keys(normalized).length === 0) {
      continue;
    }

    cleaned[key] = normalized;
  }

  if (Object.keys(cleaned).length === 0) {
    return undefined;
  }

  return cleaned;
}

function parseBoolean(rawValue) {
  if (rawValue === 'true') return true;
  if (rawValue === 'false') return false;
  return undefined;
}

function parseNumber(rawValue, key) {
  if (rawValue === '') return undefined;

  const number = Number(rawValue);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid number in field: ${key}`);
  }

  return number;
}

function parseNumberList(rawValue, key) {
  if (rawValue === '') return undefined;

  const items = rawValue
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  const parsed = items.map(value => Number(value));
  if (parsed.some(value => !Number.isFinite(value))) {
    throw new Error(`Invalid number list in field: ${key}`);
  }

  return parsed;
}

function createInput(field) {
  if (field.type === 'json') {
    const input = document.createElement('textarea');
    input.value = pretty(field.defaultValue ?? {});
    return input;
  }

  if (field.type === 'select') {
    const select = document.createElement('select');
    (field.options || []).forEach(optionConfig => {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      select.appendChild(option);
    });
    select.value = field.defaultValue ?? '';
    return select;
  }

  if (field.type === 'boolean') {
    const select = document.createElement('select');
    [
      { value: '', label: 'Not Set' },
      { value: 'true', label: 'true' },
      { value: 'false', label: 'false' }
    ].forEach(optionConfig => {
      const option = document.createElement('option');
      option.value = optionConfig.value;
      option.textContent = optionConfig.label;
      select.appendChild(option);
    });
    select.value = String(field.defaultValue ?? '');
    return select;
  }

  const input = document.createElement('input');
  input.type = field.type === 'number' ? 'number' : 'text';
  input.value = field.defaultValue ?? '';
  if (field.min !== undefined) input.min = String(field.min);
  if (field.max !== undefined) input.max = String(field.max);
  return input;
}

function createFieldRow(field) {
  const wrap = document.createElement('div');
  wrap.className = 'field-wrap';

  const inputId = toFieldId(field.key);
  const label = document.createElement('label');
  label.htmlFor = inputId;
  label.textContent = `${field.label} (${getSdkFieldName(field)})`;
  wrap.appendChild(label);

  const input = createInput(field);
  input.id = inputId;
  input.dataset.fieldKey = field.key;
  input.dataset.fieldType = field.type;
  input.dataset.required = field.required ? 'true' : 'false';
  input.placeholder = field.placeholder || '';
  wrap.appendChild(input);

  return wrap;
}

function createSectionHeader(section) {
  const header = document.createElement('p');
  header.className = 'field-section-title';
  header.textContent = SECTION_LABELS[section] || section;
  return header;
}

function renderFields() {
  const operation = getOperationConfig(operationSelect.value);
  dynamicFields.innerHTML = '';
  operationDescription.textContent = operation?.description || '';

  if (!operation) return;
  if (!operation.fields.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-fields';
    empty.textContent = 'No request input needed for this operation.';
    dynamicFields.appendChild(empty);
    return;
  }

  let activeSection = '';
  for (const field of operation.fields) {
    const section = field.section || 'request';
    if (section !== activeSection) {
      dynamicFields.appendChild(createSectionHeader(section));
      activeSection = section;
    }
    dynamicFields.appendChild(createFieldRow(field));
  }
}

function readInputFields() {
  const data = {};
  const inputs = dynamicFields.querySelectorAll('[data-field-key]');

  for (const input of inputs) {
    const key = input.dataset.fieldKey;
    const type = input.dataset.fieldType;
    const isRequired = input.dataset.required === 'true';
    const rawValue = input.value.trim();

    if (isRequired && rawValue === '') {
      throw new Error(`Field is required: ${key}`);
    }

    let parsed;

    if (type === 'json') {
      if (!rawValue) {
        parsed = {};
      } else {
        try {
          parsed = JSON.parse(rawValue);
        } catch {
          throw new Error(`Invalid JSON in field: ${key}`);
        }
      }
    } else if (type === 'number') {
      parsed = parseNumber(rawValue, key);
    } else if (type === 'number-list') {
      parsed = parseNumberList(rawValue, key);
    } else if (type === 'boolean') {
      parsed = parseBoolean(rawValue);
    } else {
      parsed = rawValue === '' ? undefined : rawValue;
    }

    if (parsed === undefined) continue;
    setDeepValue(data, key, parsed);
  }

  return pruneEmptyObjects(data) || {};
}

function setStatus(message, isError = false) {
  statusOutput.textContent = message;
  statusOutput.style.color = isError ? '#8b2200' : '#493f35';
}

function updateCopyButtons() {
  const enabled = Boolean(lastCapturedRequest && lastCapturedRequest.fullUrl);
  copyFetchButton.disabled = !enabled;
  copyCurlButton.disabled = !enabled;
}

function escapeSingleQuotedShell(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function normalizeRequestForExport(request) {
  if (!request || typeof request !== 'object') return null;
  if (!request.fullUrl) return null;

  return {
    method: String(request.method || 'GET').toUpperCase(),
    fullUrl: String(request.fullUrl),
    headers: request.headers && typeof request.headers === 'object' ? request.headers : {},
    body: request.body
  };
}

function buildFetchSnippet(request) {
  if (!request) return '';

  const lines = [
    `const response = await fetch(${JSON.stringify(request.fullUrl)}, {`,
    `  method: ${JSON.stringify(request.method)},`
  ];

  const headerEntries = Object.entries(request.headers || {});
  if (headerEntries.length > 0) {
    lines.push('  headers: {');
    for (const [key, value] of headerEntries) {
      lines.push(`    ${JSON.stringify(key)}: ${JSON.stringify(String(value))},`);
    }
    lines.push('  },');
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined && request.body !== null) {
    if (typeof request.body === 'string') {
      lines.push(`  body: ${JSON.stringify(request.body)},`);
    } else {
      lines.push('  body: JSON.stringify(');
      pretty(request.body).split('\n').forEach(line => lines.push(`    ${line}`));
      lines.push('  ),');
    }
  }

  lines.push('});');
  lines.push('');
  lines.push('const data = await response.json();');
  lines.push('console.log(data);');

  return lines.join('\n');
}

function buildCurlCommand(request) {
  if (!request) return '';

  const parts = ['curl', '-X', request.method, escapeSingleQuotedShell(request.fullUrl)];
  for (const [key, value] of Object.entries(request.headers || {})) {
    parts.push('-H', escapeSingleQuotedShell(`${key}: ${String(value)}`));
  }

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.body !== undefined && request.body !== null) {
    const body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    parts.push('--data-raw', escapeSingleQuotedShell(body));
  }

  return parts.join(' ');
}

async function copyText(text) {
  if (!text) return false;

  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'fixed';
  temp.style.opacity = '0';
  document.body.appendChild(temp);
  temp.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(temp);
  return copied;
}

async function handleCopyRequest(format) {
  if (!lastCapturedRequest) {
    setStatus('Run a request first, then copy fetch/cURL.', true);
    return;
  }

  const output = format === 'fetch'
    ? buildFetchSnippet(lastCapturedRequest)
    : buildCurlCommand(lastCapturedRequest);

  const copied = await copyText(output);
  if (!copied) {
    setStatus(`Unable to copy ${format}.`, true);
    return;
  }

  setStatus(format === 'fetch' ? 'Fetch snippet copied.' : 'cURL command copied.');
}

async function execute() {
  setStatus('Running request...');
  executeButton.disabled = true;

  let input;
  try {
    input = readInputFields();
  } catch (error) {
    setStatus(error.message, true);
    executeButton.disabled = false;
    return;
  }

  const payload = {
    operation: operationSelect.value,
    domain: domainInput.value.trim(),
    input
  };

  setJsonOutput(requestOutput, payload);

  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      setJsonOutput(responseOutput, data.error || data);
      setJsonOutput(transportOutput, { httpStatus: response.status });
      setStatus('Request failed. Check response tab.', true);
      return;
    }

    lastCapturedRequest = normalizeRequestForExport(data.request);
    updateCopyButtons();
    setJsonOutput(requestOutput, data.request || {});
    setJsonOutput(responseOutput, {
      meta: data.meta,
      response: data.response
    });
    setJsonOutput(transportOutput, data.transport || {});

    const statusBadge = data.response?.ok ? 'success' : 'error';
    const httpStatus = data.transport?.httpStatus ?? data.response?.status ?? 'unknown';
    const duration = data.meta?.durationMs ?? 0;
    setStatus(`Completed (${statusBadge}) in ${duration}ms, HTTP ${httpStatus}.`);
  } catch (error) {
    setJsonOutput(responseOutput, { error: error.message || 'Network error' });
    setStatus('Network error while calling /api/execute.', true);
  } finally {
    executeButton.disabled = false;
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      panels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.panel === target);
      });
    });
  });
}

function bootstrap() {
  for (const operation of OPERATIONS) {
    const option = document.createElement('option');
    option.value = operation.id;
    option.textContent = operation.label;
    operationSelect.appendChild(option);
  }

  renderFields();
  updateCopyButtons();
  operationSelect.addEventListener('change', renderFields);
  executeButton.addEventListener('click', execute);
  expandAllButton.addEventListener('click', () => setActiveOutputExpansion(true));
  collapseAllButton.addEventListener('click', () => setActiveOutputExpansion(false));
  copyFetchButton.addEventListener('click', () => handleCopyRequest('fetch'));
  copyCurlButton.addEventListener('click', () => handleCopyRequest('curl'));
  setupTabs();
  setJsonOutput(requestOutput, {});
  setJsonOutput(responseOutput, {});
  setJsonOutput(transportOutput, {});
}

bootstrap();
