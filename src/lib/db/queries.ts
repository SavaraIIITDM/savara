import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  activationCodes,
  eventCheckins,
  events,
  perkCheckins,
  perks,
  profiles,
  roles,
  teamMembers,
  teams,
  tickets,
  users,
} from "@/lib/db/schema";
import { inferParticipantType, normalizeEmail, randomToken } from "@/lib/auth/utils";

export async function getRoleRow(email: string) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);
  const rows = await db
    .select({
      isAdmin: roles.isAdmin,
      isVolunteer: roles.isVolunteer,
      isEventVolunteer: roles.isEventVolunteer,
      isPerkVolunteer: roles.isPerkVolunteer,
    })
    .from(roles)
    .where(eq(roles.email, normalizedEmail))
    .limit(1);
  return rows[0] ?? null;
}

export async function getProfileByUserId(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      hasChangedCertificateName: profiles.hasChangedCertificateName,
      participantType: profiles.participantType,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function updateCertificateNameOnce(userId: string, nextName: string) {
  const db = getDb();
  const sanitizedName = nextName.trim().replace(/\s+/g, " ");

  if (!sanitizedName) {
    throw new Error("Name is required.");
  }

  const rows = await db
    .select({
      fullName: profiles.fullName,
      hasChangedCertificateName: profiles.hasChangedCertificateName,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  const profile = rows[0];

  if (!profile) {
    throw new Error("Profile not found.");
  }

  if (profile.hasChangedCertificateName) {
    throw new Error("You have already changed your certificate name once.");
  }

  const currentName = (profile.fullName ?? "").trim().replace(/\s+/g, " ");
  if (currentName && currentName === sanitizedName) {
    throw new Error("Please enter a different name.");
  }

  const updated = await db
    .update(profiles)
    .set({
      fullName: sanitizedName,
      hasChangedCertificateName: true,
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.id, userId), eq(profiles.hasChangedCertificateName, false)))
    .returning({ id: profiles.id });

  if (updated[0]) {
    return;
  }

  throw new Error("You have already changed your certificate name once.");
}

export async function getTicketByUserId(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: tickets.id,
      qrToken: tickets.qrToken,
      participantType: tickets.participantType,
      createdAt: tickets.createdAt,
    })
    .from(tickets)
    .where(eq(tickets.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPendingActivationCodeForEmailDb(email: string) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const profileRows = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, normalizedEmail)).limit(1);
  const profile = profileRows[0];
  if (profile) {
    const ticketRows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.userId, profile.id)).limit(1);
    if (ticketRows[0]) {
      return null;
    }
  }

  const rows = await db
    .select({
      code: activationCodes.code,
      ticketQuota: activationCodes.ticketQuota,
      redeemedCount: activationCodes.redeemedCount,
      purchaseType: activationCodes.purchaseType,
      verifiedAt: activationCodes.verifiedAt,
    })
    .from(activationCodes)
    .where(eq(activationCodes.purchaserEmail, normalizedEmail))
    .orderBy(desc(activationCodes.verifiedAt))
    .limit(1);

  const data = rows[0];
  if (!data) {
    return null;
  }

  const remaining = Math.max(data.ticketQuota - data.redeemedCount, 0);
  if (remaining === 0) {
    return null;
  }

  return {
    code: data.code,
    purchaseType: data.purchaseType,
    ticketQuota: data.ticketQuota,
    redeemedCount: data.redeemedCount,
    remaining,
    verifiedAt: data.verifiedAt,
  };
}

export async function listRecentActivationCodes(limit = 20) {
  const db = getDb();
  return db
    .select({
      code: activationCodes.code,
      purchaser_email: activationCodes.purchaserEmail,
      ticket_quota: activationCodes.ticketQuota,
      redeemed_count: activationCodes.redeemedCount,
      purchase_type: activationCodes.purchaseType,
      verified_at: activationCodes.verifiedAt,
    })
    .from(activationCodes)
    .orderBy(desc(activationCodes.verifiedAt))
    .limit(limit);
}

export async function listActiveEvents() {
  const db = getDb();
  return db
    .select({ id: events.id, name: events.name, team_min_size: events.teamMinSize, team_max_size: events.teamMaxSize })
    .from(events)
    .where(eq(events.isActive, true))
    .orderBy(asc(events.name));
}

export async function listActivePerks() {
  const db = getDb();
  return db
    .select({ id: perks.id, name: perks.name })
    .from(perks)
    .where(eq(perks.isActive, true))
    .orderBy(asc(perks.name));
}

export async function listTeamsByEvent(eventId: string) {
  const db = getDb();
  return db
    .select({ id: teams.id, event_id: teams.eventId, name: teams.name })
    .from(teams)
    .where(eq(teams.eventId, eventId))
    .orderBy(desc(teams.createdAt));
}

export async function getMyParticipations(userId: string) {
  const db = getDb();
  const result = await db.execute(sql`
    select
      e.id as event_id,
      e.name as event_name,
      e.slug as event_slug,
      ec.checked_in_at,
      tm.name as team_name
    from public.event_checkins ec
    join public.tickets t on t.id = ec.ticket_id
    join public.events e on e.id = ec.event_id
    left join public.teams tm on tm.id = ec.team_id
    where t.user_id = ${userId}
    order by ec.checked_in_at desc
  `);
  return result as unknown as Array<{
    event_id: string;
    event_name: string;
    event_slug: string;
    checked_in_at: string;
    team_name: string | null;
  }>;
}

