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
} from "@/lib/db/schema";
import { inferParticipantType, normalizeEmail, randomToken } from "@/lib/auth/utils";

export async function getRoleRow(email: string) {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);
  const rows = await db
    .select({ isAdmin: roles.isAdmin, isVolunteer: roles.isVolunteer })
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
