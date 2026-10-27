import test from "node:test";
import assert from "node:assert/strict";
import { COUNTDOWN_TARGET_MS, getCountdownParts, isDisabledRoute } from "../src/lib/site-release.ts";

test("countdown targets April 1, 2027 midnight IST", () => {
  assert.equal(new Date(COUNTDOWN_TARGET_MS).toISOString(), "2027-03-31T18:30:00.000Z");
  assert.deepEqual(getCountdownParts(COUNTDOWN_TARGET_MS - 90_061_000), { days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.deepEqual(getCountdownParts(COUNTDOWN_TARGET_MS), { days: 0, hours: 0, minutes: 0, seconds: 0 });
  assert.deepEqual(getCountdownParts(COUNTDOWN_TARGET_MS + 1000), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test("launch restrictions block roots and descendants regardless of extension", () => {
  for (const root of ["dashboard", "auth", "schedule", "events", "accomodation", "accommodation", "tickets", "merch"]) {
    assert.equal(isDisabledRoute(`/${root}`), true);
    assert.equal(isDisabledRoute(`/${root}/`), true);
    assert.equal(isDisabledRoute(`/${root}/nested/action`), true);
    assert.equal(isDisabledRoute(`/${root}/nested.png`), true);
  }
});

test("public content and similarly named paths stay available", () => {
  for (const path of ["/", "/announcements", "/Savara_2027_brochure.pdf", "/media/sponsor-brochure-2027/page-01.jpg", "/events-other", "/dashboard-other"]) {
    assert.equal(isDisabledRoute(path), false);
  }
});