export async function getMyPerkStatus(userId: string) {
  const db = getDb();
  const result = await db.execute(sql`
    with my_ticket as (
      select t.id as ticket_id, t.participant_type
      from public.tickets t
      where t.user_id = ${userId}
      limit 1
    )
    select
      p.id as perk_id,
      p.name as perk_name,
      exists (
        select 1 from public.perk_checkins pc
        join my_ticket mt on mt.ticket_id = pc.ticket_id
        where pc.perk_id = p.id
      ) as attended
    from public.perks p
    join my_ticket mt on mt.participant_type = 'internal'
    where p.is_active = true
    order by p.name asc
  `);
  return result as unknown as Array<{ perk_id: string; perk_name: string; attended: boolean }>;
}

export async function redeemActivationCode(userId: string, email: string, code: string) {
  const db = getDb();
  const activationCode = code.trim().toUpperCase();
  const participantType = inferParticipantType(email);

  return db.transaction(async (tx) => {
    const existingTicketRows = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.userId, userId)).limit(1);
    if (existingTicketRows[0]) {
      throw new Error("This account already has an activated ticket");
    }

    const codeRows = await tx
      .select({
        id: activationCodes.id,
        redeemedCount: activationCodes.redeemedCount,
        ticketQuota: activationCodes.ticketQuota,
        purchaseType: activationCodes.purchaseType,
        isActive: activationCodes.isActive,
      })
      .from(activationCodes)
      .where(eq(activationCodes.code, activationCode))
      .limit(1);

    const selectedCode = codeRows[0];
    if (!selectedCode || !selectedCode.isActive) {
      throw new Error("Invalid activation code");
    }

    if (selectedCode.redeemedCount >= selectedCode.ticketQuota) {
      throw new Error("Activation code limit reached");
    }

    if (selectedCode.purchaseType !== participantType) {
      throw new Error("Activation code type does not match your participant category");
    }

    await tx.insert(tickets).values({
      id: crypto.randomUUID(),
      userId,
      activationCodeId: selectedCode.id,
      participantType,
      qrToken: crypto.randomUUID(),
      createdAt: new Date(),
    });

    const nextRedeemedCount = selectedCode.redeemedCount + 1;
    await tx
      .update(activationCodes)
      .set({ redeemedCount: nextRedeemedCount, isActive: nextRedeemedCount < selectedCode.ticketQuota })
      .where(eq(activationCodes.id, selectedCode.id));
  });
}

export async function verifyPurchase(input: {
  purchaserEmail: string;
  ticketCount: number;
  purchaseType: "internal" | "external";
  actorUserId: string;
}) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(input.purchaserEmail);

  return db.transaction(async (tx) => {
    let code = randomToken(4).toUpperCase();
    let insertedId = crypto.randomUUID();

    for (;;) {
      try {
        await tx.insert(activationCodes).values({
          id: insertedId,
          code,
          purchaserEmail: normalizedEmail,
          ticketQuota: input.ticketCount,
          redeemedCount: 0,
          purchaseType: input.purchaseType,
          createdBy: input.actorUserId,
          verifiedAt: new Date(),
          isActive: true,
          createdAt: new Date(),
        });
        break;
      } catch {
        code = randomToken(4).toUpperCase();
        insertedId = crypto.randomUUID();
      }
    }

    const profileRows = await tx
      .select({ id: profiles.id, participantType: profiles.participantType })
      .from(profiles)
      .where(eq(profiles.email, normalizedEmail))
      .limit(1);

    const profile = profileRows[0];
    let ticketAssigned = false;

    if (profile && profile.participantType === input.purchaseType) {
      const existingTicket = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.userId, profile.id)).limit(1);
      if (!existingTicket[0]) {
        await tx.insert(tickets).values({
          id: crypto.randomUUID(),
          userId: profile.id,
          activationCodeId: insertedId,
          participantType: profile.participantType,
          qrToken: crypto.randomUUID(),
          createdAt: new Date(),
        });

        await tx
          .update(activationCodes)
          .set({ redeemedCount: 1, isActive: input.ticketCount > 1 })
          .where(eq(activationCodes.id, insertedId));
        ticketAssigned = true;
      }
    }

    return {
      code,
      activation_code_id: insertedId,
      ticket_assigned: ticketAssigned,
    };
  });
}

export async function checkInIndividual(input: { eventId: string; qrToken: string; teamId?: string | null; actorUserId: string }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const qr = input.qrToken.trim();
    const ticketRows = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, qr)).limit(1);
    const ticket = ticketRows[0];
    if (!ticket) {
      throw new Error("Ticket not found for the scanned QR");
    }

    if (input.teamId) {
      const teamRows = await tx.select({ eventId: teams.eventId }).from(teams).where(eq(teams.id, input.teamId)).limit(1);
      if (!teamRows[0] || teamRows[0].eventId !== input.eventId) {
        throw new Error("Selected team does not belong to the event");
      }

      await tx
        .insert(teamMembers)
        .values({ teamId: input.teamId, ticketId: ticket.id, addedBy: input.actorUserId, createdAt: new Date() })
        .onConflictDoNothing();
    }

    const inserted = await tx
      .insert(eventCheckins)
      .values({
        eventId: input.eventId,
        ticketId: ticket.id,
        teamId: input.teamId ?? null,
        checkedInBy: input.actorUserId,
        checkedInAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({ id: eventCheckins.id });

    return inserted[0] ? "checked_in" : "already_registered";
  });
}

