const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
};

const { appointmentHairstylePrice, appointmentPricing } = require("../src/lib/appointment-pricing.ts");
const { studioDateKey } = require("../src/lib/studio-time.ts");
const { BOOKING_DEPOSIT } = require("../src/lib/constants.ts");
let checks = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };

// Use appointment dates: making a booking in November for December gets the new rate.
check(appointmentHairstylePrice(750), 750);
check(appointmentHairstylePrice(750, "2026-11-30"), 750);
check(appointmentHairstylePrice(750, "2026-12-01"), 825);
check(appointmentHairstylePrice(650, "2026-12-07"), 715);
check(appointmentHairstylePrice(700, "2026-12-01"), 770);
check(appointmentHairstylePrice(750.5, "2026-12-01"), 825.55);
check(appointmentHairstylePrice(750, "2027-01-01"), 825);
check(appointmentHairstylePrice(750, studioDateKey(new Date("2026-11-30T21:59:59Z"))), 750);
check(appointmentHairstylePrice(750, studioDateKey(new Date("2026-11-30T22:00:00Z"))), 825);

check(appointmentPricing({ dateKey: "2026-12-01", servicePrice: 750, optionPrice: 100 }), {
  hairstylePrice: 935, increase: 85, totalPrice: 935,
});
check(appointmentPricing({ dateKey: "2026-12-01", servicePrice: 750, buyOwnHair: true }), {
  hairstylePrice: 605, increase: 55, totalPrice: 605,
});
check(appointmentPricing({ dateKey: "2026-12-01", servicePrice: 750, shortHair: true, clusterLashes: true, ownFibre: true, afterHours: true }), {
  hairstylePrice: 825, increase: 75, totalPrice: 1175,
});
check(appointmentPricing({ dateKey: "2026-11-30", servicePrice: 750, shortHair: true, clusterLashes: true, ownFibre: true, afterHours: true }).totalPrice, 1100);
// Switching back to November removes the increase, including the buy-own-hair option.
check(appointmentPricing({ dateKey: "2026-11-30", servicePrice: 750, buyOwnHair: true }).totalPrice, 550);
check(BOOKING_DEPOSIT, 175);
console.log(`${checks} appointment pricing checks passed`);
