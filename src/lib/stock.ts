export function isBrownieSoldOut(serviceName?: string | null, hairOptionName?: string | null) {
  const service = serviceName?.trim().toLowerCase() || "";
  const option = hairOptionName?.trim().toLowerCase() || "";

  return option.includes("brownie") || service.includes("brownie") || service.includes("ruby curls");
}