export async function removeEventCheckinByTicket(eventId: string, ticketId: string) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ teamId: eventCheckins.teamId })
      .from(eventCheckins)
      .where(and(eq(eventCheckins.eventId, eventId), eq(eventCheckins.ticketId, ticketId)))
      .limit(1);
    const teamId = rows[0]?.teamId ?? null;

    const removed = await tx
      .delete(eventCheckins)
      .where(and(eq(eventCheckins.eventId, eventId), eq(eventCheckins.ticketId, ticketId)))
      .returning({ id: eventCheckins.id });

    if (!removed[0]) {
      return false;
    }

    if (teamId) {
      await tx.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.ticketId, ticketId)));
      const remaining = await tx.select({ id: teamMembers.teamId }).from(teamMembers).where(eq(teamMembers.teamId, teamId)).limit(1);
      if (!remaining[0]) {
        await tx.delete(teams).where(eq(teams.id, teamId));
      }
    }

    return true;
  });
}

export async function removeEventCheckinByQr(eventId: string, qrToken: string) {
  const db = getDb();
  const ticketRows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, qrToken.trim())).limit(1);
  const ticket = ticketRows[0];
  if (!ticket) {
    return false;
  }
  return removeEventCheckinByTicket(eventId, ticket.id);
}

export async function createTeamWithMembers(input: {
  eventId: string;
  teamName: string;
  leaderQr: string;
  memberQrs: string[];
  actorUserId: string;
}) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const eventRows = await tx
      .select({ minSize: events.teamMinSize, maxSize: events.teamMaxSize })
      .from(events)
      .where(and(eq(events.id, input.eventId), eq(events.isActive, true)))
      .limit(1);
    const event = eventRows[0];
    if (!event) {
      throw new Error("Event not found or inactive");
    }

    const leaderRows = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, input.leaderQr.trim())).limit(1);
    const leader = leaderRows[0];
    if (!leader) {
      throw new Error("Leader ticket not found");
    }

    const teamId = crypto.randomUUID();
    await tx.insert(teams).values({
      id: teamId,
      eventId: input.eventId,
      name: input.teamName.trim(),
      leaderTicketId: leader.id,
      createdBy: input.actorUserId,
      createdAt: new Date(),
    });

    await tx
      .insert(teamMembers)
      .values({ teamId, ticketId: leader.id, addedBy: input.actorUserId, createdAt: new Date() })
      .onConflictDoNothing();

    await tx
      .insert(eventCheckins)
      .values({ eventId: input.eventId, ticketId: leader.id, teamId, checkedInBy: input.actorUserId, checkedInAt: new Date() })
      .onConflictDoNothing();

    for (const memberQr of input.memberQrs) {
      const memberRows = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, memberQr.trim())).limit(1);
      const member = memberRows[0];
      if (!member) {
        throw new Error(`Member ticket not found for QR: ${memberQr}`);
      }

      await tx
        .insert(teamMembers)
        .values({ teamId, ticketId: member.id, addedBy: input.actorUserId, createdAt: new Date() })
        .onConflictDoNothing();

      await tx
        .insert(eventCheckins)
        .values({ eventId: input.eventId, ticketId: member.id, teamId, checkedInBy: input.actorUserId, checkedInAt: new Date() })
        .onConflictDoNothing();
    }

    const countRows = await tx.select({ count: sql<number>`count(*)::int` }).from(teamMembers).where(eq(teamMembers.teamId, teamId));
    const memberCount = countRows[0]?.count ?? 0;

    if (memberCount < event.minSize) {
      throw new Error(`Team must have at least ${event.minSize} members`);
    }
    if (memberCount > event.maxSize) {
      throw new Error(`Team exceeds max size of ${event.maxSize}`);
    }

    return teamId;
  });
}

export async function joinTeamWithMembers(input: { teamId: string; memberQrs: string[]; actorUserId: string }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const teamRows = await tx
      .select({ eventId: teams.eventId, maxSize: events.teamMaxSize })
      .from(teams)
      .innerJoin(events, eq(events.id, teams.eventId))
      .where(eq(teams.id, input.teamId))
      .limit(1);
    const team = teamRows[0];
    if (!team) {
      throw new Error("Team not found");
    }

    const currentRows = await tx.select({ count: sql<number>`count(*)::int` }).from(teamMembers).where(eq(teamMembers.teamId, input.teamId));
    let currentCount = currentRows[0]?.count ?? 0;
    let added = 0;

    for (const rawQr of input.memberQrs) {
      const qr = rawQr.trim();
      const memberRows = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, qr)).limit(1);
      const member = memberRows[0];
      if (!member) {
        throw new Error(`Ticket not found for QR: ${rawQr}`);
      }

      const existingCheckin = await tx
        .select({ id: eventCheckins.id })
        .from(eventCheckins)
        .where(and(eq(eventCheckins.eventId, team.eventId), eq(eventCheckins.ticketId, member.id)))
        .limit(1);
      if (existingCheckin[0]) {
        throw new Error("Participant already registered for this event");
      }

      if (currentCount + 1 > team.maxSize) {
        throw new Error(`Team exceeds max size of ${team.maxSize}`);
      }

      await tx
        .insert(teamMembers)
        .values({ teamId: input.teamId, ticketId: member.id, addedBy: input.actorUserId, createdAt: new Date() })
        .onConflictDoNothing();

      await tx
        .insert(eventCheckins)
        .values({ eventId: team.eventId, ticketId: member.id, teamId: input.teamId, checkedInBy: input.actorUserId, checkedInAt: new Date() })
        .onConflictDoNothing();

      currentCount += 1;
      added += 1;
    }

    return added;
  });
}

