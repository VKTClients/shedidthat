export function isSoldOutOceanCurl(serviceName?: string | null, hairOptionName?: string | null) {
  const service = serviceName?.trim().toLowerCase() || "";
  const option = hairOptionName?.trim().toLowerCase() || "";

  return /\bocean curls?\b/.test(service) && /\b(brownie|goldie|ariel)\b/.test(option || service);
}
