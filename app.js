"use strict";
/*
 * LOGBOOK — app code (edit THIS file).
 *
 * Load order in index.html: vendor.js -> storage.js -> app.js
 *   vendor.js  React + charts + icons library (minified, never edit)
 *   storage.js how data is saved in the browser
 *   sw.js      service worker: lets the app open with no internet (loaded separately)
 *   app.js     everything else: screens, logic, backup export/import
 */
const {
  React,
  ReactDOM,
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  BookOpenIcon,
  MoonIcon,
  Settings2Icon,
  FlameIcon,
  LoaderCircleIcon,
  XIcon,
  Trash2Icon,
  PlusIcon,
  NotebookPenIcon,
  BarChart3Icon,
  TargetIcon,
  RotateCcwIcon,
  Link2Icon,
  SearchIcon,
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SaveIcon,
  PencilIcon,
  FileTextIcon,
  DownloadIcon,
  UploadIcon,
  CheckIcon,
  CalendarIcon,
} = window.__vendor;
const { jsx, jsxs, Fragment } = window.__vendor.jsxRuntime;

const FIELD_COLORS = [
    "#2B4C7E",
    "#C69214",
    "#1E6E62",
    "#5B4B8A",
    "#A8472E",
    "#6B7A3A",
    "#8A4B6B",
    "#3E7CB1",
    "#B5533C",
    "#4B6B8A",
  ],
  DEFAULT_SUBJECTS = [
    {
      id: "physics",
      label: "Physics · BSc/MSc",
      color: "#2B4C7E",
    },
    {
      id: "cgl",
      label: "SSC CGL",
      color: "#C69214",
    },
    {
      id: "math",
      label: "Mathematics",
      color: "#1E6E62",
    },
    {
      id: "cs",
      label: "Computation",
      color: "#5B4B8A",
    },
    {
      id: "geo",
      label: "Geopolitics & IR",
      color: "#A8472E",
    },
    {
      id: "teaching",
      label: "Teaching",
      color: "#6B7A3A",
    },
  ],
  KEY_ENTRIES = "physics-logbook:entries",
  KEY_SUBJECTS = "physics-logbook:subjects",
  KEY_TARGETS = "physics-logbook:targets",
  KEY_REST_DAYS = "physics-logbook:restDays",
  KEY_BACKUP_META = "physics-logbook:backupMeta",
  KEY_SLEEP_STUDY = "physics-logbook:sleepStudy",
  KEY_STUDY_GOAL = "physics-logbook:studyGoal",
  KEY_SNAPSHOTS = "physics-logbook:snapshots", // automatic safety copies (not part of the export file)
  MAX_SNAPSHOTS = 5,
  COLOR_BG = "#F1F3EC",
  COLOR_INK = "#1F2A24",
  COLOR_GRID = "#CDD8C9",
  COLOR_CARD = "#FAFBF6",
  COLOR_BORDER = "#D9DFD1",
  COLOR_MUTED = "#5A6459",
  REMOVED_SUBJECT = {
    id: "__removed",
    label: "Removed field",
    color: "#93998F",
  };
function getSubject(e, t) {
  return t.find((r) => r.id === e) || REMOVED_SUBJECT;
}
function todayStr() {
  const e = new Date();
  return (e.setMinutes(e.getMinutes() - e.getTimezoneOffset()), e.toISOString().slice(0, 10));
}
function formatLongDate(e) {
  return new Date(e + "T00:00:00").toLocaleDateString(void 0, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function daysBetween(e, t) {
  const r = new Date(e + "T00:00:00"),
    n = new Date(t + "T00:00:00");
  return Math.round((r - n) / 864e5);
}
function computeDeadline(e, t) {
  if (e === "today") return todayStr();
  const r = new Date(todayStr() + "T00:00:00");
  if (e === "week") r.setDate(r.getDate() + 7);
  else if (e === "month") r.setMonth(r.getMonth() + 1);
  else if (e === "custom" && t) return t;
  return toDateStr(r);
}
function deadlineStatus(e) {
  const t = daysBetween(e, todayStr());
  return t === 0
    ? {
        text: "Due today",
        tone: "warn",
      }
    : t < 0
      ? {
          text: `Overdue by ${Math.abs(t)} day${Math.abs(t) === 1 ? "" : "s"}`,
          tone: "over",
        }
      : {
          text: `${t} day${t === 1 ? "" : "s"} left`,
          tone: t <= 3 ? "warn" : "ok",
        };
}
function computeStreakFromEntries(e, t = []) {
  const r = Array.from(new Set([...e.map((u) => u.date), ...t])).sort();
  if (r.length === 0)
    return {
      current: 0,
      longest: 0,
    };
  let n = 1,
    i = 1;
  for (let u = 1; u < r.length; u++)
    (daysBetween(r[u], r[u - 1]) === 1 ? (i += 1) : (i = 1), (n = Math.max(n, i)));
  const o = new Set(r);
  let a = 0,
    l = todayStr();
  if (!o.has(l)) {
    const u = new Date(l + "T00:00:00");
    (u.setDate(u.getDate() - 1), (l = toDateStr(u)));
  }
  for (; o.has(l);) {
    a += 1;
    const u = new Date(l + "T00:00:00");
    (u.setDate(u.getDate() - 1), (l = toDateStr(u)));
  }
  return (
    (n = Math.max(n, a)),
    {
      current: a,
      longest: n,
    }
  );
}
function startOfWeek(e) {
  const t = new Date(e),
    r = t.getDay(),
    n = (r === 0 ? -6 : 1) - r;
  return (t.setDate(t.getDate() + n), t.setHours(0, 0, 0, 0), t);
}
function buildPeriods(e) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const r = [];
  if (e === "weekly") {
    const n = startOfWeek(t);
    for (let i = 7; i >= 0; i--) {
      const o = new Date(n);
      o.setDate(o.getDate() - i * 7);
      const a = new Date(o);
      (a.setDate(a.getDate() + 6),
        r.push({
          label: o.toLocaleDateString(void 0, {
            month: "short",
            day: "numeric",
          }),
          start: o,
          end: a,
        }));
    }
  } else if (e === "monthly")
    for (let n = 5; n >= 0; n--) {
      const i = new Date(t.getFullYear(), t.getMonth() - n, 1),
        o = new Date(t.getFullYear(), t.getMonth() - n + 1, 0);
      r.push({
        label: i.toLocaleDateString(void 0, {
          month: "short",
          year: "2-digit",
        }),
        start: i,
        end: o,
      });
    }
  else
    for (let n = 3; n >= 0; n--) {
      const i = t.getFullYear() - n;
      r.push({
        label: String(i),
        start: new Date(i, 0, 1),
        end: new Date(i, 11, 31, 23, 59, 59),
      });
    }
  return r;
}
function isDateInPeriod(e, t) {
  const r = new Date(e + "T00:00:00");
  return r >= t.start && r <= t.end;
}
function makeUniqueId(e, t) {
  let r =
      e
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "field",
    n = r,
    i = 1;
  for (; t.includes(n);) ((n = `${r}-${i}`), (i += 1));
  return n;
}
function toDateStr(O) {
  return (
    O.getFullYear() +
    "-" +
    String(O.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(O.getDate()).padStart(2, "0")
  );
}
// Older versions saved "This week" / "This month" targets with an empty deadline ([]).
// Recompute those from the day the target was created.
function repairTargetDeadlines(list) {
  if (!Array.isArray(list)) return [];
  return list.map((target) => {
    if (typeof target.deadline === "string") return target;
    const due = new Date((target.createdAt || todayStr()) + "T00:00:00");
    if (target.deadlineKind === "month") due.setMonth(due.getMonth() + 1);
    else due.setDate(due.getDate() + 7);
    return { ...target, deadline: toDateStr(due) };
  });
}

// ---------- Data cleaning ----------
// Used when loading, importing and restoring. They NEVER drop an entry: odd values are
// repaired so one bad record can't crash the whole app.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function cleanEntries(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      ...item,
      id: typeof item.id === "string" && item.id ? item.id : `${Date.now()}-${index}`,
      date: typeof item.date === "string" && DATE_PATTERN.test(item.date) ? item.date : todayStr(),
      subjectId: typeof item.subjectId === "string" ? item.subjectId : "",
      notes: typeof item.notes === "string" ? item.notes : String(item.notes ?? ""),
      link: typeof item.link === "string" ? item.link : "",
      starred: !!item.starred,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
    }));
}

function cleanSubjects(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === "object" && typeof item.id === "string" && item.id)
    .map((item) => ({
      ...item,
      label: typeof item.label === "string" ? item.label : item.id,
      color: typeof item.color === "string" ? item.color : "#5A6459",
    }));
}

function cleanTargets(list) {
  if (!Array.isArray(list)) return [];
  const objects = list.filter((item) => item && typeof item === "object");
  return repairTargetDeadlines(objects).map((item, index) => ({
    ...item,
    id: typeof item.id === "string" && item.id ? item.id : `target-${index}-${Date.now()}`,
    title: typeof item.title === "string" ? item.title : String(item.title ?? ""),
    status: item.status === "done" ? "done" : "active",
    createdAt: typeof item.createdAt === "string" ? item.createdAt : todayStr(),
  }));
}

function cleanSleepStudy(map) {
  if (!map || typeof map !== "object" || Array.isArray(map)) return {};
  const out = {};
  for (const [day, record] of Object.entries(map)) {
    if (!DATE_PATTERN.test(day) || !record || typeof record !== "object") continue;
    const item = {};
    if (typeof record.sleep === "number" && Number.isFinite(record.sleep))
      item.sleep = record.sleep;
    if (typeof record.study === "number" && Number.isFinite(record.study))
      item.study = record.study;
    out[day] = item;
  }
  return out;
}

function cleanRestDays(list) {
  return Array.isArray(list) ? list.filter((day) => typeof day === "string") : [];
}

// A saved link is only clickable if it is http(s). Stops "javascript:..." links
// (e.g. from a tampered backup file) from running code when clicked.
function safeUrl(url) {
  if (typeof url !== "string") return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return /^https?:/i.test(trimmed) ? trimmed : undefined;
  return "https://" + trimmed.replace(/^\/+/, ""); // "chat.example.com/x" -> https://...
}

function daysSinceDate(dateStr) {
  if (typeof dateStr !== "string" || !DATE_PATTERN.test(dateStr)) return null;
  return daysBetween(todayStr(), dateStr);
}