export async function checkInPerkIndividual(input: { perkId: string; qrToken: string; actorUserId: string }) {
  const db = getDb();
  const qr = input.qrToken.trim();
  const ticketRows = await db
    .select({ id: tickets.id, participantType: tickets.participantType })
    .from(tickets)
    .where(eq(tickets.qrToken, qr))
    .limit(1);
  const ticket = ticketRows[0];
  if (!ticket) {
    throw new Error("Ticket not found for the scanned QR");
  }
  if (ticket.participantType !== "internal") {
    throw new Error("Perks are available only for internal participants");
  }

  const inserted = await db
    .insert(perkCheckins)
    .values({ perkId: input.perkId, ticketId: ticket.id, checkedInBy: input.actorUserId, checkedInAt: new Date() })
    .onConflictDoNothing()
    .returning({ id: perkCheckins.id });

  return inserted[0] ? "checked_in" : "already_attended";
}

export async function removePerkCheckin(input: { perkId: string; qrToken: string }) {
  const db = getDb();
  const ticketRows = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.qrToken, input.qrToken.trim())).limit(1);
  const ticket = ticketRows[0];
  if (!ticket) {
    return false;
  }

  const removed = await db
    .delete(perkCheckins)
    .where(and(eq(perkCheckins.perkId, input.perkId), eq(perkCheckins.ticketId, ticket.id)))
    .returning({ id: perkCheckins.id });

  return Boolean(removed[0]);
}

export async function resolveParticipantByQr(input: { eventId: string; qrToken: string }) {
  const db = getDb();
  const result = await db.execute(sql`
    select
      t.id as ticket_id,
      t.qr_token,
      p.full_name,
      p.email,
      t.participant_type,
      exists (
        select 1 from public.event_checkins ec
        where ec.event_id = ${input.eventId}
          and ec.ticket_id = t.id
      ) as already_registered
    from public.tickets t
    left join public.profiles p on p.id = t.user_id
    where t.qr_token = ${input.qrToken.trim()}
    limit 1
  `);
  return (result as unknown as Array<Record<string, unknown>>)[0] ?? null;
}

export async function resolveInternalParticipantByQrForPerk(input: { perkId: string; qrToken: string }) {
  const db = getDb();
  const result = await db.execute(sql`
    select
      t.id as ticket_id,
      t.qr_token,
      p.full_name,
      p.email,
      t.participant_type,
      exists (
        select 1 from public.perk_checkins pc
        where pc.perk_id = ${input.perkId}
          and pc.ticket_id = t.id
      ) as already_attended,
      (t.participant_type = 'internal') as is_eligible
    from public.tickets t
    left join public.profiles p on p.id = t.user_id
    where t.qr_token = ${input.qrToken.trim()}
    limit 1
  `);
  return (result as unknown as Array<Record<string, unknown>>)[0] ?? null;
}

export async function getEventParticipants(eventId: string) {
  const db = getDb();
  const result = await db.execute(sql`
    select
      t.id as ticket_id,
      ec.id as checkin_id,
      p.full_name,
      p.email,
      t.participant_type,
      ec.team_id,
      tm.name as team_name,
      ec.checked_in_at
    from public.event_checkins ec
    join public.tickets t on t.id = ec.ticket_id
    left join public.profiles p on p.id = t.user_id
    left join public.teams tm on tm.id = ec.team_id
    where ec.event_id = ${eventId}
    order by ec.checked_in_at desc
  `);
  return result as unknown as Array<{
    ticket_id: string;
    checkin_id: number;
    full_name: string | null;
    email: string;
    participant_type: string;
    team_id: string | null;
    team_name: string | null;
    checked_in_at: string;
  }>;
}

export async function getManagementHubStats() {
  const db = getDb();

  const [volunteers, activeCodes, eventsCount, checkinsCount, perksCount, teamsCount] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(roles)
      .where(sql`${roles.isVolunteer} = true or ${roles.isEventVolunteer} = true or ${roles.isPerkVolunteer} = true`),
    db.select({ count: sql<number>`count(*)::int` }).from(activationCodes).where(eq(activationCodes.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(events),
    db.select({ count: sql<number>`count(*)::int` }).from(eventCheckins),
    db.select({ count: sql<number>`count(*)::int` }).from(perks),
    db.select({ count: sql<number>`count(*)::int` }).from(teams),
  ]);

  return {
    volunteers: volunteers[0]?.count ?? 0,
    activeCodes: activeCodes[0]?.count ?? 0,
    events: eventsCount[0]?.count ?? 0,
    checkins: checkinsCount[0]?.count ?? 0,
    perks: perksCount[0]?.count ?? 0,
    teams: teamsCount[0]?.count ?? 0,
  };
}

