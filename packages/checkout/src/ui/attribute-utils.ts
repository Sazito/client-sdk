export type CheckoutAttributeValue = string | {
  value: string;
  extra?: string;
  fieldType?: string;
};

/** Display the label of an attribute without coercing rich values to [object Object]. */
export function formatAttributeValue(value: CheckoutAttributeValue): string {
  return typeof value === 'string' ? value : value.value;
}

export function formatAttribute(attribute: {
  name: string;
  value: CheckoutAttributeValue;
}): string {
  return `${attribute.name}: ${formatAttributeValue(attribute.value)}`;
}