function LogbookApp() {
  const [loading, setLoading] = React.useState(!0),
    [entries, setEntries] = React.useState([]),
    [subjects, setSubjects] = React.useState(DEFAULT_SUBJECTS),
    [targets, setTargets] = React.useState([]),
    [restDays, setRestDays] = React.useState([]),
    [backupMeta, setBackupMeta] = React.useState({
      lastBackupAt: null,
    }),
    [filterSubject, setFilterSubject] = React.useState("all"),
    [starredOnly, setStarredOnly] = React.useState(!1),
    [searchText, setSearchText] = React.useState(""),
    [tab, setTab] = React.useState("journal"),
    [showFieldManager, setShowFieldManager] = React.useState(!1),
    [newFieldName, setNewFieldName] = React.useState(""),
    [saving, setSaving] = React.useState(!1),
    [errorMsg, setErrorMsg] = React.useState(""),
    [chartMode, setChartMode] = React.useState("category"),
    [chartPeriod, setChartPeriod] = React.useState("weekly"),
    [pdfRange, setPdfRange] = React.useState({
      start: "",
      end: "",
    }),
    [editingId, setEditingId] = React.useState(null),
    [editDraft, setEditDraft] = React.useState(null),
    [expandedMonths, setExpandedMonths] = React.useState(new Set()),
    [userToggledMonths, setUserToggledMonths] = React.useState(!1),
    [newEntry, setNewEntry] = React.useState({
      date: todayStr(),
      subjectId: "physics",
      notes: "",
      link: "",
    }),
    importInputRef = React.useRef(null),
    heatmapScrollRef = React.useRef(null),
    [newTarget, setNewTarget] = React.useState({
      title: "",
      subjectId: "",
      deadlineKind: "week",
      customDate: "",
    }),
    [sleepStudy, setSleepStudy] = React.useState({}),
    [sleepForm, setSleepForm] = React.useState({
      date: todayStr(),
      sleep: "",
      study: "",
    }),
    [sleepMessage, setSleepMessage] = React.useState(""),
    [graphMonth, setGraphMonth] = React.useState(todayStr().slice(0, 7)),
    [selectedDay, setSelectedDay] = React.useState(null),
    [studyGoal, setStudyGoal] = React.useState(2),
    [studyGoalInput, setStudyGoalInput] = React.useState("2");
  const [snapshots, setSnapshots] = React.useState([]); // automatic safety copies
  const [online, setOnline] = React.useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = React.useState(false);
  const [storageProtected, setStorageProtected] = React.useState(null); // true / false / null = unknown
  // Load everything saved in the browser when the app opens.
  React.useEffect(() => {
    async function readSaved(key) {
      try {
        const item = await window.storage.get(key, false);
        return item && item.value ? JSON.parse(item.value) : null;
      } catch {
        return null; // nothing saved under this key yet
      }
    }

    (async () => {
      const [
        savedEntries,
        savedSubjects,
        savedTargets,
        savedBackupMeta,
        savedRestDays,
        savedSleepStudy,
        savedStudyGoal,
        savedSnapshots,
      ] = await Promise.all([
        readSaved(KEY_ENTRIES),
        readSaved(KEY_SUBJECTS),
        readSaved(KEY_TARGETS),
        readSaved(KEY_BACKUP_META),
        readSaved(KEY_REST_DAYS),
        readSaved(KEY_SLEEP_STUDY),
        readSaved(KEY_STUDY_GOAL),
        readSaved(KEY_SNAPSHOTS),
      ]);

      const loaded = {
        entries: cleanEntries(savedEntries),
        subjects: cleanSubjects(savedSubjects),
        targets: cleanTargets(savedTargets),
        restDays: cleanRestDays(savedRestDays),
        sleepStudy: cleanSleepStudy(savedSleepStudy),
        studyGoal:
          typeof savedStudyGoal === "number" ? Math.min(24, Math.max(2, savedStudyGoal)) : 2,
      };
      const savedCopies = Array.isArray(savedSnapshots) ? savedSnapshots : [];

      setEntries(loaded.entries);
      if (loaded.subjects.length > 0) setSubjects(loaded.subjects);
      setTargets(loaded.targets);
      if (savedBackupMeta) setBackupMeta(savedBackupMeta);
      setRestDays(loaded.restDays);
      setSleepStudy(loaded.sleepStudy);
      setStudyGoal(loaded.studyGoal);
      setStudyGoalInput(String(loaded.studyGoal));
      setSnapshots(savedCopies);
      setLoading(false);

      // Automatic safety copy: at most one per ~day, and only if something changed.
      const latest = savedCopies[0];
      const ageMs = latest ? Date.now() - new Date(latest.at).getTime() : Infinity;
      if (ageMs > 20 * 60 * 60 * 1000) {
        writeSnapshot(
          savedCopies,
          { ...loaded, subjects: loaded.subjects.length ? loaded.subjects : subjects },
          "daily",
        );
      }
    })();
  }, []);

  // Online/offline indicator, "works offline" status, and ask the browser to keep our storage.
  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => setOfflineReady(true)).catch(() => {});
    }
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage
        .persist()
        .then(setStorageProtected)
        .catch(() => {});
    }
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ---------- Safety copies ----------
  // Everything the app stores, in one object (what a backup file contains).
  function currentData() {
    return { entries, subjects, targets, restDays, sleepStudy, studyGoal };
  }

  // Keep the last few copies. Skips empty data and copies identical to the newest one.
  async function writeSnapshot(previous, data, reason) {
    const hasData =
      data.entries.length > 0 ||
      data.targets.length > 0 ||
      data.restDays.length > 0 ||
      Object.keys(data.sleepStudy).length > 0;
    if (!hasData) return previous;
    if (previous[0] && JSON.stringify(previous[0].data) === JSON.stringify(data)) return previous;

    let list = [{ at: new Date().toISOString(), reason, data }, ...previous].slice(
      0,
      MAX_SNAPSHOTS,
    );
    while (list.length > 0) {
      try {
        await window.storage.set(KEY_SNAPSHOTS, JSON.stringify(list), false);
        setSnapshots(list);
        return list;
      } catch {
        list = list.slice(0, -1); // storage full: drop the oldest copy and try again
      }
    }
    setErrorMsg("Could not make a safety copy (browser storage is full). Export a backup now.");
    return previous;
  }

  function takeSnapshot(reason) {
    return writeSnapshot(snapshots, currentData(), reason);
  }

  async function restoreSnapshot(snapshot) {
    const when = new Date(snapshot.at).toLocaleString();
    if (
      !window.confirm(
        `Restore the safety copy from ${when}?\nYour current data is saved as a new safety copy first.`,
      )
    ) {
      return;
    }
    await takeSnapshot("before restore");
    const data = snapshot.data || {};
    const restoredSubjects = cleanSubjects(data.subjects);
    await saveEntries(cleanEntries(data.entries));
    if (restoredSubjects.length > 0) await saveSubjects(restoredSubjects);
    await saveTargets(cleanTargets(data.targets));
    const restoredRest = cleanRestDays(data.restDays);
    setRestDays(restoredRest);
    try {
      await window.storage.set(KEY_REST_DAYS, JSON.stringify(restoredRest), false);
    } catch {
      setErrorMsg("Could not save rest days — try again.");
    }
    await saveSleepStudy(cleanSleepStudy(data.sleepStudy));
    if (typeof data.studyGoal === "number") {
      const goal = Math.min(24, Math.max(2, data.studyGoal));
      await saveStudyGoal(goal);
      setStudyGoalInput(String(goal));
    }
    setErrorMsg("");
  }
  async function saveEntries(O) {
    setEntries(O);
    try {
      const j = await window.storage.set(KEY_ENTRIES, JSON.stringify(O), !1);
      setErrorMsg(j ? "" : "Could not save — try again.");
    } catch {
      setErrorMsg("Could not save — try again.");
    }
  }
  async function saveSubjects(O) {
    setSubjects(O);
    try {
      await window.storage.set(KEY_SUBJECTS, JSON.stringify(O), !1);
    } catch {
      setErrorMsg("Could not save fields — try again.");
    }
  }
  async function saveTargets(O) {
    setTargets(O);
    try {
      await window.storage.set(KEY_TARGETS, JSON.stringify(O), !1);
    } catch {
      setErrorMsg("Could not save targets — try again.");
    }
  }
  async function saveBackupMeta(O) {
    setBackupMeta(O);
    try {
      await window.storage.set(KEY_BACKUP_META, JSON.stringify(O), !1);
    } catch {
      setErrorMsg("Could not remember the backup date — your data is unaffected.");
    }
  }
  async function saveSleepStudy(O) {
    setSleepStudy(O);
    try {
      await window.storage.set(KEY_SLEEP_STUDY, JSON.stringify(O), !1);
    } catch {
      setErrorMsg("Could not save sleep/study hours — export a backup now.");
    }
  }
  async function saveStudyGoal(O) {
    setStudyGoal(O);
    try {
      await window.storage.set(KEY_STUDY_GOAL, JSON.stringify(O), !1);
    } catch {
      setErrorMsg("Could not save the streak goal — try again.");
    }
  }
  function computeStudyStreak(O, j, rd, tg) {
    const Yo = (d) => {
      const rl = (tg || []).filter((t) => t.deadlineKind === "today" && t.deadline === d);
      return rl.length === 0 || rl.every((t) => t.status === "done");
    };
    const Q = Array.from(
      new Set([
        ...Object.keys(O).filter((oe) => {
          const le = O[oe];
          return le && typeof le.study == "number" && le.study >= j && Yo(oe);
        }),
        ...(rd || []),
      ]),
    ).sort();
    let X = 0,
      oe = 1;
    if (Q.length > 0) {
      X = 1;
      for (let le = 1; le < Q.length; le++)
        (daysBetween(Q[le], Q[le - 1]) === 1 ? (oe += 1) : (oe = 1), (X = Math.max(X, oe)));
    }
    const ie = new Set(Q),
      Ke = Array.from(new Set([...Object.keys(O), ...(rd || [])])).sort(),
      Ge = Ke.length ? Ke[0] : null;
    let Ve = todayStr(),
      he;
    if (ie.has(Ve)) {
      he = 0;
      for (; ie.has(Ve);) {
        he += 1;
        const le = new Date(Ve + "T00:00:00");
        (le.setDate(le.getDate() - 1), (Ve = toDateStr(le)));
      }
      X = Math.max(X, he);
    } else {
      let ln = 0;
      for (; !ie.has(Ve) && Ge !== null && Ve >= Ge;) {
        ln += 1;
        const le = new Date(Ve + "T00:00:00");
        (le.setDate(le.getDate() - 1), (Ve = toDateStr(le)));
      }
      he = ln <= 1 ? 0 : -(ln - 1);
    }
    return {
      current: he,
      longest: X,
    };
  }
  function logSleepStudy() {
    const O = sleepForm.date;
    if (!O) {
      setSleepMessage("Pick a date first.");
      return;
    }
    const j = sleepForm.sleep === "" ? void 0 : parseHM(sleepForm.sleep),
      Q = sleepForm.study === "" ? void 0 : parseHM(sleepForm.study);
    if (j === void 0 && Q === void 0) {
      setSleepMessage("Enter sleep time, study time, or both.");
      return;
    }
    if (
      (j !== void 0 && (Number.isNaN(j) || j < 0 || j > 24)) ||
      (Q !== void 0 && (Number.isNaN(Q) || Q < 0 || Q > 24))
    ) {
      setSleepMessage("Time should be between 0:00 and 24:00.");
      return;
    }
    const X = sleepStudy[O] || {},
      oe = {
        ...sleepStudy,
        [O]: {
          sleep: j !== void 0 ? j : X.sleep,
          study: Q !== void 0 ? Q : X.study,
        },
      };
    (saveSleepStudy(oe),
      setSleepForm((le) => ({
        ...le,
        sleep: typeof oe[O].sleep == "number" ? formatHM(oe[O].sleep) : "",
        study: typeof oe[O].study == "number" ? formatHM(oe[O].study) : "",
      })),
      setSleepMessage("Saved for " + formatLongDate(O) + "."));
  }
  function parseHM(O) {
    if (!O) return void 0;
    const [j, Q] = O.split(":");
    if ((j === "" || j === void 0) && (Q === "" || Q === void 0)) return void 0;
    const X = Number(j || 0),
      oe = Number(Q || 0);
    return Number.isNaN(X) || Number.isNaN(oe) ? void 0 : X + oe / 60;
  }
  function splitHM(O) {
    if (!O)
      return {
        h: "",
        m: "",
      };
    const [j, Q] = O.split(":");
    return {
      h: j || "",
      m: Q || "",
    };
  }
  function formatHM(O) {
    if (typeof O != "number") return "";
    let j = Math.floor(O + 1e-9),
      Q = Math.round((O - j) * 60);
    return (Q >= 60 && ((j += 1), (Q = 0)), j + ":" + Q);
  }
  function formatHours(O) {
    let j = Math.floor(O + 1e-9),
      Q = Math.round((O - j) * 60);
    Q >= 60 && ((j += 1), (Q = 0));
    return Q === 0 ? j + "h" : j === 0 ? Q + "m" : j + "h" + Q + "m";
  }
  function changeGraphMonth(O) {
    const [j, Q] = graphMonth.split("-").map(Number),
      X = new Date(j, Q - 1 + O, 1),
      oe = X.getFullYear() + "-" + (X.getMonth() + 1 < 10 ? "0" : "") + (X.getMonth() + 1);
    (setGraphMonth(oe), setSelectedDay(null));
  }
  function monthLabel(O) {
    const [j, Q] = O.split("-").map(Number);
    return new Date(j, Q - 1, 1).toLocaleDateString(void 0, {
      month: "long",
      year: "numeric",
    });
  }
  function renderSleepStudyGraph(O, Mo) {
    const [yy, mm] = Mo.split("-").map(Number),
      dim = new Date(yy, mm, 0).getDate(),
      pad2 = (n) => (n < 10 ? "0" + n : "" + n),
      days = [];
    for (let d = 1; d <= dim; d++) days.push(Mo + "-" + pad2(d));
    const n = days.length,
      W = 350,
      H = 175,
      pl = 24,
      pr = 8,
      pt2 = 10,
      pb = 16,
      xp = (i) => (n <= 1 ? pl : pl + (i / (n - 1)) * (W - pl - pr));
    const vals = [];
    days.forEach((d) => {
      const r = O[d];
      (r && typeof r.sleep == "number" && vals.push(r.sleep),
        r && typeof r.study == "number" && vals.push(r.study));
    });
    const mx = Math.max(10, ...(vals.length ? vals : [10])),
      sp = Math.ceil(mx / 6) || 1,
      yp = (v) => pt2 + (H - pt2 - pb) * (1 - v / mx);
    function runsOf(f) {
      const rs = [];
      let cur = [];
      return (
        days.forEach((d, i) => {
          const r = O[d],
            v = r && typeof r[f] == "number" ? r[f] : void 0;
          v === void 0 ? (cur.length && rs.push(cur), (cur = [])) : cur.push([xp(i), yp(v), d]);
        }),
        cur.length && rs.push(cur),
        rs
      );
    }
    const sr = runsOf("sleep"),
      tr2 = runsOf("study"),
      poly = (ps) => ps.map((p) => p[0] + "," + p[1]).join(" "),
      ticks = [];
    for (let v = 0; v <= mx; v += sp) ticks.push(v);
    const le = Math.max(1, Math.ceil(n / 12)),
      selIdx = selectedDay ? days.indexOf(selectedDay) : -1,
      selRec = selectedDay ? O[selectedDay] : null,
      fadeOp = selectedDay ? 0.35 : 1,
      lineOp = selectedDay ? 0.3 : 1;
    return jsxs("svg", {
      viewBox: `0 0 ${W} ${H}`,
      width: "100%",
      style: {
        overflow: "visible",
        display: "block",
      },
      onClick: () => setSelectedDay(null),
      children: [
        ticks.map((v) =>
          jsxs(
            "g",
            {
              children: [
                jsx("line", {
                  x1: pl,
                  x2: W - pr,
                  y1: yp(v),
                  y2: yp(v),
                  stroke: COLOR_GRID,
                  strokeWidth: 0.75,
                }),
                jsx("text", {
                  x: pl - 5,
                  y: yp(v) + 3,
                  fontSize: 9,
                  fontFamily: "Space Mono",
                  fill: COLOR_MUTED,
                  textAnchor: "end",
                  children: v,
                }),
              ],
            },
            "yt" + v,
          ),
        ),
        selIdx >= 0 &&
          jsx("line", {
            x1: xp(selIdx),
            x2: xp(selIdx),
            y1: pt2,
            y2: H - pb,
            stroke: COLOR_INK,
            strokeWidth: 0.75,
            strokeDasharray: "2,2",
            opacity: 0.5,
          }),
        selRec &&
          typeof selRec.sleep == "number" &&
          jsx("line", {
            x1: pl,
            x2: xp(selIdx),
            y1: yp(selRec.sleep),
            y2: yp(selRec.sleep),
            stroke: "#5B4B8A",
            strokeWidth: 0.75,
            strokeDasharray: "2,2",
            opacity: 0.7,
          }),
        selRec &&
          typeof selRec.study == "number" &&
          jsx("line", {
            x1: pl,
            x2: xp(selIdx),
            y1: yp(selRec.study),
            y2: yp(selRec.study),
            stroke: "#A8472E",
            strokeWidth: 0.75,
            strokeDasharray: "2,2",
            opacity: 0.7,
          }),
        selRec &&
          typeof selRec.sleep == "number" &&
          jsx("text", {
            x: pl - 5,
            y: yp(selRec.sleep) + 3,
            fontSize: 9,
            fontFamily: "Space Mono",
            fill: "#5B4B8A",
            fontWeight: 700,
            textAnchor: "end",
            children: formatHours(selRec.sleep),
          }),
        selRec &&
          typeof selRec.study == "number" &&
          jsx("text", {
            x: pl - 5,
            y: yp(selRec.study) + 3,
            fontSize: 9,
            fontFamily: "Space Mono",
            fill: "#A8472E",
            fontWeight: 700,
            textAnchor: "end",
            children: formatHours(selRec.study),
          }),
        days.map(
          (d, i) =>
            (i % le === 0 || d === selectedDay) &&
            jsx(
              "text",
              {
                x: xp(i),
                y: H - 5,
                fontSize: 9,
                fontFamily: "Space Mono",
                fill: d === selectedDay ? COLOR_INK : COLOR_MUTED,
                fontWeight: d === selectedDay ? 700 : 400,
                textAnchor: "middle",
                children: String(i + 1),
              },
              "xt" + d,
            ),
        ),
        sr.map(
          (run, ri) =>
            run.length > 1 &&
            jsx(
              "polyline",
              {
                points: poly(run),
                fill: "none",
                stroke: "#5B4B8A",
                strokeWidth: 1.5,
                opacity: lineOp,
              },
              "sl" + ri,
            ),
        ),
        tr2.map(
          (run, ri) =>
            run.length > 1 &&
            jsx(
              "polyline",
              {
                points: poly(run),
                fill: "none",
                stroke: "#A8472E",
                strokeWidth: 1.5,
                opacity: lineOp,
              },
              "stp" + ri,
            ),
        ),
        sr.map((run, ri) =>
          run.map((p, pi) =>
            jsxs(
              "g",
              {
                onClick: ($e) => {
                  ($e.stopPropagation(), setSelectedDay((x) => (x === p[2] ? null : p[2])));
                },
                style: {
                  cursor: "pointer",
                },
                children: [
                  jsx("circle", {
                    cx: p[0],
                    cy: p[1],
                    r: 10,
                    fill: "transparent",
                  }),
                  p[2] === selectedDay &&
                    jsx("circle", {
                      cx: p[0],
                      cy: p[1],
                      r: 5,
                      fill: COLOR_BG,
                      stroke: "#5B4B8A",
                      strokeWidth: 1.5,
                    }),
                  jsx("circle", {
                    cx: p[0],
                    cy: p[1],
                    r: p[2] === selectedDay ? 3 : 2.5,
                    fill: "#5B4B8A",
                    opacity: p[2] === selectedDay || !selectedDay ? 1 : fadeOp,
                  }),
                ],
              },
              "slc" + ri + "_" + pi,
            ),
          ),
        ),
        tr2.map((run, ri) =>
          run.map((p, pi) =>
            jsxs(
              "g",
              {
                onClick: ($e) => {
                  ($e.stopPropagation(), setSelectedDay((x) => (x === p[2] ? null : p[2])));
                },
                style: {
                  cursor: "pointer",
                },
                children: [
                  jsx("circle", {
                    cx: p[0],
                    cy: p[1],
                    r: 10,
                    fill: "transparent",
                  }),
                  p[2] === selectedDay &&
                    jsx("circle", {
                      cx: p[0],
                      cy: p[1],
                      r: 5,
                      fill: COLOR_BG,
                      stroke: "#A8472E",
                      strokeWidth: 1.5,
                    }),
                  jsx("circle", {
                    cx: p[0],
                    cy: p[1],
                    r: p[2] === selectedDay ? 3 : 2.5,
                    fill: "#A8472E",
                    opacity: p[2] === selectedDay || !selectedDay ? 1 : fadeOp,
                  }),
                ],
              },
              "stc" + ri + "_" + pi,
            ),
          ),
        ),
      ],
    });
  }
  async function toggleRestDay(O) {
    const j = restDays.includes(O);
    if (!j) {
      const X = startOfWeek(new Date(O + "T00:00:00")),
        oe = new Date(X);
      if (
        (oe.setDate(oe.getDate() + 6),
        restDays.filter((Ae) => {
          const Qe = new Date(Ae + "T00:00:00");
          return Qe >= X && Qe <= oe;
        }).length >= 2)
      ) {
        setErrorMsg("Rest days are capped at 2 per week — you’ve already used both this week.");
        return;
      }
    }
    const Q = j ? restDays.filter((X) => X !== O) : [...restDays, O];
    setRestDays(Q);
    try {
      (await window.storage.set(KEY_REST_DAYS, JSON.stringify(Q), !1), setErrorMsg(""));
    } catch {
      setErrorMsg("Could not save rest day — try again.");
    }
  }
  function toggleMonth(O) {
    (setUserToggledMonths(!0),
      setExpandedMonths((j) => {
        const Q = new Set(j);
        return (Q.has(O) ? Q.delete(O) : Q.add(O), Q);
      }));
  }
  function isMonthOpen(O, j) {
    return userToggledMonths ? expandedMonths.has(O) : j || expandedMonths.has(O);
  }
  async function addTarget() {
    const O = newTarget.title.trim();
    if (!O) {
      setErrorMsg("Give the target a name first.");
      return;
    }
    const j = computeDeadline(newTarget.deadlineKind, newTarget.customDate),
      Q = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: O,
        subjectId: newTarget.subjectId || null,
        createdAt: todayStr(),
        deadline: j,
        deadlineKind: newTarget.deadlineKind,
        status: "active",
      };
    (await saveTargets([Q, ...targets]),
      setNewTarget({
        title: "",
        subjectId: "",
        deadlineKind: "week",
        customDate: "",
      }),
      setErrorMsg(""));
  }
  async function toggleTargetDone(O) {
    await saveTargets(
      targets.map((j) =>
        j.id === O
          ? {
              ...j,
              status: j.status === "done" ? "active" : "done",
            }
          : j,
      ),
    );
  }
  async function deleteTarget(id) {
    if (!window.confirm("Delete this target? (A safety copy is kept.)")) return;
    await takeSnapshot("before deleting a target");
    await saveTargets(targets.filter((target) => target.id !== id));
  }
  async function addEntry() {
    if (!newEntry.notes.trim()) {
      setErrorMsg("Write at least a line before saving.");
      return;
    }
    setSaving(!0);
    const O = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: newEntry.date,
      subjectId: newEntry.subjectId,
      notes: newEntry.notes.trim(),
      link: newEntry.link.trim(),
      starred: !1,
      createdAt: new Date().toISOString(),
    };
    (await saveEntries([O, ...entries]),
      setNewEntry({
        date: todayStr(),
        subjectId: newEntry.subjectId,
        notes: "",
        link: "",
      }),
      setSaving(!1));
  }
  async function deleteEntry(id) {
    if (!window.confirm("Delete this entry? (A safety copy is kept.)")) return;
    await takeSnapshot("before deleting an entry");
    await saveEntries(entries.filter((entry) => entry.id !== id));
  }
  function repeatLastNote() {
    const O = entries
      .filter((j) => j.subjectId === newEntry.subjectId)
      .sort((j, Q) => Q.createdAt.localeCompare(j.createdAt))[0];
    O &&
      setNewEntry((j) => ({
        ...j,
        notes: O.notes,
        link: O.link || "",
      }));
  }
  async function toggleStar(O) {
    await saveEntries(
      entries.map((j) =>
        j.id === O
          ? {
              ...j,
              starred: !j.starred,
            }
          : j,
      ),
    );
  }
  function startEdit(O) {
    (setEditingId(O.id),
      setEditDraft({
        ...O,
      }));
  }
  function cancelEdit() {
    (setEditingId(null), setEditDraft(null));
  }
  async function saveEdit() {
    if (!editDraft.notes.trim()) {
      setErrorMsg("Notes can’t be empty.");
      return;
    }
    (await saveEntries(
      entries.map((O) =>
        O.id === editingId
          ? {
              ...editDraft,
              notes: editDraft.notes.trim(),
              link: editDraft.link.trim(),
            }
          : O,
      ),
    ),
      setEditingId(null),
      setEditDraft(null),
      setErrorMsg(""));
  }
  async function clearAllEntries() {
    if (!window.confirm("Clear every entry? (A safety copy is kept.)")) return;
    await takeSnapshot("before clearing all entries");
    await saveEntries([]);
  }
  // Download ONE file containing everything the app has saved.
  function exportBackup() {
    const backup = {
      app: "logbook",
      version: 2,
      exportedAt: new Date().toISOString(),
      entries,
      subjects,
      targets,
      restDays,
      sleepStudy, // daily sleep + study hours (feeds the graph)
      studyGoal, // streak goal in hours/day
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `logbook-backup-${todayStr()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    saveBackupMeta({ lastBackupAt: todayStr() });
  }

  function exportPdf() {
    window.print();
  }
  function openImportPicker() {
    var O;
    (O = importInputRef.current) == null || O.click();
  }
  // Import a backup file.
  //   OK     = REPLACE what is in the app with the backup.
  //   Cancel = MERGE: keep what is here and add what is missing from the backup.
  // A field that is missing from an older backup file is left untouched in the app.
  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.entries) || !Array.isArray(backup.subjects)) {
        throw new Error("bad shape");
      }

      // Repair odd values so one bad record can't crash the app (nothing is dropped).
      const backupEntries = cleanEntries(backup.entries);
      const backupSubjects = cleanSubjects(backup.subjects);
      const backupTargets = cleanTargets(backup.targets);
      // null = "this backup file does not contain it"
      const backupRestDays = Array.isArray(backup.restDays) ? cleanRestDays(backup.restDays) : null;
      const backupSleepStudy =
        backup.sleepStudy &&
        typeof backup.sleepStudy === "object" &&
        !Array.isArray(backup.sleepStudy)
          ? cleanSleepStudy(backup.sleepStudy)
          : null;
      const backupGoal =
        typeof backup.studyGoal === "number" && !Number.isNaN(backup.studyGoal)
          ? Math.min(24, Math.max(2, backup.studyGoal))
          : null;

      const replace = window.confirm(
        "OK = REPLACE current data with this backup.\nCancel = MERGE the backup into current data.",
      );

      await takeSnapshot(replace ? "before import (replace)" : "before import (merge)");

      let newRestDays = restDays;
      let newSleepStudy = sleepStudy;
      let newGoal = studyGoal;

      if (replace) {
        await saveEntries(backupEntries);
        if (backupSubjects.length > 0) await saveSubjects(backupSubjects);
        await saveTargets(backupTargets);
        if (backupRestDays !== null) newRestDays = backupRestDays;
        if (backupSleepStudy !== null) newSleepStudy = backupSleepStudy;
        if (backupGoal !== null) newGoal = backupGoal;
      } else {
        // Add only the items whose id is not already in the app.
        const missing = (current, incoming) => {
          const ids = new Set(current.map((item) => item.id));
          return incoming.filter((item) => !ids.has(item.id));
        };
        await saveEntries([...entries, ...missing(entries, backupEntries)]);
        await saveSubjects([...subjects, ...missing(subjects, backupSubjects)]);
        await saveTargets([...targets, ...missing(targets, backupTargets)]);

        if (backupRestDays !== null) {
          newRestDays = Array.from(new Set([...restDays, ...backupRestDays])).sort();
        }
        if (backupSleepStudy !== null) {
          // For a day present in both, the value already in the app wins.
          newSleepStudy = { ...backupSleepStudy };
          for (const day of Object.keys(sleepStudy)) {
            const here = sleepStudy[day] || {};
            const there = backupSleepStudy[day] || {};
            const merged = {};
            const sleepHours = typeof here.sleep === "number" ? here.sleep : there.sleep;
            const studyHours = typeof here.study === "number" ? here.study : there.study;
            if (typeof sleepHours === "number") merged.sleep = sleepHours;
            if (typeof studyHours === "number") merged.study = studyHours;
            newSleepStudy[day] = merged;
          }
        }
      }

      if (newRestDays !== restDays) {
        setRestDays(newRestDays);
        try {
          await window.storage.set(KEY_REST_DAYS, JSON.stringify(newRestDays), false);
        } catch {
          setErrorMsg("Could not save rest days — try again.");
        }
      }
      if (newSleepStudy !== sleepStudy) await saveSleepStudy(newSleepStudy);
      if (newGoal !== studyGoal) {
        await saveStudyGoal(newGoal);
        setStudyGoalInput(String(newGoal));
      }

      await saveBackupMeta({ lastBackupAt: todayStr() });
      setErrorMsg("");

      // Tell the user exactly what came back.
      window.alert(
        `Backup ${replace ? "restored" : "merged"}:\n` +
          `• ${backupEntries.length} journal entries in file\n` +
          `• ${backupSubjects.length} fields\n` +
          `• ${backupTargets.length} targets\n` +
          (backupRestDays !== null
            ? `• ${backupRestDays.length} rest days\n`
            : "• rest days: not in this backup (kept as is)\n") +
          (backupSleepStudy !== null
            ? `• ${Object.keys(backupSleepStudy).length} sleep/study days\n`
            : "• sleep/study hours: not in this backup (kept as is)\n") +
          (backupGoal !== null
            ? `• streak goal ${backupGoal} hrs`
            : "• streak goal: not in this backup (kept as is)"),
      );
    } catch {
      setErrorMsg("That file doesn’t look like a logbook backup.");
    } finally {
      event.target.value = "";
    }
  }

  async function addField() {
    const O = newFieldName.trim();
    if (!O) return;
    const j = makeUniqueId(
        O,
        subjects.map((oe) => oe.id),
      ),
      Q = subjects.map((oe) => oe.color),
      X =
        FIELD_COLORS.find((oe) => !Q.includes(oe)) ||
        FIELD_COLORS[subjects.length % FIELD_COLORS.length];
    (await saveSubjects([
      ...subjects,
      {
        id: j,
        label: O,
        color: X,
      },
    ]),
      setNewFieldName(""));
  }
  async function updateField(O, j) {
    await saveSubjects(
      subjects.map((Q) =>
        Q.id === O
          ? {
              ...Q,
              ...j,
            }
          : Q,
      ),
    );
  }
  async function removeField(O) {
    const j = entries.filter((X) => X.subjectId === O).length,
      Q =
        j > 0
          ? `This field has ${j} entr${j === 1 ? "y" : "ies"}. They'll stay, just marked as "Removed field". Remove it anyway?`
          : "Remove this field?";
    if (window.confirm(Q)) {
      await takeSnapshot("before removing a field");
      const X = subjects.filter((oe) => oe.id !== O);
      (await saveSubjects(X),
        newEntry.subjectId === O &&
          X.length > 0 &&
          setNewEntry((oe) => ({
            ...oe,
            subjectId: X[0].id,
          })),
        filterSubject === O && setFilterSubject("all"));
    }
  }
  const { current: currentStreak, longest: longestStreak } = React.useMemo(
      () => computeStudyStreak(sleepStudy, studyGoal, restDays, targets),
      [sleepStudy, studyGoal, restDays, targets],
    ),
    countsBySubject = React.useMemo(() => {
      const O = {};
      return (
        subjects.forEach((j) => (O[j.id] = 0)),
        entries.forEach((j) => {
          O[j.subjectId] = (O[j.subjectId] || 0) + 1;
        }),
        O
      );
    }, [entries, subjects]),
    maxSubjectCount = Math.max(1, ...Object.values(countsBySubject)),
    filteredEntries = React.useMemo(() => {
      let O =
        filterSubject === "all" ? entries : entries.filter((j) => j.subjectId === filterSubject);
      if ((starredOnly && (O = O.filter((j) => j.starred)), searchText.trim())) {
        const j = searchText.trim().toLowerCase();
        O = O.filter((Q) => Q.notes.toLowerCase().includes(j));
      }
      return O;
    }, [entries, filterSubject, starredOnly, searchText]),
    entriesByDate = React.useMemo(() => {
      const O = new Map();
      return (
        filteredEntries
          .slice()
          .sort((j, Q) =>
            j.date < Q.date ? 1 : j.date > Q.date ? -1 : Q.createdAt.localeCompare(j.createdAt),
          )
          .forEach((j) => {
            (O.has(j.date) || O.set(j.date, []), O.get(j.date).push(j));
          }),
        filterSubject === "all" &&
          !starredOnly &&
          !searchText.trim() &&
          restDays.forEach((j) => {
            O.has(j) || O.set(j, []);
          }),
        Array.from(O.entries()).sort((j, Q) => (j[0] < Q[0] ? 1 : -1))
      );
    }, [filteredEntries, filterSubject, starredOnly, searchText, restDays]),
    monthGroups = React.useMemo(() => {
      const O = new Map();
      return (
        entriesByDate.forEach(([j, Q]) => {
          const X = j.slice(0, 7);
          O.has(X) ||
            O.set(X, {
              key: X,
              label: new Date(j + "T00:00:00").toLocaleDateString(void 0, {
                month: "long",
                year: "numeric",
              }),
              days: [],
              count: 0,
            });
          const oe = O.get(X);
          (oe.days.push([j, Q]), (oe.count += Q.length));
        }),
        Array.from(O.values())
      );
    }, [entriesByDate]),
    pdfEntries = React.useMemo(
      () =>
        !pdfRange.start && !pdfRange.end
          ? entries
          : entries.filter(
              (O) =>
                !(
                  (pdfRange.start && O.date < pdfRange.start) ||
                  (pdfRange.end && O.date > pdfRange.end)
                ),
            ),
      [entries, pdfRange],
    ),
    pdfCountsBySubject = React.useMemo(() => {
      const O = {};
      return (
        subjects.forEach((j) => (O[j.id] = 0)),
        pdfEntries.forEach((j) => {
          O[j.subjectId] = (O[j.subjectId] || 0) + 1;
        }),
        O
      );
    }, [pdfEntries, subjects]),
    pdfEntriesByDate = React.useMemo(() => {
      const O = new Map();
      return (
        pdfEntries
          .slice()
          .sort((j, Q) =>
            j.date < Q.date ? 1 : j.date > Q.date ? -1 : Q.createdAt.localeCompare(j.createdAt),
          )
          .forEach((j) => {
            (O.has(j.date) || O.set(j.date, []), O.get(j.date).push(j));
          }),
        Array.from(O.entries())
      );
    }, [pdfEntries]),
    chartData = React.useMemo(
      () =>
        buildPeriods(chartPeriod).map((j) => {
          const Q = {
            period: j.label,
          };
          let X = 0;
          return (
            subjects.forEach((oe) => {
              const Fe = entries.filter(
                (Ae) => Ae.subjectId === oe.id && isDateInPeriod(Ae.date, j),
              ).length;
              ((Q[oe.id] = Fe), (X += Fe));
            }),
            (Q.total = X),
            Q
          );
        }),
      [entries, subjects, chartPeriod],
    ),
    weekStats = React.useMemo(() => {
      const O = new Date();
      O.setHours(0, 0, 0, 0);
      const j = startOfWeek(O),
        Q = new Date(j);
      Q.setDate(Q.getDate() - 7);
      const X = new Date(j);
      X.setDate(X.getDate() - 1);
      const oe = entries.filter((Ae) => {
          const Qe = new Date(Ae.date + "T00:00:00");
          return Qe >= j && Qe <= O;
        }).length,
        Fe = entries.filter((Ae) => {
          const Qe = new Date(Ae.date + "T00:00:00");
          return Qe >= Q && Qe <= X;
        }).length;
      return {
        thisWeekCount: oe,
        lastWeekCount: Fe,
        delta: oe - Fe,
      };
    }, [entries]),
    heatmapWeeks = React.useMemo(() => {
      const O = {};
      entries.forEach((Fe) => {
        O[Fe.date] = (O[Fe.date] || 0) + 1;
      });
      const j = new Date();
      j.setHours(0, 0, 0, 0);
      const Q = startOfWeek(new Date(j));
      Q.setDate(Q.getDate() - 51 * 7);
      const X = [];
      let oe = new Date(Q);
      for (let Fe = 0; Fe < 53; Fe++) {
        const Ae = [];
        for (let Qe = 0; Qe < 7; Qe++) {
          const Uo = toDateStr(oe);
          (Ae.push({
            date: Uo,
            count: O[Uo] || 0,
            inFuture: oe > j,
          }),
            oe.setDate(oe.getDate() + 1));
        }
        X.push(Ae);
      }
      return X;
    }, [entries]);
  React.useEffect(() => {
    tab === "progress" &&
      heatmapScrollRef.current &&
      requestAnimationFrame(() => {
        heatmapScrollRef.current &&
          (heatmapScrollRef.current.scrollLeft = heatmapScrollRef.current.scrollWidth);
      });
  }, [tab, heatmapWeeks]);
  function heatmapColor(O) {
    return O === 0
      ? COLOR_BORDER
      : O === 1
        ? "#8FA88A"
        : O === 2
          ? "#5F8A5A"
          : O >= 3
            ? "#2F5F2A"
            : COLOR_BORDER;
  }
  const targetsView = React.useMemo(
    () =>
      targets
        .map((O) => {
          const j = O.subjectId
              ? entries.filter((X) => X.subjectId === O.subjectId && X.date >= O.createdAt)
              : entries.filter((X) => X.date >= O.createdAt),
            Q = new Set(j.map((X) => X.date)).size;
          return {
            ...O,
            daysLogged: Q,
          };
        })
        .sort((O, j) =>
          O.status !== j.status ? (O.status === "done" ? 1 : -1) : O.deadline < j.deadline ? -1 : 1,
        ),
    [targets, entries],
  );
  // ---------- Status strip, backup reminder, safety copies (shown in the UI) ----------
  const daysSinceBackup = daysSinceDate(backupMeta && backupMeta.lastBackupAt);
  const hasAnyData = entries.length > 0 || targets.length > 0 || Object.keys(sleepStudy).length > 0;
  const lastBackupText =
    daysSinceBackup === null
      ? "last backup: never"
      : daysSinceBackup <= 0
        ? "last backup: today"
        : `last backup: ${daysSinceBackup} day${daysSinceBackup === 1 ? "" : "s"} ago`;

  const statusStrip = jsxs("div", {
    className: "mono",
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "4px 12px",
      marginBottom: "16px",
      fontSize: "10px",
      color: COLOR_MUTED,
    },
    children: [
      jsx("span", {
        style: { color: online ? "#1E6E62" : "#C69214", fontWeight: 700 },
        children: online ? "● online" : "● offline — saving on this device",
      }),
      jsx("span", {
        children: offlineReady
          ? "works offline ✓"
          : "serviceWorker" in navigator
            ? "setting up offline mode…"
            : "offline mode not available here",
      }),
      storageProtected !== null &&
        jsx("span", {
          children: storageProtected
            ? "storage: protected ✓"
            : "storage: browser may clear it — keep backups",
        }),
      jsx("span", { children: lastBackupText }),
    ],
  });

  const backupReminder =
    !loading && hasAnyData && (daysSinceBackup === null || daysSinceBackup >= 3)
      ? jsxs("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px 12px",
            marginBottom: "16px",
            padding: "8px 12px",
            borderRadius: "2px",
            fontSize: "12px",
            color: COLOR_INK,
            backgroundColor: "#C6921415",
            border: "1px solid #C6921466",
          },
          children: [
            jsx("span", {
              children:
                daysSinceBackup === null
                  ? "You have no backup yet. Export one so your data survives if the browser clears it."
                  : `Your last backup was ${daysSinceBackup} days ago.`,
            }),
            jsx("button", {
              onClick: exportBackup,
              className: "mono",
              style: {
                fontSize: "11px",
                fontWeight: 700,
                color: "#2B4C7E",
                textDecoration: "underline",
              },
              children: "Export backup now",
            }),
          ],
        })
      : null;

  const snapshotsPanel = jsxs("div", {
    style: { marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${COLOR_BORDER}` },
    children: [
      jsx("p", {
        className: "mono",
        style: {
          fontSize: "10px",
          color: COLOR_MUTED,
          letterSpacing: "0.05em",
          marginBottom: "6px",
        },
        children: "SAFETY COPIES (automatic, kept on this device)",
      }),
      snapshots.length === 0
        ? jsx("p", {
            style: { fontSize: "12px", color: COLOR_MUTED, fontStyle: "italic" },
            children:
              "None yet — one is made automatically before any delete/import, and about once a day.",
          })
        : snapshots.map((snapshot) =>
            jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "2px 10px",
                  marginBottom: "6px",
                  fontSize: "11px",
                },
                children: [
                  jsx("span", {
                    className: "mono",
                    style: { color: COLOR_INK },
                    children: `${new Date(snapshot.at).toLocaleString()} · ${snapshot.reason}`,
                  }),
                  jsx("span", {
                    className: "mono",
                    style: { color: COLOR_MUTED },
                    children: `${(snapshot.data.entries || []).length} entries, ${Object.keys(snapshot.data.sleepStudy || {}).length} sleep/study days`,
                  }),
                  jsx("button", {
                    onClick: () => restoreSnapshot(snapshot),
                    className: "mono",
                    style: { color: "#2B4C7E", textDecoration: "underline" },
                    children: "restore",
                  }),
                ],
              },
              snapshot.at,
            ),
          ),
      jsx("p", {
        style: { fontSize: "10px", color: COLOR_MUTED, marginTop: "6px" },
        children:
          "Safety copies live in the same browser storage, so they do NOT protect you if you clear site data. Only an exported backup file does.",
      }),
    ],
  });

  return jsxs("div", {
    className: "min-h-screen w-full",
    style: {
      backgroundColor: COLOR_BG,
      backgroundImage: `linear-gradient(${COLOR_GRID} 1px, transparent 1px), linear-gradient(90deg, ${COLOR_GRID} 1px, transparent 1px)`,
      backgroundSize: "22px 22px",
      color: COLOR_INK,
      fontFamily: "'Source Serif 4', Georgia, serif",
    },
    children: [
      jsx("style", {
        children: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&display=swap');
        .mono { font-family: 'Space Mono', monospace; }
        ::selection { background: #2B4C7E33; }
        @media print {
          body { background: white !important; }
        }
      `,
      }),
      jsxs("div", {
        className: "max-w-2xl mx-auto px-4 pt-8 pb-16 print:hidden",
        children: [
          jsxs("header", {
            className: "flex items-start justify-between mb-5",
            children: [
              jsxs("div", {
                children: [
                  jsxs("div", {
                    className: "flex items-center gap-2 mb-1",
                    children: [
                      jsx(BookOpenIcon, {
                        size: 20,
                        strokeWidth: 2,
                        style: {
                          color: "#2B4C7E",
                        },
                      }),
                      jsx("h1", {
                        className: "mono text-2xl tracking-tight",
                        style: {
                          fontWeight: 700,
                        },
                        children: "LOGBOOK",
                      }),
                    ],
                  }),
                  jsx("p", {
                    className: "text-sm",
                    style: {
                      color: COLOR_MUTED,
                    },
                    children: "A year of physics, mathematics, computation & the world.",
                  }),
                ],
              }),
              jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  jsx("button", {
                    onClick: () => toggleRestDay(todayStr()),
                    className: "p-2 rounded-sm",
                    style: {
                      backgroundColor: restDays.includes(todayStr()) ? "#5B4B8A" : COLOR_CARD,
                      border: `1px solid ${restDays.includes(todayStr()) ? "#5B4B8A" : COLOR_BORDER}`,
                      color: restDays.includes(todayStr()) ? "#FAFBF6" : COLOR_MUTED,
                    },
                    title: restDays.includes(todayStr())
                      ? "Resting today — tap to unmark"
                      : "Mark today as a rest day",
                    children: jsx(MoonIcon, {
                      size: 16,
                      fill: restDays.includes(todayStr()) ? "#FAFBF6" : "none",
                    }),
                  }),
                  jsx("button", {
                    onClick: () => setShowFieldManager((O) => !O),
                    className: "p-2 rounded-sm",
                    style: {
                      backgroundColor: showFieldManager ? COLOR_INK : COLOR_CARD,
                      border: `1px solid ${COLOR_BORDER}`,
                      color: showFieldManager ? COLOR_BG : COLOR_MUTED,
                    },
                    title: "Manage fields",
                    children: jsx(Settings2Icon, {
                      size: 16,
                    }),
                  }),
                  jsxs("div", {
                    className: "flex items-center gap-1.5 px-3 py-2 rounded-sm mono text-sm",
                    style: {
                      backgroundColor: COLOR_CARD,
                      border: `1px solid ${COLOR_BORDER}`,
                    },
                    title: `Consecutive days with ${studyGoal}+ study hrs`,
                    children: [
                      jsx(FlameIcon, {
                        size: 16,
                        style: {
                          color: currentStreak >= 1 ? "#C69214" : "#A8472E",
                        },
                      }),
                      jsx("span", {
                        style: {
                          fontWeight: 700,
                          color: currentStreak >= 1 ? COLOR_INK : "#A8472E",
                        },
                        children: currentStreak,
                      }),
                      jsxs("span", {
                        style: {
                          color: COLOR_MUTED,
                        },
                        children: ["day", currentStreak === 1 ? "" : "s"],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          errorMsg &&
            jsx("div", {
              className: "flex items-center gap-2 rounded-sm px-3 py-2 mb-4 text-xs",
              style: {
                backgroundColor: "#A8472E15",
                border: "1px solid #A8472E40",
                color: "#A8472E",
              },
              children: errorMsg,
            }),
          statusStrip,
          backupReminder,
          loading
            ? jsxs("div", {
                className: "flex items-center gap-2 py-16 justify-center",
                style: {
                  color: COLOR_MUTED,
                },
                children: [
                  jsx(LoaderCircleIcon, {
                    size: 18,
                    className: "animate-spin",
                  }),
                  jsx("span", {
                    className: "mono text-sm",
                    children: "loading entries…",
                  }),
                ],
              })
            : jsxs(Fragment, {
                children: [
                  showFieldManager &&
                    jsxs("div", {
                      className: "rounded-sm p-4 mb-5",
                      style: {
                        backgroundColor: COLOR_CARD,
                        border: `1px solid ${COLOR_BORDER}`,
                      },
                      children: [
                        jsxs("div", {
                          className: "flex items-center justify-between mb-3",
                          children: [
                            jsx("p", {
                              className: "mono text-xs",
                              style: {
                                color: COLOR_MUTED,
                                letterSpacing: "0.05em",
                              },
                              children: "MANAGE FIELDS",
                            }),
                            jsx("button", {
                              onClick: () => setShowFieldManager(!1),
                              style: {
                                color: COLOR_MUTED,
                              },
                              children: jsx(XIcon, {
                                size: 15,
                              }),
                            }),
                          ],
                        }),
                        jsx("div", {
                          className: "space-y-2",
                          children: subjects.map((O) =>
                            jsxs(
                              "div",
                              {
                                className: "flex items-center gap-2",
                                children: [
                                  jsx("div", {
                                    className: "flex gap-1",
                                    children: FIELD_COLORS.map((j) =>
                                      jsx(
                                        "button",
                                        {
                                          onClick: () =>
                                            updateField(O.id, {
                                              color: j,
                                            }),
                                          className: "w-4 h-4 rounded-full shrink-0",
                                          style: {
                                            backgroundColor: j,
                                            outline:
                                              O.color === j ? `2px solid ${COLOR_INK}` : "none",
                                            outlineOffset: "1px",
                                          },
                                        },
                                        j,
                                      ),
                                    ),
                                  }),
                                  jsx("input", {
                                    value: O.label,
                                    onChange: (j) =>
                                      updateField(O.id, {
                                        label: j.target.value,
                                      }),
                                    className:
                                      "flex-1 min-w-0 text-sm px-2 py-1.5 rounded-sm outline-none",
                                    style: {
                                      backgroundColor: COLOR_BG,
                                      border: `1px solid ${COLOR_BORDER}`,
                                      color: COLOR_INK,
                                    },
                                  }),
                                  jsx("button", {
                                    onClick: () => removeField(O.id),
                                    style: {
                                      color: "#A8472E",
                                    },
                                    title: "Remove field",
                                    children: jsx(Trash2Icon, {
                                      size: 14,
                                    }),
                                  }),
                                ],
                              },
                              O.id,
                            ),
                          ),
                        }),
                        jsxs("div", {
                          className: "flex items-center gap-2 mt-3 pt-3",
                          style: {
                            borderTop: `1px solid ${COLOR_BORDER}`,
                          },
                          children: [
                            jsx("input", {
                              value: newFieldName,
                              onChange: (O) => setNewFieldName(O.target.value),
                              onKeyDown: (O) => O.key === "Enter" && addField(),
                              placeholder: "New field name…",
                              className:
                                "flex-1 min-w-0 text-sm px-2 py-1.5 rounded-sm outline-none",
                              style: {
                                backgroundColor: COLOR_BG,
                                border: `1px solid ${COLOR_BORDER}`,
                                color: COLOR_INK,
                              },
                            }),
                            jsxs("button", {
                              onClick: addField,
                              className:
                                "mono text-xs px-2.5 py-1.5 rounded-sm flex items-center gap-1",
                              style: {
                                backgroundColor: COLOR_INK,
                                color: COLOR_BG,
                                fontWeight: 700,
                              },
                              children: [
                                jsx(PlusIcon, {
                                  size: 13,
                                }),
                                " Add",
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  jsxs("div", {
                    className: "flex gap-1.5 mb-5",
                    children: [
                      jsxs("button", {
                        onClick: () => setTab("journal"),
                        className: "mono text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5",
                        style: {
                          border: `1px solid ${tab === "journal" ? COLOR_INK : COLOR_BORDER}`,
                          backgroundColor: tab === "journal" ? COLOR_INK : "transparent",
                          color: tab === "journal" ? COLOR_BG : COLOR_MUTED,
                        },
                        children: [
                          jsx(NotebookPenIcon, {
                            size: 13,
                          }),
                          " Journal",
                        ],
                      }),
                      jsxs("button", {
                        onClick: () => setTab("progress"),
                        className: "mono text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5",
                        style: {
                          border: `1px solid ${tab === "progress" ? COLOR_INK : COLOR_BORDER}`,
                          backgroundColor: tab === "progress" ? COLOR_INK : "transparent",
                          color: tab === "progress" ? COLOR_BG : COLOR_MUTED,
                        },
                        children: [
                          jsx(BarChart3Icon, {
                            size: 13,
                          }),
                          " Progress",
                        ],
                      }),
                      jsxs("button", {
                        onClick: () => setTab("targets"),
                        className: "mono text-xs px-3 py-1.5 rounded-sm flex items-center gap-1.5",
                        style: {
                          border: `1px solid ${tab === "targets" ? COLOR_INK : COLOR_BORDER}`,
                          backgroundColor: tab === "targets" ? COLOR_INK : "transparent",
                          color: tab === "targets" ? COLOR_BG : COLOR_MUTED,
                        },
                        children: [
                          jsx(TargetIcon, {
                            size: 13,
                          }),
                          " Targets",
                        ],
                      }),
                    ],
                  }),
                  tab === "journal"
                    ? jsxs(Fragment, {
                        children: [
                          jsxs("div", {
                            className: "rounded-sm p-4 mb-6",
                            style: {
                              backgroundColor: COLOR_CARD,
                              border: `1px solid ${COLOR_BORDER}`,
                            },
                            children: [
                              jsx("div", {
                                className: "flex flex-wrap gap-2 mb-3",
                                children: subjects.map((O) => {
                                  const j = newEntry.subjectId === O.id;
                                  return jsx(
                                    "button",
                                    {
                                      onClick: () =>
                                        setNewEntry((Q) => ({
                                          ...Q,
                                          subjectId: O.id,
                                        })),
                                      className: "mono text-xs px-2.5 py-1.5 rounded-sm transition",
                                      style: {
                                        border: `1px solid ${j ? O.color : COLOR_BORDER}`,
                                        backgroundColor: j ? O.color : "transparent",
                                        color: j ? "#FAFBF6" : COLOR_MUTED,
                                        fontWeight: j ? 700 : 400,
                                      },
                                      children: O.label,
                                    },
                                    O.id,
                                  );
                                }),
                              }),
                              entries.some((O) => O.subjectId === newEntry.subjectId) &&
                                jsxs("button", {
                                  onClick: repeatLastNote,
                                  className: "mono text-[10px] flex items-center gap-1 mb-1.5",
                                  style: {
                                    color: "#2B4C7E",
                                  },
                                  type: "button",
                                  children: [
                                    jsx(RotateCcwIcon, {
                                      size: 10,
                                    }),
                                    " repeat last note for this field",
                                  ],
                                }),
                              jsx("textarea", {
                                value: newEntry.notes,
                                onChange: (O) =>
                                  setNewEntry((j) => ({
                                    ...j,
                                    notes: O.target.value,
                                  })),
                                placeholder:
                                  "What did you study today? Key ideas, problems solved, questions still open…",
                                rows: 3,
                                className:
                                  "w-full text-sm p-2.5 rounded-sm resize-none outline-none",
                                style: {
                                  backgroundColor: COLOR_BG,
                                  border: `1px solid ${COLOR_BORDER}`,
                                  color: COLOR_INK,
                                  fontFamily: "'Source Serif 4', Georgia, serif",
                                },
                              }),
                              jsxs("div", {
                                className: "flex flex-wrap items-center gap-2 mt-2",
                                children: [
                                  jsxs("div", {
                                    className: "flex items-center gap-1.5 flex-1 min-w-[160px]",
                                    children: [
                                      jsx(Link2Icon, {
                                        size: 14,
                                        style: {
                                          color: COLOR_MUTED,
                                        },
                                      }),
                                      jsx("input", {
                                        value: newEntry.link,
                                        onChange: (O) =>
                                          setNewEntry((j) => ({
                                            ...j,
                                            link: O.target.value,
                                          })),
                                        placeholder: "Link to the chat/session (optional)",
                                        className: "w-full text-xs p-2 rounded-sm outline-none",
                                        style: {
                                          backgroundColor: COLOR_BG,
                                          border: `1px solid ${COLOR_BORDER}`,
                                          color: COLOR_INK,
                                        },
                                      }),
                                    ],
                                  }),
                                  jsx("input", {
                                    type: "date",
                                    value: newEntry.date,
                                    onChange: (O) =>
                                      setNewEntry((j) => ({
                                        ...j,
                                        date: O.target.value,
                                      })),
                                    className: "mono text-xs p-2 rounded-sm outline-none",
                                    style: {
                                      backgroundColor: COLOR_BG,
                                      border: `1px solid ${COLOR_BORDER}`,
                                      color: COLOR_INK,
                                    },
                                  }),
                                  jsxs("button", {
                                    onClick: addEntry,
                                    disabled: saving,
                                    className:
                                      "mono text-xs px-3 py-2 rounded-sm flex items-center gap-1",
                                    style: {
                                      backgroundColor: COLOR_INK,
                                      color: COLOR_BG,
                                      fontWeight: 700,
                                    },
                                    children: [
                                      saving
                                        ? jsx(LoaderCircleIcon, {
                                            size: 13,
                                            className: "animate-spin",
                                          })
                                        : jsx(PlusIcon, {
                                            size: 13,
                                          }),
                                      "Log it",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          jsxs("div", {
                            className: "flex items-center gap-2 mb-3",
                            children: [
                              jsxs("div", {
                                className: "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-sm",
                                style: {
                                  backgroundColor: COLOR_CARD,
                                  border: `1.5px solid ${searchText ? "#2B4C7E" : COLOR_BORDER}`,
                                },
                                children: [
                                  jsx(SearchIcon, {
                                    size: 15,
                                    style: {
                                      color: searchText ? "#2B4C7E" : COLOR_MUTED,
                                    },
                                  }),
                                  jsx("input", {
                                    value: searchText,
                                    onChange: (O) => setSearchText(O.target.value),
                                    placeholder: "Search your notes…",
                                    className: "flex-1 text-sm outline-none bg-transparent",
                                    style: {
                                      color: COLOR_INK,
                                    },
                                  }),
                                  searchText &&
                                    jsx("button", {
                                      onClick: () => setSearchText(""),
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: jsx(XIcon, {
                                        size: 14,
                                      }),
                                    }),
                                ],
                              }),
                              jsx("button", {
                                onClick: () => setStarredOnly((O) => !O),
                                className: "p-2.5 rounded-sm shrink-0",
                                style: {
                                  border: `1.5px solid ${starredOnly ? "#C69214" : COLOR_BORDER}`,
                                  backgroundColor: starredOnly ? "#C6921420" : COLOR_CARD,
                                  color: starredOnly ? "#C69214" : COLOR_MUTED,
                                },
                                title: "Show only starred entries",
                                children: jsx(StarIcon, {
                                  size: 15,
                                  fill: starredOnly ? "#C69214" : "none",
                                }),
                              }),
                            ],
                          }),
                          jsxs("div", {
                            className: "flex flex-wrap gap-1.5 mb-5",
                            children: [
                              jsxs("button", {
                                onClick: () => setFilterSubject("all"),
                                className: "mono text-xs px-2.5 py-1 rounded-sm",
                                style: {
                                  border: `1px solid ${filterSubject === "all" ? COLOR_INK : COLOR_BORDER}`,
                                  backgroundColor:
                                    filterSubject === "all" ? COLOR_INK : "transparent",
                                  color: filterSubject === "all" ? COLOR_BG : COLOR_MUTED,
                                },
                                children: ["All (", entries.length, ")"],
                              }),
                              subjects.map((O) =>
                                jsxs(
                                  "button",
                                  {
                                    onClick: () => setFilterSubject(O.id),
                                    className: "mono text-xs px-2.5 py-1 rounded-sm",
                                    style: {
                                      border: `1px solid ${filterSubject === O.id ? O.color : COLOR_BORDER}`,
                                      backgroundColor:
                                        filterSubject === O.id ? O.color : "transparent",
                                      color: filterSubject === O.id ? "#FAFBF6" : COLOR_MUTED,
                                    },
                                    children: [O.label, " (", countsBySubject[O.id] || 0, ")"],
                                  },
                                  O.id,
                                ),
                              ),
                            ],
                          }),
                          entriesByDate.length === 0
                            ? jsx("div", {
                                className: "text-center py-14 rounded-sm",
                                style: {
                                  border: `1px dashed ${COLOR_BORDER}`,
                                  color: COLOR_MUTED,
                                },
                                children: jsx("p", {
                                  className: "text-sm",
                                  children:
                                    entries.length === 0
                                      ? "Empty page. Log today’s session above to start the streak."
                                      : searchText || starredOnly
                                        ? "Nothing matches this search/filter."
                                        : "Nothing under this tab yet.",
                                }),
                              })
                            : jsx("div", {
                                className: "space-y-3",
                                children: monthGroups.map((O, j) => {
                                  const Q = isMonthOpen(O.key, j === 0);
                                  return jsxs(
                                    "div",
                                    {
                                      children: [
                                        jsxs("button", {
                                          onClick: () => toggleMonth(O.key),
                                          className:
                                            "w-full flex items-center justify-between mono text-xs px-3 py-2.5 rounded-sm",
                                          style: {
                                            backgroundColor: COLOR_CARD,
                                            border: `1px solid ${COLOR_BORDER}`,
                                            color: COLOR_INK,
                                          },
                                          children: [
                                            jsx("span", {
                                              style: {
                                                fontWeight: 700,
                                              },
                                              children: O.label,
                                            }),
                                            jsxs("span", {
                                              className: "flex items-center gap-2",
                                              style: {
                                                color: COLOR_MUTED,
                                              },
                                              children: [
                                                O.count,
                                                " ",
                                                O.count === 1 ? "entry" : "entries",
                                                Q
                                                  ? jsx(ChevronUpIcon, {
                                                      size: 14,
                                                    })
                                                  : jsx(ChevronDownIcon, {
                                                      size: 14,
                                                    }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        Q &&
                                          jsx("div", {
                                            className: "space-y-6 mt-3",
                                            children: O.days.map(([X, oe]) => {
                                              const Fe = restDays.includes(X);
                                              return jsxs(
                                                "div",
                                                {
                                                  children: [
                                                    jsxs("div", {
                                                      className: "flex items-center gap-2 mb-2",
                                                      children: [
                                                        jsx("span", {
                                                          className: "mono text-xs",
                                                          style: {
                                                            color: COLOR_MUTED,
                                                          },
                                                          children: formatLongDate(X),
                                                        }),
                                                        Fe &&
                                                          jsxs("button", {
                                                            onClick: () => toggleRestDay(X),
                                                            className:
                                                              "mono text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-sm",
                                                            style: {
                                                              backgroundColor: "#5B4B8A22",
                                                              color: "#5B4B8A",
                                                            },
                                                            title:
                                                              "Tap to unmark this as a rest day",
                                                            children: [
                                                              jsx(MoonIcon, {
                                                                size: 10,
                                                              }),
                                                              " rest day ✕",
                                                            ],
                                                          }),
                                                        jsx("div", {
                                                          className: "flex-1 h-px",
                                                          style: {
                                                            backgroundColor: COLOR_BORDER,
                                                          },
                                                        }),
                                                      ],
                                                    }),
                                                    oe.length === 0 && Fe
                                                      ? jsx("p", {
                                                          className: "text-xs italic",
                                                          style: {
                                                            color: COLOR_MUTED,
                                                          },
                                                          children:
                                                            "No study logged — deliberate rest.",
                                                        })
                                                      : jsx("div", {
                                                          className: "space-y-2",
                                                          children: oe.map((Ae) => {
                                                            const Qe = getSubject(
                                                              Ae.subjectId,
                                                              subjects,
                                                            );
                                                            return editingId === Ae.id
                                                              ? jsxs(
                                                                  "div",
                                                                  {
                                                                    className: "rounded-sm p-3",
                                                                    style: {
                                                                      backgroundColor: COLOR_CARD,
                                                                      border: `1px solid ${Qe.color}`,
                                                                      borderLeft: `3px solid ${Qe.color}`,
                                                                    },
                                                                    children: [
                                                                      jsx("div", {
                                                                        className:
                                                                          "flex flex-wrap gap-1.5 mb-2",
                                                                        children: subjects.map(
                                                                          (ht) =>
                                                                            jsx(
                                                                              "button",
                                                                              {
                                                                                onClick: () =>
                                                                                  setEditDraft(
                                                                                    (Nr) => ({
                                                                                      ...Nr,
                                                                                      subjectId:
                                                                                        ht.id,
                                                                                    }),
                                                                                  ),
                                                                                className:
                                                                                  "mono text-[10px] px-2 py-1 rounded-sm",
                                                                                style: {
                                                                                  border: `1px solid ${editDraft.subjectId === ht.id ? ht.color : COLOR_BORDER}`,
                                                                                  backgroundColor:
                                                                                    editDraft.subjectId ===
                                                                                    ht.id
                                                                                      ? ht.color
                                                                                      : "transparent",
                                                                                  color:
                                                                                    editDraft.subjectId ===
                                                                                    ht.id
                                                                                      ? "#FAFBF6"
                                                                                      : COLOR_MUTED,
                                                                                },
                                                                                children: ht.label,
                                                                              },
                                                                              ht.id,
                                                                            ),
                                                                        ),
                                                                      }),
                                                                      jsx("textarea", {
                                                                        value: editDraft.notes,
                                                                        onChange: (ht) =>
                                                                          setEditDraft((Nr) => ({
                                                                            ...Nr,
                                                                            notes: ht.target.value,
                                                                          })),
                                                                        rows: 3,
                                                                        className:
                                                                          "w-full text-sm p-2 rounded-sm resize-none outline-none mb-2",
                                                                        style: {
                                                                          backgroundColor: COLOR_BG,
                                                                          border: `1px solid ${COLOR_BORDER}`,
                                                                          color: COLOR_INK,
                                                                          fontFamily:
                                                                            "'Source Serif 4', Georgia, serif",
                                                                        },
                                                                      }),
                                                                      jsxs("div", {
                                                                        className:
                                                                          "flex flex-wrap items-center gap-2",
                                                                        children: [
                                                                          jsx("input", {
                                                                            value: editDraft.link,
                                                                            onChange: (ht) =>
                                                                              setEditDraft(
                                                                                (Nr) => ({
                                                                                  ...Nr,
                                                                                  link: ht.target
                                                                                    .value,
                                                                                }),
                                                                              ),
                                                                            placeholder:
                                                                              "Link (optional)",
                                                                            className:
                                                                              "flex-1 min-w-[140px] text-xs p-1.5 rounded-sm outline-none",
                                                                            style: {
                                                                              backgroundColor:
                                                                                COLOR_BG,
                                                                              border: `1px solid ${COLOR_BORDER}`,
                                                                              color: COLOR_INK,
                                                                            },
                                                                          }),
                                                                          jsx("input", {
                                                                            type: "date",
                                                                            value: editDraft.date,
                                                                            onChange: (ht) =>
                                                                              setEditDraft(
                                                                                (Nr) => ({
                                                                                  ...Nr,
                                                                                  date: ht.target
                                                                                    .value,
                                                                                }),
                                                                              ),
                                                                            className:
                                                                              "mono text-xs p-1.5 rounded-sm outline-none",
                                                                            style: {
                                                                              backgroundColor:
                                                                                COLOR_BG,
                                                                              border: `1px solid ${COLOR_BORDER}`,
                                                                              color: COLOR_INK,
                                                                            },
                                                                          }),
                                                                          jsxs("button", {
                                                                            onClick: saveEdit,
                                                                            className:
                                                                              "mono text-[10px] px-2.5 py-1.5 rounded-sm flex items-center gap-1",
                                                                            style: {
                                                                              backgroundColor:
                                                                                COLOR_INK,
                                                                              color: COLOR_BG,
                                                                              fontWeight: 700,
                                                                            },
                                                                            children: [
                                                                              jsx(SaveIcon, {
                                                                                size: 12,
                                                                              }),
                                                                              " Save",
                                                                            ],
                                                                          }),
                                                                          jsx("button", {
                                                                            onClick: cancelEdit,
                                                                            className:
                                                                              "mono text-[10px] px-2 py-1.5",
                                                                            style: {
                                                                              color: COLOR_MUTED,
                                                                            },
                                                                            children: "Cancel",
                                                                          }),
                                                                        ],
                                                                      }),
                                                                    ],
                                                                  },
                                                                  Ae.id,
                                                                )
                                                              : jsxs(
                                                                  "div",
                                                                  {
                                                                    className:
                                                                      "rounded-sm p-3 flex gap-3",
                                                                    style: {
                                                                      backgroundColor: COLOR_CARD,
                                                                      border: `1px solid ${COLOR_BORDER}`,
                                                                      borderLeft: `3px solid ${Qe.color}`,
                                                                    },
                                                                    children: [
                                                                      jsxs("div", {
                                                                        className: "flex-1 min-w-0",
                                                                        children: [
                                                                          jsxs("div", {
                                                                            className:
                                                                              "flex items-center gap-1.5 mb-1.5",
                                                                            children: [
                                                                              jsx("span", {
                                                                                className:
                                                                                  "mono text-[10px] px-1.5 py-0.5 rounded-sm inline-block",
                                                                                style: {
                                                                                  backgroundColor: `${Qe.color}22`,
                                                                                  color: Qe.color,
                                                                                  fontWeight: 700,
                                                                                },
                                                                                children: Qe.label,
                                                                              }),
                                                                              Ae.starred &&
                                                                                jsx(StarIcon, {
                                                                                  size: 11,
                                                                                  fill: "#C69214",
                                                                                  style: {
                                                                                    color:
                                                                                      "#C69214",
                                                                                  },
                                                                                }),
                                                                            ],
                                                                          }),
                                                                          jsx("p", {
                                                                            className:
                                                                              "text-sm leading-relaxed whitespace-pre-wrap",
                                                                            children: Ae.notes,
                                                                          }),
                                                                          Ae.link &&
                                                                            jsxs("a", {
                                                                              href: safeUrl(
                                                                                Ae.link,
                                                                              ),
                                                                              target: "_blank",
                                                                              rel: "noreferrer",
                                                                              className:
                                                                                "text-xs mt-1.5 inline-flex items-center gap-1 hover:underline",
                                                                              style: {
                                                                                color: "#2B4C7E",
                                                                              },
                                                                              children: [
                                                                                jsx(Link2Icon, {
                                                                                  size: 11,
                                                                                }),
                                                                                " session link",
                                                                              ],
                                                                            }),
                                                                        ],
                                                                      }),
                                                                      jsxs("div", {
                                                                        className:
                                                                          "flex flex-col items-center gap-1 self-start shrink-0",
                                                                        children: [
                                                                          jsx("button", {
                                                                            onClick: () =>
                                                                              toggleStar(Ae.id),
                                                                            className:
                                                                              "opacity-60 hover:opacity-100 transition p-1.5",
                                                                            style: {
                                                                              color: Ae.starred
                                                                                ? "#C69214"
                                                                                : COLOR_MUTED,
                                                                            },
                                                                            title: Ae.starred
                                                                              ? "Unstar"
                                                                              : "Star this entry",
                                                                            children: jsx(
                                                                              StarIcon,
                                                                              {
                                                                                size: 14,
                                                                                fill: Ae.starred
                                                                                  ? "#C69214"
                                                                                  : "none",
                                                                              },
                                                                            ),
                                                                          }),
                                                                          jsx("button", {
                                                                            onClick: () =>
                                                                              startEdit(Ae),
                                                                            className:
                                                                              "opacity-50 hover:opacity-100 transition p-1.5",
                                                                            style: {
                                                                              color: "#2B4C7E",
                                                                            },
                                                                            title: "Edit entry",
                                                                            children: jsx(
                                                                              PencilIcon,
                                                                              {
                                                                                size: 14,
                                                                              },
                                                                            ),
                                                                          }),
                                                                          jsx("div", {
                                                                            className:
                                                                              "w-4 h-px my-0.5",
                                                                            style: {
                                                                              backgroundColor:
                                                                                COLOR_BORDER,
                                                                            },
                                                                          }),
                                                                          jsx("button", {
                                                                            onClick: () =>
                                                                              deleteEntry(Ae.id),
                                                                            className:
                                                                              "opacity-40 hover:opacity-100 transition p-1.5",
                                                                            style: {
                                                                              color: "#A8472E",
                                                                            },
                                                                            title: "Delete entry",
                                                                            children: jsx(
                                                                              Trash2Icon,
                                                                              {
                                                                                size: 14,
                                                                              },
                                                                            ),
                                                                          }),
                                                                        ],
                                                                      }),
                                                                    ],
                                                                  },
                                                                  Ae.id,
                                                                );
                                                          }),
                                                        }),
                                                  ],
                                                },
                                                X,
                                              );
                                            }),
                                          }),
                                      ],
                                    },
                                    O.key,
                                  );
                                }),
                              }),
                        ],
                      })
                    : tab === "progress"
                      ? jsxs(Fragment, {
                          children: [
                            jsxs("div", {
                              className: "rounded-sm p-4 mb-5",
                              style: {
                                backgroundColor: COLOR_CARD,
                                border: `1px solid ${COLOR_BORDER}`,
                              },
                              children: [
                                jsxs("div", {
                                  className:
                                    "flex flex-wrap items-center justify-between gap-3 mb-4",
                                  children: [
                                    jsx("div", {
                                      className: "flex gap-1.5",
                                      children: [
                                        ["category", "Category-wise"],
                                        ["total", "All together"],
                                      ].map(([O, j]) =>
                                        jsx(
                                          "button",
                                          {
                                            onClick: () => setChartMode(O),
                                            className: "mono text-[11px] px-2.5 py-1 rounded-sm",
                                            style: {
                                              border: `1px solid ${chartMode === O ? COLOR_INK : COLOR_BORDER}`,
                                              backgroundColor:
                                                chartMode === O ? COLOR_INK : "transparent",
                                              color: chartMode === O ? COLOR_BG : COLOR_MUTED,
                                            },
                                            children: j,
                                          },
                                          O,
                                        ),
                                      ),
                                    }),
                                    jsx("div", {
                                      className: "flex gap-1.5",
                                      children: [
                                        ["weekly", "Weekly"],
                                        ["monthly", "Monthly"],
                                        ["yearly", "Yearly"],
                                      ].map(([O, j]) =>
                                        jsx(
                                          "button",
                                          {
                                            onClick: () => setChartPeriod(O),
                                            className: "mono text-[11px] px-2.5 py-1 rounded-sm",
                                            style: {
                                              border: `1px solid ${chartPeriod === O ? "#2B4C7E" : COLOR_BORDER}`,
                                              backgroundColor:
                                                chartPeriod === O ? "#2B4C7E" : "transparent",
                                              color: chartPeriod === O ? "#FAFBF6" : COLOR_MUTED,
                                            },
                                            children: j,
                                          },
                                          O,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                                entries.length === 0
                                  ? jsx("div", {
                                      className: "text-center py-14",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: jsx("p", {
                                        className: "text-sm",
                                        children: "No entries yet — nothing to chart.",
                                      }),
                                    })
                                  : jsx(ResponsiveContainer, {
                                      width: "100%",
                                      height: 184,
                                      children: jsxs(BarChart, {
                                        data: chartData,
                                        margin: {
                                          top: 4,
                                          right: 4,
                                          left: -20,
                                          bottom: 8,
                                        },
                                        children: [
                                          jsx(CartesianGrid, {
                                            stroke: COLOR_GRID,
                                            vertical: !1,
                                          }),
                                          jsx(XAxis, {
                                            dataKey: "period",
                                            interval: 0,
                                            tick: {
                                              fontSize: 9,
                                              fontFamily: "Space Mono",
                                              fill: COLOR_MUTED,
                                            },
                                            angle: -30,
                                            textAnchor: "end",
                                            height: 46,
                                            axisLine: {
                                              stroke: COLOR_BORDER,
                                            },
                                            tickLine: !1,
                                          }),
                                          jsx(YAxis, {
                                            allowDecimals: !1,
                                            tick: {
                                              fontSize: 9,
                                              fontFamily: "Space Mono",
                                              fill: COLOR_MUTED,
                                            },
                                            axisLine: !1,
                                            tickLine: !1,
                                          }),
                                          jsx(Tooltip, {
                                            contentStyle: {
                                              background: COLOR_CARD,
                                              border: `1px solid ${COLOR_BORDER}`,
                                              fontSize: 12,
                                              fontFamily: "Space Mono",
                                              borderRadius: 2,
                                            },
                                            labelStyle: {
                                              color: COLOR_INK,
                                              fontWeight: 700,
                                            },
                                            cursor: {
                                              fill: `${COLOR_INK}0A`,
                                            },
                                          }),
                                          chartMode === "category"
                                            ? jsxs(Fragment, {
                                                children: [
                                                  jsx(Legend, {
                                                    wrapperStyle: {
                                                      fontSize: 10,
                                                      fontFamily: "Space Mono",
                                                    },
                                                    iconSize: 8,
                                                  }),
                                                  subjects.map((O) =>
                                                    jsx(
                                                      Bar,
                                                      {
                                                        dataKey: O.id,
                                                        stackId: "a",
                                                        fill: O.color,
                                                        name: O.label,
                                                      },
                                                      O.id,
                                                    ),
                                                  ),
                                                ],
                                              })
                                            : jsx(Bar, {
                                                dataKey: "total",
                                                fill: COLOR_INK,
                                                radius: [2, 2, 0, 0],
                                                name: "Entries",
                                              }),
                                        ],
                                      }),
                                    }),
                              ],
                            }),
                            jsxs("div", {
                              className: "rounded-sm p-4 mb-5",
                              style: {
                                backgroundColor: COLOR_CARD,
                                border: `1px solid ${COLOR_BORDER}`,
                              },
                              children: [
                                jsxs("div", {
                                  className: "mb-3",
                                  children: [
                                    jsxs("div", {
                                      className:
                                        "flex flex-wrap items-center justify-between gap-2 mb-2",
                                      children: [
                                        jsx("p", {
                                          className: "mono text-xs",
                                          style: {
                                            fontWeight: 700,
                                            color: COLOR_INK,
                                          },
                                          children: "Sleep & Study Hours",
                                        }),
                                        jsxs("div", {
                                          className: "flex items-center gap-3",
                                          children: [
                                            jsxs("span", {
                                              className: "flex items-center gap-1 mono text-[10px]",
                                              style: {
                                                color: COLOR_MUTED,
                                              },
                                              children: [
                                                jsx("span", {
                                                  style: {
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "9999px",
                                                    backgroundColor: "#5B4B8A",
                                                    display: "inline-block",
                                                  },
                                                }),
                                                "Sleep",
                                              ],
                                            }),
                                            jsxs("span", {
                                              className: "flex items-center gap-1 mono text-[10px]",
                                              style: {
                                                color: COLOR_MUTED,
                                              },
                                              children: [
                                                jsx("span", {
                                                  style: {
                                                    width: "8px",
                                                    height: "8px",
                                                    borderRadius: "9999px",
                                                    backgroundColor: "#A8472E",
                                                    display: "inline-block",
                                                  },
                                                }),
                                                "Study",
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      className: "flex items-center justify-center gap-3",
                                      children: [
                                        jsx("button", {
                                          onClick: () => changeGraphMonth(-1),
                                          className: "mono text-xs px-2 py-1 rounded-sm",
                                          style: {
                                            border: `1px solid ${COLOR_BORDER}`,
                                            backgroundColor: "transparent",
                                            color: COLOR_INK,
                                          },
                                          type: "button",
                                          children: "◀",
                                        }),
                                        jsx("span", {
                                          className: "mono text-xs",
                                          style: {
                                            fontWeight: 700,
                                            color: COLOR_INK,
                                            minWidth: "120px",
                                            textAlign: "center",
                                          },
                                          children: monthLabel(graphMonth),
                                        }),
                                        jsx("button", {
                                          onClick: () => changeGraphMonth(1),
                                          className: "mono text-xs px-2 py-1 rounded-sm",
                                          style: {
                                            border: `1px solid ${COLOR_BORDER}`,
                                            backgroundColor: "transparent",
                                            color: COLOR_INK,
                                          },
                                          type: "button",
                                          children: "▶",
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      className:
                                        "flex items-center justify-center gap-2 mb-2 flex-wrap",
                                      children: [
                                        jsx("span", {
                                          className: "mono text-[10px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "Streak goal: study ≥",
                                        }),
                                        jsx("input", {
                                          type: "number",
                                          min: "2",
                                          max: "24",
                                          step: "0.5",
                                          value: studyGoalInput,
                                          onChange: (O) => setStudyGoalInput(O.target.value),
                                          onBlur: () => {
                                            const O = Number(studyGoalInput);
                                            if (studyGoalInput.trim() === "" || Number.isNaN(O)) {
                                              (setStudyGoalInput("2"), saveStudyGoal(2));
                                              return;
                                            }
                                            const j = Math.min(24, Math.max(2, O));
                                            (setStudyGoalInput(String(j)), saveStudyGoal(j));
                                          },
                                          className:
                                            "mono text-xs p-1 rounded-sm outline-none text-center",
                                          style: {
                                            width: "48px",
                                            backgroundColor: COLOR_BG,
                                            border: `1px solid ${COLOR_BORDER}`,
                                            color: COLOR_INK,
                                          },
                                        }),
                                        jsx("span", {
                                          className: "mono text-[10px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "hrs/day",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                renderSleepStudyGraph(sleepStudy, graphMonth),
                                Object.keys(sleepStudy).filter((d) => d.startsWith(graphMonth))
                                  .length === 0 &&
                                  jsx("p", {
                                    className: "text-xs italic text-center mt-1",
                                    style: {
                                      color: COLOR_MUTED,
                                    },
                                    children: "No entries logged for this month yet.",
                                  }),
                                selectedDay &&
                                  jsxs("div", {
                                    className:
                                      "flex items-center justify-center gap-2 mt-3 flex-wrap",
                                    children: [
                                      jsxs("p", {
                                        className: "mono text-xs",
                                        style: {
                                          color: COLOR_INK,
                                          fontWeight: 700,
                                        },
                                        children: [
                                          formatLongDate(selectedDay) + " — ",
                                          jsx("span", {
                                            style: {
                                              color: "#5B4B8A",
                                            },
                                            children:
                                              "Sleep: " +
                                              (sleepStudy[selectedDay] &&
                                              typeof sleepStudy[selectedDay].sleep == "number"
                                                ? formatHours(sleepStudy[selectedDay].sleep)
                                                : "—"),
                                          }),
                                          "  ·  ",
                                          jsx("span", {
                                            style: {
                                              color: "#A8472E",
                                            },
                                            children:
                                              "Study: " +
                                              (sleepStudy[selectedDay] &&
                                              typeof sleepStudy[selectedDay].study == "number"
                                                ? formatHours(sleepStudy[selectedDay].study)
                                                : "—"),
                                          }),
                                        ],
                                      }),
                                      jsx("button", {
                                        onClick: () => setSelectedDay(null),
                                        type: "button",
                                        className: "mono text-[10px] px-2 py-1 rounded-sm",
                                        style: {
                                          border: `1px solid ${COLOR_BORDER}`,
                                          color: COLOR_MUTED,
                                          backgroundColor: "transparent",
                                        },
                                        children: "Clear",
                                      }),
                                    ],
                                  }),
                                jsxs("div", {
                                  className: "flex flex-wrap items-end gap-2 mt-4 pt-3",
                                  style: {
                                    borderTop: `1px solid ${COLOR_BORDER}`,
                                  },
                                  children: [
                                    jsxs("div", {
                                      className: "flex flex-col gap-1",
                                      children: [
                                        jsx("label", {
                                          className: "mono text-[9px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "DATE",
                                        }),
                                        jsx("input", {
                                          type: "date",
                                          value: sleepForm.date,
                                          onChange: (O) => {
                                            const j = O.target.value,
                                              Q = sleepStudy[j];
                                            setSleepForm((X) => ({
                                              ...X,
                                              date: j,
                                              sleep:
                                                Q && typeof Q.sleep == "number"
                                                  ? formatHM(Q.sleep)
                                                  : "",
                                              study:
                                                Q && typeof Q.study == "number"
                                                  ? formatHM(Q.study)
                                                  : "",
                                            }));
                                          },
                                          className: "mono text-xs p-2 rounded-sm outline-none",
                                          style: {
                                            backgroundColor: COLOR_BG,
                                            border: `1px solid ${COLOR_BORDER}`,
                                            color: COLOR_INK,
                                          },
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      className: "flex flex-col gap-1",
                                      children: [
                                        jsx("label", {
                                          className: "mono text-[9px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "SLEEP (hrs : min)",
                                        }),
                                        jsxs("div", {
                                          className: "flex items-center gap-1",
                                          children: [
                                            jsx("input", {
                                              type: "number",
                                              min: "0",
                                              max: "24",
                                              placeholder: "hr",
                                              value: splitHM(sleepForm.sleep).h,
                                              onChange: (O) => {
                                                const j = splitHM(sleepForm.sleep).m;
                                                setSleepForm((Q) => ({
                                                  ...Q,
                                                  sleep: O.target.value + ":" + j,
                                                }));
                                              },
                                              className:
                                                "mono text-xs p-2 rounded-sm outline-none w-14 text-center",
                                              style: {
                                                backgroundColor: COLOR_BG,
                                                border: `1px solid ${COLOR_BORDER}`,
                                                color: COLOR_INK,
                                              },
                                            }),
                                            jsx("span", {
                                              style: {
                                                color: COLOR_MUTED,
                                              },
                                              children: ":",
                                            }),
                                            jsx("input", {
                                              type: "number",
                                              min: "0",
                                              max: "59",
                                              placeholder: "min",
                                              value: splitHM(sleepForm.sleep).m,
                                              onChange: (O) => {
                                                const j = splitHM(sleepForm.sleep).h;
                                                setSleepForm((Q) => ({
                                                  ...Q,
                                                  sleep: j + ":" + O.target.value,
                                                }));
                                              },
                                              className:
                                                "mono text-xs p-2 rounded-sm outline-none w-14 text-center",
                                              style: {
                                                backgroundColor: COLOR_BG,
                                                border: `1px solid ${COLOR_BORDER}`,
                                                color: COLOR_INK,
                                              },
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      className: "flex flex-col gap-1",
                                      children: [
                                        jsx("label", {
                                          className: "mono text-[9px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "STUDY (hrs : min)",
                                        }),
                                        jsxs("div", {
                                          className: "flex items-center gap-1",
                                          children: [
                                            jsx("input", {
                                              type: "number",
                                              min: "0",
                                              max: "24",
                                              placeholder: "hr",
                                              value: splitHM(sleepForm.study).h,
                                              onChange: (O) => {
                                                const j = splitHM(sleepForm.study).m;
                                                setSleepForm((Q) => ({
                                                  ...Q,
                                                  study: O.target.value + ":" + j,
                                                }));
                                              },
                                              className:
                                                "mono text-xs p-2 rounded-sm outline-none w-14 text-center",
                                              style: {
                                                backgroundColor: COLOR_BG,
                                                border: `1px solid ${COLOR_BORDER}`,
                                                color: COLOR_INK,
                                              },
                                            }),
                                            jsx("span", {
                                              style: {
                                                color: COLOR_MUTED,
                                              },
                                              children: ":",
                                            }),
                                            jsx("input", {
                                              type: "number",
                                              min: "0",
                                              max: "59",
                                              placeholder: "min",
                                              value: splitHM(sleepForm.study).m,
                                              onChange: (O) => {
                                                const j = splitHM(sleepForm.study).h;
                                                setSleepForm((Q) => ({
                                                  ...Q,
                                                  study: j + ":" + O.target.value,
                                                }));
                                              },
                                              className:
                                                "mono text-xs p-2 rounded-sm outline-none w-14 text-center",
                                              style: {
                                                backgroundColor: COLOR_BG,
                                                border: `1px solid ${COLOR_BORDER}`,
                                                color: COLOR_INK,
                                              },
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                    jsx("button", {
                                      onClick: logSleepStudy,
                                      className: "mono text-xs px-3 py-2 rounded-sm",
                                      style: {
                                        backgroundColor: COLOR_INK,
                                        color: COLOR_BG,
                                        fontWeight: 700,
                                      },
                                      children: "Log it",
                                    }),
                                    sleepMessage &&
                                      jsx("p", {
                                        className: "mono text-[10px] w-full",
                                        style: {
                                          color: COLOR_MUTED,
                                        },
                                        children: sleepMessage,
                                      }),
                                  ],
                                }),
                              ],
                            }),
                            jsxs("div", {
                              className: "rounded-sm p-4",
                              style: {
                                backgroundColor: COLOR_CARD,
                                border: `1px solid ${COLOR_BORDER}`,
                              },
                              children: [
                                jsxs("div", {
                                  className: "grid grid-cols-3 gap-3 mb-4 text-center",
                                  children: [
                                    jsxs("div", {
                                      children: [
                                        jsx("p", {
                                          className: "mono text-lg",
                                          style: {
                                            fontWeight: 700,
                                          },
                                          children: entries.length,
                                        }),
                                        jsx("p", {
                                          className: "mono text-[10px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "TOTAL LOGS",
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      children: [
                                        jsx("p", {
                                          className: "mono text-lg",
                                          style: {
                                            fontWeight: 700,
                                            color: "#C69214",
                                          },
                                          children: currentStreak,
                                        }),
                                        jsx("p", {
                                          className: "mono text-[10px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "CURRENT STREAK",
                                        }),
                                      ],
                                    }),
                                    jsxs("div", {
                                      children: [
                                        jsx("p", {
                                          className: "mono text-lg",
                                          style: {
                                            fontWeight: 700,
                                          },
                                          children: longestStreak,
                                        }),
                                        jsx("p", {
                                          className: "mono text-[10px]",
                                          style: {
                                            color: COLOR_MUTED,
                                          },
                                          children: "LONGEST STREAK",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                jsxs("div", {
                                  className: "flex items-center gap-2 rounded-sm px-3 py-2 mb-4",
                                  style: {
                                    backgroundColor: COLOR_BG,
                                    border: `1px solid ${COLOR_BORDER}`,
                                  },
                                  children: [
                                    jsx("span", {
                                      className: "mono text-[10px]",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: "THIS WEEK",
                                    }),
                                    jsx("span", {
                                      className: "mono text-sm",
                                      style: {
                                        fontWeight: 700,
                                      },
                                      children: weekStats.thisWeekCount,
                                    }),
                                    jsxs("span", {
                                      className: "mono text-[10px] px-1.5 py-0.5 rounded-sm",
                                      style: {
                                        color:
                                          weekStats.delta > 0
                                            ? "#1E6E62"
                                            : weekStats.delta < 0
                                              ? "#A8472E"
                                              : COLOR_MUTED,
                                        backgroundColor:
                                          weekStats.delta > 0
                                            ? "#1E6E6220"
                                            : weekStats.delta < 0
                                              ? "#A8472E20"
                                              : "transparent",
                                      },
                                      children: [
                                        weekStats.delta > 0 ? "↑" : weekStats.delta < 0 ? "↓" : "·",
                                        " ",
                                        Math.abs(weekStats.delta),
                                        " vs last week",
                                      ],
                                    }),
                                    jsxs("span", {
                                      className: "mono text-[10px] ml-auto",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: ["last week: ", weekStats.lastWeekCount],
                                    }),
                                  ],
                                }),
                                jsx("p", {
                                  className: "mono text-[10px] mb-2.5",
                                  style: {
                                    color: COLOR_MUTED,
                                    letterSpacing: "0.05em",
                                  },
                                  children: "ALL-TIME DISTRIBUTION",
                                }),
                                jsx("div", {
                                  className: "space-y-1.5",
                                  children: subjects.map((O) =>
                                    jsxs(
                                      "div",
                                      {
                                        className: "flex items-center gap-2",
                                        children: [
                                          jsx("span", {
                                            className: "mono text-[10px] w-24 shrink-0 truncate",
                                            style: {
                                              color: COLOR_MUTED,
                                            },
                                            children: O.label,
                                          }),
                                          jsx("div", {
                                            className: "flex-1 h-2 rounded-sm overflow-hidden",
                                            style: {
                                              backgroundColor: COLOR_BORDER,
                                            },
                                            children: jsx("div", {
                                              className: "h-full",
                                              style: {
                                                width: `${((countsBySubject[O.id] || 0) / maxSubjectCount) * 100}%`,
                                                backgroundColor: O.color,
                                              },
                                            }),
                                          }),
                                          jsx("span", {
                                            className: "mono text-[10px] w-5 text-right",
                                            style: {
                                              color: COLOR_MUTED,
                                            },
                                            children: countsBySubject[O.id] || 0,
                                          }),
                                        ],
                                      },
                                      O.id,
                                    ),
                                  ),
                                }),
                                jsx("p", {
                                  className: "mono text-[10px] mb-2 mt-5",
                                  style: {
                                    color: COLOR_MUTED,
                                    letterSpacing: "0.05em",
                                  },
                                  children: "ACTIVITY — LAST YEAR",
                                }),
                                jsx("div", {
                                  className: "overflow-x-auto pb-1",
                                  ref: heatmapScrollRef,
                                  children: jsx("div", {
                                    className: "inline-flex gap-[3px]",
                                    children: heatmapWeeks.map((O, j) =>
                                      jsx(
                                        "div",
                                        {
                                          className: "flex flex-col gap-[3px]",
                                          children: O.map((Q, X) =>
                                            jsx(
                                              "div",
                                              {
                                                title: Q.inFuture
                                                  ? ""
                                                  : `${Q.date}: ${Q.count} ${Q.count === 1 ? "entry" : "entries"}`,
                                                className: "w-[9px] h-[9px] rounded-[2px]",
                                                style: Q.inFuture
                                                  ? {
                                                      backgroundColor: "transparent",
                                                      border: `1px dashed ${COLOR_BORDER}`,
                                                    }
                                                  : {
                                                      backgroundColor: heatmapColor(Q.count),
                                                    },
                                              },
                                              X,
                                            ),
                                          ),
                                        },
                                        j,
                                      ),
                                    ),
                                  }),
                                }),
                                jsxs("div", {
                                  className: "flex items-center gap-1.5 mt-1.5",
                                  children: [
                                    jsx("span", {
                                      className: "mono text-[9px]",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: "Less",
                                    }),
                                    [0, 1, 2, 3].map((O) =>
                                      jsx(
                                        "div",
                                        {
                                          className: "w-[9px] h-[9px] rounded-[2px]",
                                          style: {
                                            backgroundColor: heatmapColor(O),
                                          },
                                        },
                                        O,
                                      ),
                                    ),
                                    jsx("span", {
                                      className: "mono text-[9px]",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: "More",
                                    }),
                                  ],
                                }),
                                jsxs("div", {
                                  className: "flex flex-wrap items-center gap-2 mt-5 pt-4",
                                  style: {
                                    borderTop: `1px solid ${COLOR_BORDER}`,
                                  },
                                  children: [
                                    jsx("span", {
                                      className: "mono text-[10px]",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: "PDF range:",
                                    }),
                                    jsx("input", {
                                      type: "date",
                                      value: pdfRange.start,
                                      onChange: (O) =>
                                        setPdfRange((j) => ({
                                          ...j,
                                          start: O.target.value,
                                        })),
                                      className: "mono text-[10px] p-1 rounded-sm outline-none",
                                      style: {
                                        backgroundColor: COLOR_BG,
                                        border: `1px solid ${COLOR_BORDER}`,
                                        color: COLOR_INK,
                                      },
                                    }),
                                    jsx("span", {
                                      className: "mono text-[10px]",
                                      style: {
                                        color: COLOR_MUTED,
                                      },
                                      children: "to",
                                    }),
                                    jsx("input", {
                                      type: "date",
                                      value: pdfRange.end,
                                      onChange: (O) =>
                                        setPdfRange((j) => ({
                                          ...j,
                                          end: O.target.value,
                                        })),
                                      className: "mono text-[10px] p-1 rounded-sm outline-none",
                                      style: {
                                        backgroundColor: COLOR_BG,
                                        border: `1px solid ${COLOR_BORDER}`,
                                        color: COLOR_INK,
                                      },
                                    }),
                                    (pdfRange.start || pdfRange.end) &&
                                      jsx("button", {
                                        onClick: () =>
                                          setPdfRange({
                                            start: "",
                                            end: "",
                                          }),
                                        className: "mono text-[10px]",
                                        style: {
                                          color: COLOR_MUTED,
                                          textDecoration: "underline",
                                        },
                                        children: "clear (use all-time)",
                                      }),
                                  ],
                                }),
                                jsxs("div", {
                                  className: "flex items-center gap-3 mt-3 flex-wrap",
                                  children: [
                                    jsxs("button", {
                                      onClick: exportPdf,
                                      className: "mono text-[10px] flex items-center gap-1",
                                      style: {
                                        color: "#2B4C7E",
                                      },
                                      children: [
                                        jsx(FileTextIcon, {
                                          size: 11,
                                        }),
                                        " export report (PDF)",
                                      ],
                                    }),
                                    jsxs("button", {
                                      onClick: exportBackup,
                                      className: "mono text-[10px] flex items-center gap-1",
                                      style: {
                                        color: "#2B4C7E",
                                      },
                                      children: [
                                        jsx(DownloadIcon, {
                                          size: 11,
                                        }),
                                        " export backup",
                                      ],
                                    }),
                                    jsxs("button", {
                                      onClick: openImportPicker,
                                      className: "mono text-[10px] flex items-center gap-1",
                                      style: {
                                        color: "#2B4C7E",
                                      },
                                      children: [
                                        jsx(UploadIcon, {
                                          size: 11,
                                        }),
                                        " import backup",
                                      ],
                                    }),
                                    jsx("input", {
                                      ref: importInputRef,
                                      type: "file",
                                      accept: "application/json",
                                      onChange: handleImportFile,
                                      className: "hidden",
                                    }),
                                    jsx("button", {
                                      onClick: clearAllEntries,
                                      className: "mono text-[10px]",
                                      style: {
                                        color: COLOR_MUTED,
                                        textDecoration: "underline",
                                      },
                                      children: "clear all entries",
                                    }),
                                  ],
                                }),
                                snapshotsPanel,
                              ],
                            }),
                          ],
                        })
                      : jsxs(Fragment, {
                          children: [
                            jsxs("div", {
                              className: "rounded-sm p-4 mb-5",
                              style: {
                                backgroundColor: COLOR_CARD,
                                border: `1px solid ${COLOR_BORDER}`,
                              },
                              children: [
                                jsx("input", {
                                  value: newTarget.title,
                                  onChange: (O) =>
                                    setNewTarget((j) => ({
                                      ...j,
                                      title: O.target.value,
                                    })),
                                  placeholder:
                                    "What do you want to master or finish? e.g. Finish Griffiths QM ch. 6–9",
                                  className: "w-full text-sm p-2.5 rounded-sm outline-none mb-2.5",
                                  style: {
                                    backgroundColor: COLOR_BG,
                                    border: `1px solid ${COLOR_BORDER}`,
                                    color: COLOR_INK,
                                    fontFamily: "'Source Serif 4', Georgia, serif",
                                  },
                                }),
                                jsxs("div", {
                                  className: "flex flex-wrap gap-1.5 mb-2.5",
                                  children: [
                                    jsx("button", {
                                      onClick: () =>
                                        setNewTarget((O) => ({
                                          ...O,
                                          subjectId: "",
                                        })),
                                      className: "mono text-[11px] px-2.5 py-1 rounded-sm",
                                      style: {
                                        border: `1px solid ${newTarget.subjectId === "" ? COLOR_INK : COLOR_BORDER}`,
                                        backgroundColor:
                                          newTarget.subjectId === "" ? COLOR_INK : "transparent",
                                        color: newTarget.subjectId === "" ? COLOR_BG : COLOR_MUTED,
                                      },
                                      children: "General",
                                    }),
                                    subjects.map((O) =>
                                      jsx(
                                        "button",
                                        {
                                          onClick: () =>
                                            setNewTarget((j) => ({
                                              ...j,
                                              subjectId: O.id,
                                            })),
                                          className: "mono text-[11px] px-2.5 py-1 rounded-sm",
                                          style: {
                                            border: `1px solid ${newTarget.subjectId === O.id ? O.color : COLOR_BORDER}`,
                                            backgroundColor:
                                              newTarget.subjectId === O.id
                                                ? O.color
                                                : "transparent",
                                            color:
                                              newTarget.subjectId === O.id
                                                ? "#FAFBF6"
                                                : COLOR_MUTED,
                                          },
                                          children: O.label,
                                        },
                                        O.id,
                                      ),
                                    ),
                                  ],
                                }),
                                jsxs("div", {
                                  className: "flex flex-wrap items-center gap-2",
                                  children: [
                                    [
                                      ["today", "Today"],
                                      ["week", "This week"],
                                      ["month", "This month"],
                                      ["custom", "Custom date"],
                                    ].map(([O, j]) =>
                                      jsx(
                                        "button",
                                        {
                                          onClick: () =>
                                            setNewTarget((Q) => ({
                                              ...Q,
                                              deadlineKind: O,
                                            })),
                                          className: "mono text-[11px] px-2.5 py-1 rounded-sm",
                                          style: {
                                            border: `1px solid ${newTarget.deadlineKind === O ? "#2B4C7E" : COLOR_BORDER}`,
                                            backgroundColor:
                                              newTarget.deadlineKind === O
                                                ? "#2B4C7E"
                                                : "transparent",
                                            color:
                                              newTarget.deadlineKind === O
                                                ? "#FAFBF6"
                                                : COLOR_MUTED,
                                          },
                                          children: j,
                                        },
                                        O,
                                      ),
                                    ),
                                    newTarget.deadlineKind === "custom" &&
                                      jsx("input", {
                                        type: "date",
                                        value: newTarget.customDate,
                                        min: todayStr(),
                                        onChange: (O) =>
                                          setNewTarget((j) => ({
                                            ...j,
                                            customDate: O.target.value,
                                          })),
                                        className: "mono text-xs p-1.5 rounded-sm outline-none",
                                        style: {
                                          backgroundColor: COLOR_BG,
                                          border: `1px solid ${COLOR_BORDER}`,
                                          color: COLOR_INK,
                                        },
                                      }),
                                    jsxs("button", {
                                      onClick: addTarget,
                                      className:
                                        "mono text-xs px-3 py-1.5 rounded-sm flex items-center gap-1 ml-auto",
                                      style: {
                                        backgroundColor: COLOR_INK,
                                        color: COLOR_BG,
                                        fontWeight: 700,
                                      },
                                      children: [
                                        jsx(PlusIcon, {
                                          size: 13,
                                        }),
                                        " Set target",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            targetsView.length === 0
                              ? jsx("div", {
                                  className: "text-center py-14 rounded-sm",
                                  style: {
                                    border: `1px dashed ${COLOR_BORDER}`,
                                    color: COLOR_MUTED,
                                  },
                                  children: jsx("p", {
                                    className: "text-sm",
                                    children:
                                      "No targets set. Add one above — a topic to master, a paper to finish, anything with a deadline.",
                                  }),
                                })
                              : jsx("div", {
                                  className: "space-y-2",
                                  children: targetsView.map((O) => {
                                    const j = O.subjectId
                                        ? getSubject(O.subjectId, subjects)
                                        : null,
                                      Q = deadlineStatus(O.deadline),
                                      X = O.status === "done",
                                      oe = X
                                        ? COLOR_MUTED
                                        : Q.tone === "over"
                                          ? "#8C1010"
                                          : Q.tone === "warn"
                                            ? "#C69214"
                                            : "#1E6E62";
                                    return jsxs(
                                      "div",
                                      {
                                        className: "rounded-sm p-3 flex gap-3",
                                        style: {
                                          backgroundColor: COLOR_CARD,
                                          border: `1px solid ${COLOR_BORDER}`,
                                          borderLeft: `3px solid ${X ? COLOR_MUTED : j ? j.color : "#2B4C7E"}`,
                                          opacity: X ? 0.6 : 1,
                                        },
                                        children: [
                                          jsx("button", {
                                            onClick: () => toggleTargetDone(O.id),
                                            className:
                                              "self-start mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center shrink-0",
                                            style: {
                                              border: `1.5px solid ${X ? "#1E6E62" : COLOR_BORDER}`,
                                              backgroundColor: X ? "#1E6E62" : "transparent",
                                            },
                                            title: X ? "Mark active" : "Mark complete",
                                            children:
                                              X &&
                                              jsx(CheckIcon, {
                                                size: 11,
                                                style: {
                                                  color: "#FAFBF6",
                                                },
                                              }),
                                          }),
                                          jsxs("div", {
                                            className: "flex-1 min-w-0",
                                            children: [
                                              jsx("p", {
                                                className: "text-sm leading-snug",
                                                style: {
                                                  textDecoration: X ? "line-through" : "none",
                                                },
                                                children: O.title,
                                              }),
                                              jsxs("div", {
                                                className:
                                                  "flex flex-wrap items-center gap-2 mt-1.5",
                                                children: [
                                                  j &&
                                                    jsx("span", {
                                                      className:
                                                        "mono text-[10px] px-1.5 py-0.5 rounded-sm",
                                                      style: {
                                                        backgroundColor: `${j.color}22`,
                                                        color: j.color,
                                                        fontWeight: 700,
                                                      },
                                                      children: j.label,
                                                    }),
                                                  jsxs("span", {
                                                    className:
                                                      "mono text-[10px] flex items-center gap-1",
                                                    style: {
                                                      color: oe,
                                                      fontWeight:
                                                        Q.tone === "over" && !X ? 800 : 400,
                                                    },
                                                    children: [
                                                      jsx(CalendarIcon, {
                                                        size: 10,
                                                      }),
                                                      " ",
                                                      X ? "Completed" : Q.text,
                                                    ],
                                                  }),
                                                  jsxs("span", {
                                                    className: "mono text-[10px]",
                                                    style: {
                                                      color: COLOR_MUTED,
                                                    },
                                                    children: [
                                                      "· ",
                                                      O.daysLogged,
                                                      " day",
                                                      O.daysLogged === 1 ? "" : "s",
                                                      " logged since",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          jsx("button", {
                                            onClick: () => deleteTarget(O.id),
                                            className:
                                              "self-start opacity-40 hover:opacity-100 transition",
                                            style: {
                                              color: "#A8472E",
                                            },
                                            title: "Delete target",
                                            children: jsx(Trash2Icon, {
                                              size: 15,
                                            }),
                                          }),
                                        ],
                                      },
                                      O.id,
                                    );
                                  }),
                                }),
                          ],
                        }),
                ],
              }),
          jsx("footer", {
            className: "mt-10 text-center",
            children: jsx("p", {
              className: "mono text-[10px] tracking-wide",
              style: {
                color: COLOR_MUTED,
                opacity: 0.6,
              },
              children: "obviously built by a physicist — Shubhro",
            }),
          }),
        ],
      }),
      jsxs("div", {
        className: "hidden print:block px-8 py-6",
        style: {
          color: "#111",
          fontFamily: "Georgia, serif",
        },
        children: [
          jsx("h1", {
            style: {
              fontFamily: "'Space Mono', monospace",
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "2px",
            },
            children: "LOGBOOK — Progress Report",
          }),
          jsxs("p", {
            style: {
              fontSize: "11px",
              color: "#555",
              marginBottom: "2px",
            },
            children: [
              "Generated ",
              new Date().toLocaleDateString(void 0, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            ],
          }),
          jsx("p", {
            style: {
              fontSize: "11px",
              color: "#555",
              marginBottom: "18px",
            },
            children:
              pdfRange.start || pdfRange.end
                ? `Range: ${pdfRange.start ? formatLongDate(pdfRange.start) : "the beginning"} — ${pdfRange.end ? formatLongDate(pdfRange.end) : "today"}`
                : "Range: all-time",
          }),
          jsx("h2", {
            style: {
              fontFamily: "'Space Mono', monospace",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "6px",
              marginTop: "18px",
            },
            children: "SUMMARY",
          }),
          jsxs("p", {
            style: {
              fontSize: "12px",
              marginBottom: "4px",
            },
            children: ["Entries in this report: ", pdfEntries.length],
          }),
          jsxs("p", {
            style: {
              fontSize: "12px",
              marginBottom: "4px",
            },
            children: ["Current streak: ", currentStreak, " day", currentStreak === 1 ? "" : "s"],
          }),
          jsxs("p", {
            style: {
              fontSize: "12px",
              marginBottom: "4px",
            },
            children: ["Longest streak: ", longestStreak, " day", longestStreak === 1 ? "" : "s"],
          }),
          targetsView.length > 0 &&
            jsxs(Fragment, {
              children: [
                jsx("h2", {
                  style: {
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "6px",
                    marginTop: "18px",
                  },
                  children: "TARGETS",
                }),
                targetsView.map((O) => {
                  const j = O.subjectId ? getSubject(O.subjectId, subjects) : null,
                    Q = deadlineStatus(O.deadline);
                  return jsxs(
                    "p",
                    {
                      style: {
                        fontSize: "12px",
                        marginBottom: "4px",
                      },
                      children: [
                        O.status === "done" ? "[done]" : "[ ]",
                        " ",
                        O.title,
                        j ? ` — ${j.label}` : "",
                        " — ",
                        O.status === "done" ? "completed" : Q.text,
                        " — ",
                        O.daysLogged,
                        " day",
                        O.daysLogged === 1 ? "" : "s",
                        " logged",
                      ],
                    },
                    O.id,
                  );
                }),
              ],
            }),
          jsx("h2", {
            style: {
              fontFamily: "'Space Mono', monospace",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "6px",
              marginTop: "18px",
            },
            children: "DISTRIBUTION",
          }),
          subjects.map((O) =>
            jsxs(
              "p",
              {
                style: {
                  fontSize: "12px",
                  marginBottom: "4px",
                },
                children: [O.label, ": ", pdfCountsBySubject[O.id] || 0],
              },
              O.id,
            ),
          ),
          jsx("h2", {
            style: {
              fontFamily: "'Space Mono', monospace",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "6px",
              marginTop: "18px",
            },
            children: "ENTRIES",
          }),
          pdfEntriesByDate.map(([O, j]) =>
            jsxs(
              "div",
              {
                style: {
                  marginBottom: "10px",
                  breakInside: "avoid",
                },
                children: [
                  jsx("p", {
                    style: {
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "11px",
                      fontWeight: 700,
                      borderBottom: "1px solid #ccc",
                      paddingBottom: "2px",
                      marginBottom: "4px",
                    },
                    children: formatLongDate(O),
                  }),
                  j.map((Q) => {
                    const X = getSubject(Q.subjectId, subjects);
                    return jsxs(
                      "p",
                      {
                        style: {
                          fontSize: "12px",
                          marginBottom: "4px",
                          paddingLeft: "8px",
                        },
                        children: [
                          jsxs("strong", {
                            children: ["[", X.label, "]"],
                          }),
                          Q.starred ? " ★" : "",
                          " ",
                          Q.notes,
                          Q.link ? ` (link: ${Q.link})` : "",
                        ],
                      },
                      Q.id,
                    );
                  }),
                ],
              },
              O,
            ),
          ),
        ],
      }),
    ],
  });
}
navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {});
try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    jsx(React.StrictMode, {
      children: jsx(LogbookApp, {}),
    }),
  );
} catch (e) {
  document.getElementById("root").innerHTML =
    `<pre style="padding:20px;color:#A8472E;font-family:monospace;white-space:pre-wrap;">Failed to start:
` +
    (e && e.stack ? e.stack : String(e)) +
    "</pre>";
}
