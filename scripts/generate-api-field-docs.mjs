#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const repoRoot = process.cwd();

const SOURCE_FILES = [
  'src/types/common.ts',
  'src/types/product.ts',
  'src/types/cart.ts',
  'src/types/order.ts',
  'src/types/invoice.ts',
  'src/types/shipping.ts',
  'src/types/payment.ts',
  'src/types/search.ts',
  'src/types/entity-route.ts',
  'src/types/menu.ts',
  'src/core/config.ts',
  'src/api/users.ts',
  'src/api/cms.ts',
  'src/api/booking.ts',
  'src/api/feedbacks.ts',
  'src/api/general.ts',
  'src/api/wallet.ts',
  'src/api/visits.ts',
  'src/api/categories.ts',
  'src/api/images.ts',
  'src/api/search.ts',
];

const PAGE_TYPE_MAP = {
  'docs/content/docs/api-reference/products.mdx': [
    'src/types/product.ts:ProductFilters',
    'src/types/product.ts:Product',
    'src/types/product.ts:ProductVariant',
    'src/types/product.ts:ProductCategory',
    'src/types/common.ts:ProductAttribute',
    'src/types/common.ts:Image',
    'src/types/search.ts:SearchResponse',
  ],
  'docs/content/docs/api-reference/categories.mdx': [
    'src/api/categories.ts:CategoryFilters',
    'src/api/categories.ts:CategoryListResponse',
    'src/api/categories.ts:CategoryTree',
    'src/api/categories.ts:CategoryTreeNode',
    'src/types/product.ts:ProductCategory',
  ],
  'docs/content/docs/api-reference/cart.mdx': [
    'src/types/cart.ts:CreateCartInput',
    'src/types/cart.ts:AddToCartInput',
    'src/types/cart.ts:Cart',
    'src/types/cart.ts:CartProduct',
  ],
  'docs/content/docs/api-reference/orders.mdx': [
    'src/types/order.ts:OrderFilters',
    'src/types/order.ts:Order',
    'src/types/invoice.ts:InvoiceItem',
    'src/types/invoice.ts:ShippingAddress',
    'src/types/payment.ts:PaymentMethod',
  ],
  'docs/content/docs/api-reference/shipping.mdx': [
    'src/types/shipping.ts:ShippingAddressInput',
    'src/types/invoice.ts:ShippingAddress',
    'src/types/shipping.ts:ShippingMethod',
    'src/types/shipping.ts:ShippingRate',
  ],
  'docs/content/docs/api-reference/payments.mdx': [
    'src/types/payment.ts:PaymentMethod',
    'src/types/payment.ts:Payment',
    'src/types/payment.ts:PaymentAction',
    'src/types/payment.ts:PaymentStepInput',
  ],
  'docs/content/docs/api-reference/invoices.mdx': [
    'src/types/shipping.ts:ShippingAssignment',
    'src/types/shipping.ts:ApplicableShippingMethods',
    'src/types/invoice.ts:Invoice',
    'src/types/invoice.ts:InvoiceItem',
    'src/types/invoice.ts:ShippingItem',
    'src/types/invoice.ts:ShippingAddress',
    'src/types/invoice.ts:User',
  ],
  'docs/content/docs/api-reference/users.mdx': [
    'src/api/users.ts:LoginInput',
    'src/api/users.ts:RegisterInput',
    'src/api/users.ts:MobileLoginInput',
    'src/api/users.ts:VerifyMobileInput',
    'src/api/users.ts:EmailLoginRequestInput',
    'src/api/users.ts:ForgotPasswordInput',
    'src/api/users.ts:ResetPasswordInput',
    'src/api/users.ts:UpdateProfileInput',
    'src/api/users.ts:UpdateMobilePhoneRequestInput',
    'src/api/users.ts:UpdateMobilePhoneVerificationInput',
    'src/api/users.ts:LoginResponse',
    'src/types/invoice.ts:User',
  ],
  'docs/content/docs/api-reference/search.mdx': [
    'src/api/search.ts:SearchFilters',
    'src/types/search.ts:SearchResponse',
    'src/types/product.ts:Product',
    'src/types/search.ts:BlogPage',
    'src/types/search.ts:CmsPage',
    'src/types/product.ts:ProductCategory',
  ],
  'docs/content/docs/api-reference/menu.mdx': [
    'src/types/menu.ts:MenuItem',
    'src/types/menu.ts:MenuTree',
    'src/types/menu.ts:MenuNode',
  ],
  'docs/content/docs/api-reference/entity-routes.mdx': [
    'src/types/entity-route.ts:EntityRoute',
    'src/types/entity-route.ts:ProductEntityRoute',
    'src/types/entity-route.ts:ProductCategoryEntityRoute',
    'src/types/entity-route.ts:CMSPageEntityRoute',
    'src/types/entity-route.ts:BlogPageEntityRoute',
    'src/types/entity-route.ts:UnknownEntityRoute',
    'src/types/entity-route.ts:EntityRouteResponse',
  ],
  'docs/content/docs/api-reference/cms.mdx': [
    'src/api/cms.ts:CMSFilters',
    'src/types/search.ts:CmsPage',
    'src/types/common.ts:Image',
    'src/types/common.ts:ProductAttribute',
  ],
  'docs/content/docs/api-reference/booking.mdx': [
    'src/api/booking.ts:EventFilters',
    'src/api/booking.ts:CreateBookingInput',
    'src/api/booking.ts:Event',
    'src/api/booking.ts:Booking',
  ],
  'docs/content/docs/api-reference/feedbacks.mdx': [
    'src/api/feedbacks.ts:FeedbackFilters',
    'src/api/feedbacks.ts:CreateFeedbackInput',
    'src/api/feedbacks.ts:Feedback',
  ],
  'docs/content/docs/api-reference/general.mdx': [
    'src/api/general.ts:GeneralInfo',
    'src/api/general.ts:ShopInfo',
    'src/api/general.ts:SettingsInfo',
    'src/api/general.ts:ScriptsInfo',
    'src/api/general.ts:CheckoutConfig',
    'src/api/general.ts:WalletConfig',
    'src/api/general.ts:TajrobeConfig',
    'src/api/general.ts:ShopFeatures',
    'src/api/general.ts:PremiumInfo',
    'src/api/general.ts:City',
    'src/api/general.ts:Region',
    'src/api/general.ts:GoogleInfo',
    'src/api/general.ts:GoogleAnalyticsCode',
    'src/api/general.ts:LogoInfo',
    'src/api/general.ts:SocialInfo',
    'src/api/general.ts:DomainInfo',
    'src/api/general.ts:EnamadInfo',
  ],
  'docs/content/docs/api-reference/wallet.mdx': [
    'src/api/wallet.ts:TransactionFilters',
    'src/api/wallet.ts:WalletTransactionsResponse',
    'src/api/wallet.ts:Wallet',
    'src/api/wallet.ts:WalletTransaction',
    'src/api/wallet.ts:WalletBalance',
    'src/api/wallet.ts:WalletTransactionReason',
  ],
  'docs/content/docs/api-reference/visits.mdx': [
    'src/api/visits.ts:VisitInput',
    'src/api/visits.ts:VisitResponse',
  ],
  'docs/content/docs/api-reference/images.mdx': [
    'src/api/images.ts:UploadImageResponse',
  ],
  'docs/content/docs/api-reference/client.mdx': [
    'src/core/config.ts:SazitoConfig',
    'src/core/config.ts:RetryConfig',
    'src/core/config.ts:CacheConfig',
  ],
  'docs/content/docs/api-reference/conventions.mdx': [
    'src/types/common.ts:RequestOptions',
    'src/types/common.ts:SazitoResponse',
    'src/types/common.ts:PaginatedResponse',
    'src/types/common.ts:CookieOptions',
  ],
};

