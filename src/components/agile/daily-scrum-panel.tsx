"use client";

import { useState, type FormEvent } from "react";
import { AlertTriangle, CalendarDays, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dailyScrumBlocker, getDailyScrumEntry, getDailyScrums, sprintDays, toCalendarDay } from "@/lib/demo/agile-selectors";
import { demoActions, useDemoHydrated } from "@/lib/demo/store";
import type { DailyScrumEntry, DemoState, Sprint, TeamMember } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PanelMessage } from "./backlog-panel";
import { agileSelectClass } from "./work-item-dialog";

// Takvim günü (YYYY-MM-DD) gösterimi; saat dilimi kaydırması olmasın diye UTC ile biçimlendirilir.
const dayLabel = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: "UTC" });
const formatDay = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

type Props = { state: DemoState; sprint: Sprint; onMessage: PanelMessage };

export function DailyScrumPanel({ state, sprint, onMessage }: Props) {
  const hydrated = useDemoHydrated();
  const days = sprintDays(sprint);
  const entries = getDailyScrums(state, sprint.id);

  // Varsayılan gün: (tarayıcıda) bugün sprint aralığındaysa bugün; değilse sprint dışı tarafa en yakın gün.
  // Tamamlanan sprintte son kayıt günü. Sunucu çiziminde sprintin ilk günü (hidrasyon uyumu).
  const defaultDay = (() => {
    if (sprint.status === "Tamamlandı") return entries.at(-1)?.date ?? sprint.endDate;
    if (!hydrated) return sprint.startDate;
    const today = toCalendarDay(new Date().toISOString());
    return today < sprint.startDate ? sprint.startDate : today > sprint.endDate ? sprint.endDate : today;
  })();
  const [selected, setSelected] = useState<string | null>(null);
  const day = selected && days.includes(selected) ? selected : defaultDay;
  const [editing, setEditing] = useState<string | null>(null);

  const dayEntries = getDailyScrums(state, sprint.id, day);
  const blockerCount = dayEntries.filter((e) => e.blockers).length;
  const readOnlyReason = dailyScrumBlocker(state, { sprintId: sprint.id, memberId: state.teamMembers[0]?.id ?? "", date: day });

  return (
    <Card data-panel="daily">
      <CardHeader>
        <CardTitle>Daily Scrum</CardTitle>
        <CardDescription>
          {formatDay(day)} · {dayEntries.length}/{state.teamMembers.length} kişi kayıt girdi
          {blockerCount > 0 && ` · ${blockerCount} engel`}
        </CardDescription>
        <CardAction>
          <label htmlFor="daily-gun" className="sr-only">Gün</label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <select id="daily-gun" className={cn(agileSelectClass, "h-8 w-48 bg-background pl-8 text-xs")} value={day}
              onChange={(e) => { setSelected(e.target.value); setEditing(null); }}>
              {days.map((d) => {
                const count = entries.filter((e) => e.date === d).length;
                return <option key={d} value={d}>{formatDay(d)}{count ? ` (${count} kayıt)` : ""}</option>;
              })}
            </select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {readOnlyReason && <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground" data-daily-readonly>{readOnlyReason}</p>}
        <ul className="grid gap-3 lg:grid-cols-2">
          {state.teamMembers.map((member) => {
            const entry = getDailyScrumEntry(state, sprint.id, member.id, day);
            const blocker = dailyScrumBlocker(state, { sprintId: sprint.id, memberId: member.id, date: day });
            return (
              <li key={member.id} data-member-id={member.id} className="flex flex-col gap-2 rounded-lg border p-3">
                {editing === member.id && !blocker ? (
                  <DailyForm member={member} entry={entry} sprintId={sprint.id} day={day}
                    onCancel={() => setEditing(null)}
                    onSaved={(updated) => { setEditing(null); onMessage("ok", `${member.name} için ${formatDay(day)} kaydı ${updated ? "güncellendi" : "eklendi"}.`); }}
                    onError={(text) => onMessage("error", text)} />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      {!blocker && (
                        <Button size="xs" variant="ghost" onClick={() => setEditing(member.id)} aria-label={`${member.name} kaydını ${entry ? "düzenle" : "ekle"}`}>
                          {entry ? <Pencil data-icon="inline-start" aria-hidden="true" /> : <Plus data-icon="inline-start" aria-hidden="true" />}
                          {entry ? "Düzenle" : "Kayıt ekle"}
                        </Button>
                      )}
                    </div>
                    {entry ? <EntryView entry={entry} /> : <p className="text-xs text-muted-foreground">Bu gün için kayıt yok.</p>}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function EntryView({ entry }: { entry: DailyScrumEntry }) {
  return (
    <dl className="flex flex-col gap-1.5 text-sm" data-entry-id={entry.id}>
      {entry.yesterday && <div><dt className="text-xs font-medium text-muted-foreground">Dün</dt><dd>{entry.yesterday}</dd></div>}
      {entry.today && <div><dt className="text-xs font-medium text-muted-foreground">Bugün</dt><dd>{entry.today}</dd></div>}
      {entry.blockers && (
        <div className="rounded-md bg-amber-500/10 px-2 py-1.5 text-amber-900 dark:text-amber-200">
          <dt className="flex items-center gap-1 text-xs font-medium"><AlertTriangle className="size-3.5" aria-hidden="true" />Engel</dt>
          <dd>{entry.blockers}</dd>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">Son güncelleme {formatDateTime(entry.updatedAt)}</p>
    </dl>
  );
}

function DailyForm({ member, entry, sprintId, day, onCancel, onSaved, onError }: {
  member: TeamMember; entry?: DailyScrumEntry; sprintId: string; day: string;
  onCancel: () => void; onSaved: (updated: boolean) => void; onError: (text: string) => void;
}) {
  const [yesterday, setYesterday] = useState(entry?.yesterday ?? "");
  const [today, setToday] = useState(entry?.today ?? "");
  const [blockers, setBlockers] = useState(entry?.blockers ?? "");
  const [error, setError] = useState<string | null>(null);
  const prefix = `daily-${member.id}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!yesterday.trim() && !today.trim() && !blockers.trim()) {
      setError("En az bir alanı doldurun.");
      document.getElementById(`${prefix}-dun`)?.focus();
      return;
    }
    // Aynı sprint + kişi + tarih için kayıt varsa güncellenir (store/reducer kuralı).
    if (demoActions.upsertDailyScrum({ sprintId, memberId: member.id, date: day, yesterday, today, blockers })) onSaved(!!entry);
    else onError(`${member.name} için kayıt kaydedilemedi.`);
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2" aria-label={`${member.name} Daily Scrum kaydı`}>
      <p className="text-sm font-medium">{member.name} <span className="text-xs font-normal text-muted-foreground">· {entry ? "kaydı güncelle" : "yeni kayıt"}</span></p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefix}-dun`} className="text-xs">Dün ne yaptım?</Label>
        <Textarea id={`${prefix}-dun`} rows={2} value={yesterday} onChange={(e) => { setYesterday(e.target.value); setError(null); }} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefix}-bugun`} className="text-xs">Bugün ne yapacağım?</Label>
        <Textarea id={`${prefix}-bugun`} rows={2} value={today} onChange={(e) => { setToday(e.target.value); setError(null); }} />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor={`${prefix}-engel`} className="text-xs">Engeller</Label>
        <Textarea id={`${prefix}-engel`} rows={2} value={blockers} onChange={(e) => { setBlockers(e.target.value); setError(null); }} placeholder="Yoksa boş bırakın" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>Vazgeç</Button>
        <Button type="submit" size="sm">{entry ? "Güncelle" : "Kaydet"}</Button>
      </div>
    </form>
  );
}
