const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, modules = {}, expose = "") {
  const source = fs.readFileSync(file, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code + expose, {
    exports,
    require: (id) => modules[id] ?? require(id),
    console, Date, URL,
  }, { filename: file });
  return exports;
}

function database() {
  const calls = [];
  const pending = {
    id: "old-request",
    status: "REQUESTED",
    start_time: "2026-11-09T05:00:00Z",
    end_time: "2026-11-09T07:00:00Z",
    hold_expires_at: "2026-01-01T00:00:00Z",
  };
  const db = {
    from(table) {
      const query = {
        then(resolve) {
          resolve({ data: table === "booking_requests" ? [pending] : [], error: null });
        },
      };
      for (const method of ["select", "in", "gte", "lt", "gt", "eq", "order", "update"]) {
        query[method] = (...args) => {
          calls.push({ table, method, args });
          return query;
        };
      }
      return query;
    },
  };
  return { db, calls, pending };
}

function bookingModules(db) {
  const constants = load("src/lib/constants.ts");
  const supabase = { supabaseAdmin: db };
  return {
    "@/lib/supabase/server": supabase,
    "@/lib/constants": constants,
    "@/lib/studio-time": load("src/lib/studio-time.ts", { "./constants": constants }),
    "@/lib/booking-calendar": load("src/lib/booking-calendar.ts", { "./constants": constants, "./supabase/server": supabase }),
  };
}

(async () => {
  const first = database();
  const availability = load("src/app/api/availability/route.ts", {
    ...bookingModules(first.db), "@/lib/utils": {},
  }, "\nexports.loadCalendarData = loadCalendarData;");
  const result = await availability.loadCalendarData("2026-11-08T22:00:00Z", "2026-11-09T22:00:00Z");
  assert.equal(result.pending[0].id, first.pending.id);
  assert(!first.calls.some((call) => call.method === "update" || call.args[0] === "hold_expires_at"));
  console.log("PASS: overdue pending requests continue to block public availability without database writes");

  const second = database();
  const admin = load("src/app/api/admin/bookings/route.ts", {
    ...bookingModules(second.db), "@/lib/admin-auth": { requireAdmin: async () => ({}) },
  });
  const response = await admin.GET({ url: "https://example.com/api/admin/bookings?view=calendar&month=2026-11-01" });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.bookings[0].status, "REQUESTED");
  assert(second.calls.some(({ table, method, args }) => table === "booking_requests" && method === "gte" && args[0] === "start_time" && args[1] === "2026-10-31T22:00:00.000Z"));
  assert(second.calls.some(({ table, method, args }) => table === "booking_requests" && method === "lt" && args[0] === "start_time" && args[1] === "2026-11-30T22:00:00.000Z"));
  assert(!second.calls.some((call) => call.method === "update"));
  console.log("PASS: the admin calendar uses studio month boundaries and keeps existing pending bookings on closed dates");

  for (const file of ["src/app/api/bookings/route.ts", "src/app/api/upload-pop/route.ts", "src/app/api/admin/review/route.ts"]) {
    const source = fs.readFileSync(file, "utf8");
    assert(!source.includes("booking-expiry"));
    assert(!source.includes("hold_expires_at"));
  }
  console.log("PASS: new bookings, payment uploads and admin approvals do not use automatic expiry");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