const AUTO_START = '{/* AUTO_FIELDS_START */}';
const AUTO_END = '{/* AUTO_FIELDS_END */}';

const program = ts.createProgram(
  SOURCE_FILES.map((file) => path.join(repoRoot, file)),
  {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    allowJs: false,
    strict: false,
    skipLibCheck: true,
  }
);

const checker = program.getTypeChecker();

/** @type {Map<string, {kind: 'interface' | 'type', name: string, node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, sourceFile: ts.SourceFile, relPath: string}>} */
const typeIndex = new Map();

for (const sourceFile of program.getSourceFiles()) {
  const relPath = path.relative(repoRoot, sourceFile.fileName).replace(/\\/g, '/');
  if (!SOURCE_FILES.includes(relPath)) continue;

  for (const stmt of sourceFile.statements) {
    if (
      (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) &&
      stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const key = `${relPath}:${stmt.name.text}`;
      typeIndex.set(key, {
        kind: ts.isInterfaceDeclaration(stmt) ? 'interface' : 'type',
        name: stmt.name.text,
        node: stmt,
        sourceFile,
        relPath,
      });
    }
  }
}

function isTypeLiteralArray(node) {
  if (ts.isArrayTypeNode(node) && ts.isTypeLiteralNode(node.elementType)) return node.elementType;
  if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'Array' && node.typeArguments?.[0]) {
    const arg = node.typeArguments[0];
    if (ts.isTypeLiteralNode(arg)) return arg;
  }
  return null;
}

