/** Remove credential-like annotations from a formerly bundled public resource. */
export function sanitizeLegacyResourceLabel(item) {
  if (!item || typeof item.name !== 'string' || typeof item.url !== 'string') return item;
  try {
    const host = new URL(item.url).hostname.replace(/^www\./, '');
    if (host === 'fenqubiao.com' && /用户名|密码|账号|username|password/i.test(item.name)) {
      return { ...item, name: '期刊分区表（请使用本人获授权的账号）' };
    }
  } catch { /* URL validation remains the responsibility of the link renderer. */ }
  return item;
}