export async function listVolunteers() {
  const db = getDb();
  return db
    .select({
      email: roles.email,
      isAdmin: roles.isAdmin,
      isVolunteer: roles.isVolunteer,
      isEventVolunteer: roles.isEventVolunteer,
      isPerkVolunteer: roles.isPerkVolunteer,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(roles)
    .where(sql`${roles.isVolunteer} = true or ${roles.isEventVolunteer} = true or ${roles.isPerkVolunteer} = true`)
    .orderBy(asc(roles.email));
}

export type AccessRoleType = "volunteer" | "event_volunteer" | "perk_volunteer";

export async function grantVolunteer(email: string, roleType: AccessRoleType) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const rolePatch =
    roleType === "volunteer"
      ? { isVolunteer: true, isEventVolunteer: false, isPerkVolunteer: false }
      : roleType === "event_volunteer"
        ? { isVolunteer: false, isEventVolunteer: true, isPerkVolunteer: false }
        : { isVolunteer: false, isEventVolunteer: false, isPerkVolunteer: true };

  await db
    .insert(roles)
    .values({
      email: normalizedEmail,
      isVolunteer: rolePatch.isVolunteer,
      isEventVolunteer: rolePatch.isEventVolunteer,
      isPerkVolunteer: rolePatch.isPerkVolunteer,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: roles.email,
      set: {
        isVolunteer: rolePatch.isVolunteer,
        isEventVolunteer: rolePatch.isEventVolunteer,
        isPerkVolunteer: rolePatch.isPerkVolunteer,
        updatedAt: new Date(),
      },
    });
}

export async function revokeVolunteer(email: string, roleType: AccessRoleType) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  return db.transaction(async (tx) => {
    const row = await tx
      .select({
        isAdmin: roles.isAdmin,
        isVolunteer: roles.isVolunteer,
        isEventVolunteer: roles.isEventVolunteer,
        isPerkVolunteer: roles.isPerkVolunteer,
      })
      .from(roles)
      .where(eq(roles.email, normalizedEmail))
      .limit(1);
    if (!row[0]) {
      return false;
    }

    const nextFlags = {
      isVolunteer: roleType === "volunteer" ? false : row[0].isVolunteer,
      isEventVolunteer: roleType === "event_volunteer" ? false : row[0].isEventVolunteer,
      isPerkVolunteer: roleType === "perk_volunteer" ? false : row[0].isPerkVolunteer,
    };

    if (row[0].isAdmin) {
      await tx
        .update(roles)
        .set({
          isVolunteer: nextFlags.isVolunteer,
          isEventVolunteer: nextFlags.isEventVolunteer,
          isPerkVolunteer: nextFlags.isPerkVolunteer,
          updatedAt: new Date(),
        })
        .where(eq(roles.email, normalizedEmail));
    } else {
      if (!nextFlags.isVolunteer && !nextFlags.isEventVolunteer && !nextFlags.isPerkVolunteer) {
        await tx.delete(roles).where(eq(roles.email, normalizedEmail));
      } else {
        await tx
          .update(roles)
          .set({
            isVolunteer: nextFlags.isVolunteer,
            isEventVolunteer: nextFlags.isEventVolunteer,
            isPerkVolunteer: nextFlags.isPerkVolunteer,
            updatedAt: new Date(),
          })
          .where(eq(roles.email, normalizedEmail));
      }
    }

    return true;
  });
}

export async function deleteTicketWithDependencies(ticketId: string) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const row = await tx
      .select({ id: tickets.id, activationCodeId: tickets.activationCodeId })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);
    const ticket = row[0];
    if (!ticket) {
      return false;
    }

    const leaderTeams = await tx.select({ id: teams.id }).from(teams).where(eq(teams.leaderTicketId, ticketId));
    for (const leaderTeam of leaderTeams) {
      await tx.delete(eventCheckins).where(eq(eventCheckins.teamId, leaderTeam.id));
      await tx.delete(teamMembers).where(eq(teamMembers.teamId, leaderTeam.id));
      await tx.delete(teams).where(eq(teams.id, leaderTeam.id));
    }

    await tx.delete(eventCheckins).where(eq(eventCheckins.ticketId, ticketId));
    await tx.delete(perkCheckins).where(eq(perkCheckins.ticketId, ticketId));
    await tx.delete(teamMembers).where(eq(teamMembers.ticketId, ticketId));
    await tx.delete(tickets).where(eq(tickets.id, ticketId));

    const usageRows = await tx
      .select({ used: sql<number>`count(*)::int`, quota: activationCodes.ticketQuota })
      .from(activationCodes)
      .leftJoin(tickets, eq(activationCodes.id, tickets.activationCodeId))
      .where(eq(activationCodes.id, ticket.activationCodeId))
      .groupBy(activationCodes.id, activationCodes.ticketQuota)
      .limit(1);

    const usage = usageRows[0];
    if (usage) {
      await tx
        .update(activationCodes)
        .set({
          redeemedCount: usage.used,
        })
        .where(eq(activationCodes.id, ticket.activationCodeId));
    }

    return true;
  });
}