function addMemberRowsFromTypeLiteral(typeLiteral, prefix, rows, sourceFile) {
  for (const member of typeLiteral.members) {
    if (ts.isPropertySignature(member)) {
      const memberName = member.name ? member.name.getText(sourceFile).replace(/^['"]|['"]$/g, '') : '(unknown)';
      const field = `${prefix}${memberName}`;
      const typeText = member.type ? member.type.getText(sourceFile) : 'unknown';
      const required = member.questionToken ? 'Optional' : 'Required';
      rows.push({ field, typeText, required });

      if (member.type && ts.isTypeLiteralNode(member.type)) {
        addMemberRowsFromTypeLiteral(member.type, `${field}.`, rows, sourceFile);
      } else if (member.type) {
        const nestedArrayTypeLiteral = isTypeLiteralArray(member.type);
        if (nestedArrayTypeLiteral) {
          addMemberRowsFromTypeLiteral(nestedArrayTypeLiteral, `${field}[].`, rows, sourceFile);
        }
      }
    } else if (ts.isIndexSignatureDeclaration(member)) {
      const param = member.parameters[0];
      const paramName = param?.name?.getText(sourceFile) ?? 'key';
      const paramType = param?.type?.getText(sourceFile) ?? 'string';
      const typeText = member.type ? member.type.getText(sourceFile) : 'unknown';
      rows.push({
        field: `${prefix}[${paramName}: ${paramType}]`,
        typeText,
        required: 'N/A',
      });
    }
  }
}

function addRowsFromNode(typeNode, prefix, rows, sourceFile) {
  if (ts.isTypeLiteralNode(typeNode)) {
    addMemberRowsFromTypeLiteral(typeNode, prefix, rows, sourceFile);
  } else {
    const nestedArrayTypeLiteral = isTypeLiteralArray(typeNode);
    if (nestedArrayTypeLiteral) {
      addMemberRowsFromTypeLiteral(nestedArrayTypeLiteral, `${prefix}[].`, rows, sourceFile);
    }
  }
}

function resolveTypeReferenceKey(typeName, sourceFile) {
  const symbol = checker.getSymbolAtLocation(typeName);
  if (!symbol) return null;
  const declarations = symbol.getDeclarations() || [];
  const decl = declarations.find((d) => ts.isInterfaceDeclaration(d) || ts.isTypeAliasDeclaration(d));
  if (!decl) return null;
  const relPath = path.relative(repoRoot, decl.getSourceFile().fileName).replace(/\\/g, '/');
  const name = decl.name?.getText(decl.getSourceFile());
  if (!name) return null;
  const key = `${relPath}:${name}`;
  return typeIndex.has(key) ? key : null;
}

function collectInterfaceRows(typeKey, seen = new Set()) {
  if (seen.has(typeKey)) return [];
  seen.add(typeKey);

  const typeDef = typeIndex.get(typeKey);
  if (!typeDef || typeDef.kind !== 'interface') return [];
  const node = /** @type {ts.InterfaceDeclaration} */ (typeDef.node);
  const rows = [];

  if (node.heritageClauses) {
    for (const heritage of node.heritageClauses) {
      if (heritage.token !== ts.SyntaxKind.ExtendsKeyword) continue;
      for (const typeExpr of heritage.types) {
        const refKey = resolveTypeReferenceKey(typeExpr.expression, typeDef.sourceFile);
        if (refKey) {
          rows.push(...collectInterfaceRows(refKey, seen));
        }
      }
    }
  }

  for (const member of node.members) {
    if (ts.isPropertySignature(member)) {
      const memberName = member.name ? member.name.getText(typeDef.sourceFile).replace(/^['"]|['"]$/g, '') : '(unknown)';
      const field = memberName;
      const typeText = member.type ? member.type.getText(typeDef.sourceFile) : 'unknown';
      const required = member.questionToken ? 'Optional' : 'Required';
      rows.push({ field, typeText, required });

      if (member.type) {
        addRowsFromNode(member.type, `${field}.`, rows, typeDef.sourceFile);
      }
    } else if (ts.isIndexSignatureDeclaration(member)) {
      const param = member.parameters[0];
      const paramName = param?.name?.getText(typeDef.sourceFile) ?? 'key';
      const paramType = param?.type?.getText(typeDef.sourceFile) ?? 'string';
      const typeText = member.type ? member.type.getText(typeDef.sourceFile) : 'unknown';
      rows.push({
        field: `[${paramName}: ${paramType}]`,
        typeText,
        required: 'N/A',
      });
    }
  }

  return rows;
}

function collectTypeAliasRows(typeKey) {
  const typeDef = typeIndex.get(typeKey);
  if (!typeDef || typeDef.kind !== 'type') return [];
  const node = /** @type {ts.TypeAliasDeclaration} */ (typeDef.node);
  const rows = [];
  addRowsFromNode(node.type, '', rows, typeDef.sourceFile);
  return rows;
}

function escapeType(typeText) {
  return typeText.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function renderTypeSection(typeKey) {
  const typeDef = typeIndex.get(typeKey);
  if (!typeDef) {
    return [
      `#### ${typeKey.split(':')[1]}`,
      '',
      'Type definition not found in source index.',
      '',
    ].join('\n');
  }

  const header = `#### ${typeDef.name}`;
  const source = `Source: \`${typeDef.relPath}\``;
  const rows = typeDef.kind === 'interface' ? collectInterfaceRows(typeKey) : collectTypeAliasRows(typeKey);

  if (rows.length === 0) {
    const aliasText =
      typeDef.kind === 'type'
        ? /** @type {ts.TypeAliasDeclaration} */ (typeDef.node).type.getText(typeDef.sourceFile)
        : '(no fields)';
    return [
      header,
      '',
      source,
      '',
      `Type: \`${escapeType(aliasText)}\``,
      '',
    ].join('\n');
  }

  const uniqueRows = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.field}|${row.typeText}|${row.required}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueRows.push(row);
  }

  const tableLines = [
    '| Field | Type | Required |',
    '| --- | --- | --- |',
    ...uniqueRows.map((row) => `| \`${row.field}\` | \`${escapeType(row.typeText)}\` | ${row.required} |`),
  ];

  return [
    header,
    '',
    source,
    '',
    ...tableLines,
    '',
  ].join('\n');
}

function renderBlock(typeKeys) {
  const sections = typeKeys.map(renderTypeSection).join('\n');
  return [
    AUTO_START,
    '## Type Details',
    '',
    'The following tables are generated from SDK TypeScript types and include nested object fields.',
    '',
    sections.trim(),
    AUTO_END,
    '',
  ].join('\n');
}

function upsertBlock(filePath, block) {
  const absPath = path.join(repoRoot, filePath);
  const original = fs.readFileSync(absPath, 'utf8');
  const startIdx = original.indexOf(AUTO_START);
  const endIdx = original.indexOf(AUTO_END);
  let next;

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = original.slice(0, startIdx).trimEnd();
    const after = original.slice(endIdx + AUTO_END.length).trimStart();
    next = `${before}\n\n${block}${after ? `\n${after}` : '\n'}`;
  } else {
    next = `${original.trimEnd()}\n\n${block}`;
  }

  fs.writeFileSync(absPath, next);
}

let updatedCount = 0;
for (const [pagePath, typeKeys] of Object.entries(PAGE_TYPE_MAP)) {
  const missing = typeKeys.filter((key) => !typeIndex.has(key));
  if (missing.length > 0) {
    throw new Error(`Missing type keys for ${pagePath}:\n${missing.join('\n')}`);
  }
  upsertBlock(pagePath, renderBlock(typeKeys));
  updatedCount += 1;
}

console.log(`Updated ${updatedCount} API docs pages with nested field tables.`);
