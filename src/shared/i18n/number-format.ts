const formatters = new Map<string, Intl.NumberFormat>();

// Building an Intl.NumberFormat is costly, so one instance is reused per locale and options.
export function numberFormat(locale: string, options?: Intl.NumberFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
}