export async function revokeCodeAndDeleteTickets(codeId: string) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const row = await tx
      .select({ id: activationCodes.id, code: activationCodes.code })
      .from(activationCodes)
      .where(eq(activationCodes.id, codeId))
      .limit(1);
    if (!row[0]) {
      throw new Error("Activation code not found.");
    }

    const linkedTickets = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.activationCodeId, codeId));
    for (const linkedTicket of linkedTickets) {
      const leaderTeams = await tx.select({ id: teams.id }).from(teams).where(eq(teams.leaderTicketId, linkedTicket.id));
      for (const leaderTeam of leaderTeams) {
        await tx.delete(eventCheckins).where(eq(eventCheckins.teamId, leaderTeam.id));
        await tx.delete(teamMembers).where(eq(teamMembers.teamId, leaderTeam.id));
        await tx.delete(teams).where(eq(teams.id, leaderTeam.id));
      }

      await tx.delete(eventCheckins).where(eq(eventCheckins.ticketId, linkedTicket.id));
      await tx.delete(perkCheckins).where(eq(perkCheckins.ticketId, linkedTicket.id));
      await tx.delete(teamMembers).where(eq(teamMembers.ticketId, linkedTicket.id));
      await tx.delete(tickets).where(eq(tickets.id, linkedTicket.id));
    }

    await tx.delete(activationCodes).where(eq(activationCodes.id, codeId));

    return {
      deletedTickets: linkedTickets.length,
      code: row[0].code,
    };
  });
}

export async function getActivationCodeDetails(codeRaw: string) {
  const db = getDb();
  const code = codeRaw.trim().toUpperCase();

  const rows = await db
    .select({
      id: activationCodes.id,
      code: activationCodes.code,
      purchaserEmail: activationCodes.purchaserEmail,
      ticketQuota: activationCodes.ticketQuota,
      redeemedCount: activationCodes.redeemedCount,
      purchaseType: activationCodes.purchaseType,
      isActive: activationCodes.isActive,
      createdAt: activationCodes.createdAt,
    })
    .from(activationCodes)
    .where(eq(activationCodes.code, code))
    .limit(1);

  const activationCodeRow = rows[0];
  if (!activationCodeRow) {
    return null;
  }

  const redeemedTickets = await db.execute(sql`
    select
      t.id,
      t.created_at,
      t.participant_type,
      coalesce(p.email, u.email) as email
    from public.tickets t
    left join public.profiles p on p.id = t.user_id
    left join public.users u on u.id = t.user_id
    where t.activation_code_id = ${activationCodeRow.id}
    order by t.created_at desc
  `);

  return {
    ...activationCodeRow,
    tickets: redeemedTickets as unknown as Array<{
      id: string;
      created_at: string;
      participant_type: string;
      email: string;
    }>,
  };
}

export async function getTicketAndCodesByEmail(emailRaw: string) {
  const db = getDb();
  const email = normalizeEmail(emailRaw);

  const profileRows = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      email: profiles.email,
      participantType: profiles.participantType,
    })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  const profile = profileRows[0] ?? null;

  const userRows = !profile
    ? await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email)).limit(1)
    : [];
  const userId = profile?.id ?? (userRows[0]?.id ?? null);

  const ticketRows = userId
    ? await db
        .select({
          id: tickets.id,
          createdAt: tickets.createdAt,
          activationCode: activationCodes.code,
        })
        .from(tickets)
        .innerJoin(activationCodes, eq(activationCodes.id, tickets.activationCodeId))
        .where(eq(tickets.userId, userId))
        .limit(1)
    : [];

  const codes = await db
    .select({
      id: activationCodes.id,
      code: activationCodes.code,
      purchaserEmail: activationCodes.purchaserEmail,
      ticketQuota: activationCodes.ticketQuota,
      redeemedCount: activationCodes.redeemedCount,
      purchaseType: activationCodes.purchaseType,
      isActive: activationCodes.isActive,
      createdAt: activationCodes.createdAt,
    })
    .from(activationCodes)
    .where(eq(activationCodes.purchaserEmail, email))
    .orderBy(desc(activationCodes.createdAt));

  const codeIds = codes.map((row) => row.id);
  const linkedTickets = codeIds.length
    ? await db.execute(sql`
        select
          t.id,
          t.activation_code_id,
          t.created_at,
          t.participant_type,
          coalesce(p.email, u.email) as email
        from public.tickets t
        left join public.profiles p on p.id = t.user_id
        left join public.users u on u.id = t.user_id
        where t.activation_code_id in (${sql.join(codeIds.map((id) => sql`${id}`), sql`, `)})
        order by t.created_at desc
      `)
    : [];

  const ticketsByCode = new Map<string, Array<{ id: string; created_at: string; participant_type: string; email: string }>>();
  for (const ticketRow of linkedTickets as unknown as Array<{
    id: string;
    activation_code_id: string;
    created_at: string;
    participant_type: string;
    email: string;
  }>) {
    const current = ticketsByCode.get(ticketRow.activation_code_id) ?? [];
    current.push({
      id: ticketRow.id,
      created_at: ticketRow.created_at,
      participant_type: ticketRow.participant_type,
      email: ticketRow.email,
    });
    ticketsByCode.set(ticketRow.activation_code_id, current);
  }

  return {
    user: profile
      ? {
          id: profile.id,
          fullName: profile.fullName,
          email: profile.email,
          participantType: profile.participantType,
        }
      : null,
    ticket: ticketRows[0]
      ? {
          id: ticketRows[0].id,
          activationCode: ticketRows[0].activationCode,
          createdAt: ticketRows[0].createdAt,
        }
      : null,
    codes: codes.map((row) => ({
      ...row,
      tickets: ticketsByCode.get(row.id) ?? [],
    })),
  };
}

export async function listEventsForManagement() {
  const db = getDb();
  return db
    .select({
      id: events.id,
      name: events.name,
      slug: events.slug,
      teamMinSize: events.teamMinSize,
      teamMaxSize: events.teamMaxSize,
      isActive: events.isActive,
      createdAt: events.createdAt,
    })
    .from(events)
    .orderBy(asc(events.name));
}

