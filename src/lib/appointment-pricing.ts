import { AFTER_HOURS_SURCHARGE, BUY_OWN_HAIR_PRICE, CLUSTER_LASHES_PRICE, OWN_FIBRE_DISCOUNT, SHORT_HAIR_SURCHARGE } from "./constants";

export const PRICE_INCREASE_START = "2026-12-01";
export const PRICE_UPDATE_NOTICE = "Thank you for your continued love and support! From 1 December 2026, hairstyle prices will increase by 10% so we can continue delivering the quality products, care, and beautiful results you love. Your price is based on your appointment date and will update automatically when you choose a December date.";

export function hasUpdatedAppointmentPricing(dateKey?: string) {
  return Boolean(dateKey && dateKey >= PRICE_INCREASE_START);
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function appointmentHairstylePrice(basePrice: number, dateKey?: string) {
  return roundMoney(basePrice * (hasUpdatedAppointmentPricing(dateKey) ? 1.1 : 1));
}

export function appointmentPricing({ dateKey, servicePrice, optionPrice = 0, buyOwnHair = false, shortHair = false, clusterLashes = false, ownFibre = false, afterHours = false }: {
  dateKey?: string;
  servicePrice: number;
  optionPrice?: number;
  buyOwnHair?: boolean;
  shortHair?: boolean;
  clusterLashes?: boolean;
  ownFibre?: boolean;
  afterHours?: boolean;
}) {
  const originalHairstylePrice = buyOwnHair ? BUY_OWN_HAIR_PRICE : servicePrice + optionPrice;
  const hairstylePrice = appointmentHairstylePrice(originalHairstylePrice, dateKey);
  const increase = roundMoney(hairstylePrice - originalHairstylePrice);
  const totalPrice = roundMoney(Math.max(0, hairstylePrice
    + (shortHair ? SHORT_HAIR_SURCHARGE : 0)
    + (clusterLashes ? CLUSTER_LASHES_PRICE : 0)
    - (ownFibre ? OWN_FIBRE_DISCOUNT : 0)
    + (afterHours ? AFTER_HOURS_SURCHARGE : 0)));
  return { hairstylePrice, increase, totalPrice };
}