export async function createEvent(input: {
  name: string;
  slug: string;
  teamMinSize: number;
  teamMaxSize: number;
  isActive: boolean;
}) {
  const db = getDb();
  const [row] = await db
    .insert(events)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug: input.slug.trim(),
      teamMinSize: input.teamMinSize,
      teamMaxSize: input.teamMaxSize,
      isActive: input.isActive,
      createdAt: new Date(),
    })
    .returning({
      id: events.id,
      name: events.name,
      slug: events.slug,
      teamMinSize: events.teamMinSize,
      teamMaxSize: events.teamMaxSize,
      isActive: events.isActive,
      createdAt: events.createdAt,
    });

  return row;
}

export async function updateEvent(input: {
  id: string;
  name: string;
  slug: string;
  teamMinSize: number;
  teamMaxSize: number;
  isActive: boolean;
}) {
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({
      name: input.name.trim(),
      slug: input.slug.trim(),
      teamMinSize: input.teamMinSize,
      teamMaxSize: input.teamMaxSize,
      isActive: input.isActive,
    })
    .where(eq(events.id, input.id))
    .returning({ id: events.id });

  return Boolean(row);
}

export async function deleteEventIfNoCheckins(eventId: string) {
  const db = getDb();
  const exists = await db.select({ id: events.id }).from(events).where(eq(events.id, eventId)).limit(1);
  if (!exists[0]) {
    return { deleted: false, checkins: 0, notFound: true };
  }

  const checkins = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventCheckins)
    .where(eq(eventCheckins.eventId, eventId))
    .limit(1);

  const count = checkins[0]?.count ?? 0;
  if (count > 0) {
    return { deleted: false, checkins: count, notFound: false };
  }

  const removed = await db.delete(events).where(eq(events.id, eventId)).returning({ id: events.id });
  return { deleted: Boolean(removed[0]), checkins: 0, notFound: false };
}

export async function listCheckinAudit(input: { eventId: string; email?: string }) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(input.email ?? "");
  const hasEmailFilter = normalizedEmail.length > 0;

  const data = await db.execute(sql`
    select
      ec.id,
      ec.checked_in_at,
      ec.team_id,
      e.id as event_id,
      e.name as event_name,
      coalesce(p.email, u.email) as participant_email,
      vu.email as volunteer_email
    from public.event_checkins ec
    join public.events e on e.id = ec.event_id
    join public.tickets t on t.id = ec.ticket_id
    left join public.profiles p on p.id = t.user_id
    left join public.users u on u.id = t.user_id
    left join public.users vu on vu.id = ec.checked_in_by
    where ec.event_id = ${input.eventId}
      and (
        ${hasEmailFilter} = false
        or lower(coalesce(p.email, u.email)) like ${`%${normalizedEmail}%`}
      )
    order by ec.checked_in_at desc
  `);

  return data as unknown as Array<{
    id: number;
    checked_in_at: string;
    team_id: string | null;
    event_id: string;
    event_name: string;
    participant_email: string;
    volunteer_email: string | null;
  }>;
}

export async function getCheckinAuditStats(eventId: string) {
  const db = getDb();
  const rows = await db.execute(sql`
    select
      count(*)::int as total,
      count(*) filter (where team_id is not null)::int as team,
      count(*) filter (where team_id is null)::int as individual
    from public.event_checkins
    where event_id = ${eventId}
  `);

  const row = (rows as unknown as Array<{ total: number; team: number; individual: number }>)[0];
  return {
    total: row?.total ?? 0,
    team: row?.team ?? 0,
    individual: row?.individual ?? 0,
  };
}

export async function deleteCheckinAuditEntry(checkinId: number) {
  const db = getDb();
  const rows = await db
    .select({ eventId: eventCheckins.eventId, ticketId: eventCheckins.ticketId })
    .from(eventCheckins)
    .where(eq(eventCheckins.id, checkinId))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return false;
  }

  return removeEventCheckinByTicket(row.eventId, row.ticketId);
}

export async function listPerksForManagement() {
  const db = getDb();
  return db
    .select({
      id: perks.id,
      name: perks.name,
      isActive: perks.isActive,
      createdAt: perks.createdAt,
    })
    .from(perks)
    .orderBy(asc(perks.name));
}

export async function createPerk(input: { name: string; isActive: boolean }) {
  const db = getDb();
  const [row] = await db
    .insert(perks)
    .values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      isActive: input.isActive,
      createdAt: new Date(),
    })
    .returning({
      id: perks.id,
      name: perks.name,
      isActive: perks.isActive,
      createdAt: perks.createdAt,
    });

  return row;
}

export async function setPerkActive(perkId: string, isActive: boolean) {
  const db = getDb();
  const [row] = await db.update(perks).set({ isActive }).where(eq(perks.id, perkId)).returning({ id: perks.id });
  return Boolean(row);
}

export async function deletePerkIfNoCheckins(perkId: string) {
  const db = getDb();
  const exists = await db.select({ id: perks.id }).from(perks).where(eq(perks.id, perkId)).limit(1);
  if (!exists[0]) {
    return { deleted: false, checkins: 0, notFound: true };
  }

  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(perkCheckins)
    .where(eq(perkCheckins.perkId, perkId))
    .limit(1);
  const count = rows[0]?.count ?? 0;
  if (count > 0) {
    return { deleted: false, checkins: count, notFound: false };
  }

  const removed = await db.delete(perks).where(eq(perks.id, perkId)).returning({ id: perks.id });
  return { deleted: Boolean(removed[0]), checkins: 0, notFound: false };
}

export async function getPerkRedemptionSummary() {
  const db = getDb();
  const rows = await db.execute(sql`
    select
      p.id,
      p.name,
      count(pc.id)::int as redemptions
    from public.perks p
    left join public.perk_checkins pc on pc.perk_id = p.id
    group by p.id, p.name
    order by p.name asc
  `);

  return rows as unknown as Array<{ id: string; name: string; redemptions: number }>;
}

export async function listPerkAudit(input: { perkId?: string; email?: string }) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(input.email ?? "");
  const perkId = input.perkId?.trim();
  const hasPerk = Boolean(perkId);
  const hasEmail = normalizedEmail.length > 0;

  const rows = await db.execute(sql`
    select
      pc.id,
      pc.checked_in_at,
      p.id as perk_id,
      p.name as perk_name,
      coalesce(pp.email, pu.email) as participant_email,
      vu.email as volunteer_email
    from public.perk_checkins pc
    join public.perks p on p.id = pc.perk_id
    join public.tickets t on t.id = pc.ticket_id
    left join public.profiles pp on pp.id = t.user_id
    left join public.users pu on pu.id = t.user_id
    left join public.users vu on vu.id = pc.checked_in_by
    where 1=1
      ${hasPerk ? sql`and p.id = ${perkId!}` : sql``}
      ${hasEmail ? sql`and lower(coalesce(pp.email, pu.email)) like ${`%${normalizedEmail}%`}` : sql``}
    order by pc.checked_in_at desc
  `);

  return rows as unknown as Array<{
    id: number;
    checked_in_at: string;
    perk_id: string;
    perk_name: string;
    participant_email: string;
    volunteer_email: string | null;
  }>;
}

export async function deletePerkAuditEntry(checkinId: number) {
  const db = getDb();
  const removed = await db.delete(perkCheckins).where(eq(perkCheckins.id, checkinId)).returning({ id: perkCheckins.id });
  return Boolean(removed[0]);
}

export async function listTeamsForManagement(eventId: string) {
  const db = getDb();
  const rows = await db.execute(sql`
    select
      tm.id,
      tm.name,
      coalesce(lp.email, lu.email) as leader_email,
      count(m.ticket_id)::int as member_count
    from public.teams tm
    join public.tickets lt on lt.id = tm.leader_ticket_id
    left join public.profiles lp on lp.id = lt.user_id
    left join public.users lu on lu.id = lt.user_id
    left join public.team_members m on m.team_id = tm.id
    where tm.event_id = ${eventId}
    group by tm.id, tm.name, coalesce(lp.email, lu.email), tm.created_at
    order by tm.created_at desc
  `);

  return rows as unknown as Array<{ id: string; name: string; leader_email: string; member_count: number }>;
}

export async function listTeamMembersForManagement(teamId: string, eventId: string) {
  const db = getDb();
  const rows = await db.execute(sql`
    select
      t.id as ticket_id,
      t.participant_type,
      tm.created_at as joined_at,
      coalesce(p.email, u.email) as email
    from public.team_members tm
    join public.tickets t on t.id = tm.ticket_id
    left join public.profiles p on p.id = t.user_id
    left join public.users u on u.id = t.user_id
    join public.teams team on team.id = tm.team_id
    where tm.team_id = ${teamId}
      and team.event_id = ${eventId}
    order by tm.created_at asc
  `);

  return rows as unknown as Array<{
    ticket_id: string;
    participant_type: string;
    joined_at: string;
    email: string;
  }>;
}

export async function removeTeamMemberForManagement(input: { teamId: string; eventId: string; ticketId: string }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const teamRow = await tx.select({ id: teams.id }).from(teams).where(and(eq(teams.id, input.teamId), eq(teams.eventId, input.eventId))).limit(1);
    if (!teamRow[0]) {
      throw new Error("Team not found for selected event.");
    }

    await tx.delete(eventCheckins).where(and(eq(eventCheckins.eventId, input.eventId), eq(eventCheckins.teamId, input.teamId), eq(eventCheckins.ticketId, input.ticketId)));
    const removed = await tx
      .delete(teamMembers)
      .where(and(eq(teamMembers.teamId, input.teamId), eq(teamMembers.ticketId, input.ticketId)))
      .returning({ teamId: teamMembers.teamId });

    return Boolean(removed[0]);
  });
}

export async function deleteTeamIfNoCheckins(input: { teamId: string; eventId: string }) {
  const db = getDb();
  return db.transaction(async (tx) => {
    const teamRow = await tx.select({ id: teams.id }).from(teams).where(and(eq(teams.id, input.teamId), eq(teams.eventId, input.eventId))).limit(1);
    if (!teamRow[0]) {
      throw new Error("Team not found for selected event.");
    }

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(eventCheckins)
      .where(and(eq(eventCheckins.teamId, input.teamId), eq(eventCheckins.eventId, input.eventId)))
      .limit(1);
    const count = rows[0]?.count ?? 0;

    if (count > 0) {
      return { deleted: false, checkins: count };
    }

    await tx.delete(teamMembers).where(eq(teamMembers.teamId, input.teamId));
    await tx.delete(teams).where(eq(teams.id, input.teamId));
    return { deleted: true, checkins: 0 };
  });
}
