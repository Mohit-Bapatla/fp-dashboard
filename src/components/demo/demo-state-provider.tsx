"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  createInitialRecruiterDemoState,
  type DemoApplicantStatus,
  type DemoApplication,
  type DemoApplicationStatus,
  type DemoOnboardingState,
  type RecruiterDemoState,
} from "@/lib/demo/recruiter-fixtures";

const STORAGE_KEY = "fp-recruiter-demo-state-v1";
const serverSnapshot = createInitialRecruiterDemoState();
let browserSnapshot: RecruiterDemoState | null = null;
const storeListeners = new Set<() => void>();

type DemoStateContextValue = {
  announcement: string;
  resetDemo: () => void;
  resetOnboarding: () => void;
  saveOpportunity: (opportunityId: string) => void;
  setApplicantComment: (applicantId: string, comment: string) => void;
  setApplicantStatus: (
    applicantId: string,
    status: DemoApplicantStatus,
  ) => void;
  setApplicationNote: (applicationId: string, note: string) => void;
  setApplicationStatus: (
    applicationId: string,
    status: DemoApplicationStatus,
  ) => void;
  setOnboarding: (update: Partial<DemoOnboardingState>) => void;
  startApplication: (opportunityId: string, deadline: string) => string;
  state: RecruiterDemoState;
  toggleApplicationTask: (applicationId: string, taskId: string) => void;
};

const DemoStateContext = createContext<DemoStateContextValue | null>(null);

function isRecruiterDemoState(value: unknown): value is RecruiterDemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RecruiterDemoState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.applications) &&
    Array.isArray(candidate.partnerApplicants) &&
    Array.isArray(candidate.savedOpportunityIds) &&
    Boolean(candidate.onboarding)
  );
}

function readBrowserSnapshot() {
  if (browserSnapshot) return browserSnapshot;

  try {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (isRecruiterDemoState(parsed)) {
        browserSnapshot = parsed;
        return browserSnapshot;
      }
    }
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
  }

  browserSnapshot = createInitialRecruiterDemoState();
  return browserSnapshot;
}

function subscribeToDemoState(listener: () => void) {
  storeListeners.add(listener);
  return () => storeListeners.delete(listener);
}

function writeBrowserSnapshot(
  update:
    RecruiterDemoState | ((current: RecruiterDemoState) => RecruiterDemoState),
) {
  const current = readBrowserSnapshot();
  browserSnapshot = typeof update === "function" ? update(current) : update;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(browserSnapshot));
  } catch {
    // The in-memory, tab-scoped demo still works if browser storage is blocked.
  }
  storeListeners.forEach((listener) => listener());
}

export function DemoStateProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    subscribeToDemoState,
    readBrowserSnapshot,
    () => serverSnapshot,
  );
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(message), 0);
  }, []);

  const resetDemo = useCallback(() => {
    writeBrowserSnapshot(createInitialRecruiterDemoState());
    announce("Demo restored to its original synthetic data.");
  }, [announce]);

  const resetOnboarding = useCallback(() => {
    writeBrowserSnapshot((current) => ({
      ...current,
      onboarding: createInitialRecruiterDemoState().onboarding,
    }));
    announce("Onboarding demo reset to the first step.");
  }, [announce]);

  const saveOpportunity = useCallback(
    (opportunityId: string) => {
      writeBrowserSnapshot((current) => {
        const isSaved = current.savedOpportunityIds.includes(opportunityId);
        return {
          ...current,
          savedOpportunityIds: isSaved
            ? current.savedOpportunityIds.filter((id) => id !== opportunityId)
            : [...current.savedOpportunityIds, opportunityId],
        };
      });
      announce("Saved opportunities updated in this demo tab only.");
    },
    [announce],
  );

  const startApplication = useCallback(
    (opportunityId: string, deadline: string) => {
      const applicationId = `demo-application-${opportunityId.replace("demo-opportunity-", "")}`;
      writeBrowserSnapshot((current) => {
        if (
          current.applications.some(
            (application) => application.opportunityId === opportunityId,
          )
        ) {
          return current;
        }

        const application: DemoApplication = {
          deadline,
          id: applicationId,
          note: "",
          opportunityId,
          resumeAttached: false,
          status: "Planning",
          tasks: [
            {
              completed: false,
              id: `${applicationId}-review`,
              label: "Review program requirements",
            },
            {
              completed: false,
              id: `${applicationId}-materials`,
              label: "Prepare application materials",
            },
            {
              completed: false,
              id: `${applicationId}-submit`,
              label: "Submit official application",
            },
          ],
        };
        return {
          ...current,
          applications: [...current.applications, application],
        };
      });
      announce("A synthetic application workspace was created.");
      return applicationId;
    },
    [announce],
  );

  const setApplicationStatus = useCallback(
    (applicationId: string, status: DemoApplicationStatus) => {
      writeBrowserSnapshot((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === applicationId
            ? { ...application, status }
            : application,
        ),
      }));
      announce(`Application status changed to ${status}.`);
    },
    [announce],
  );

  const toggleApplicationTask = useCallback(
    (applicationId: string, taskId: string) => {
      writeBrowserSnapshot((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                tasks: application.tasks.map((task) =>
                  task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task,
                ),
              }
            : application,
        ),
      }));
      announce("Application checklist updated.");
    },
    [announce],
  );

  const setApplicationNote = useCallback(
    (applicationId: string, note: string) => {
      writeBrowserSnapshot((current) => ({
        ...current,
        applications: current.applications.map((application) =>
          application.id === applicationId
            ? { ...application, note }
            : application,
        ),
      }));
      announce("Private demo note saved in this browser tab.");
    },
    [announce],
  );

  const setOnboarding = useCallback((update: Partial<DemoOnboardingState>) => {
    writeBrowserSnapshot((current) => ({
      ...current,
      onboarding: { ...current.onboarding, ...update },
    }));
  }, []);

  const setApplicantStatus = useCallback(
    (applicantId: string, status: DemoApplicantStatus) => {
      writeBrowserSnapshot((current) => ({
        ...current,
        partnerApplicants: current.partnerApplicants.map((applicant) =>
          applicant.id === applicantId ? { ...applicant, status } : applicant,
        ),
      }));
      announce(`Applicant status changed to ${status}.`);
    },
    [announce],
  );

  const setApplicantComment = useCallback(
    (applicantId: string, comment: string) => {
      writeBrowserSnapshot((current) => ({
        ...current,
        partnerApplicants: current.partnerApplicants.map((applicant) =>
          applicant.id === applicantId ? { ...applicant, comment } : applicant,
        ),
      }));
      announce("Partner demo comment saved in this browser tab.");
    },
    [announce],
  );

  const value = useMemo<DemoStateContextValue>(
    () => ({
      announcement,
      resetDemo,
      resetOnboarding,
      saveOpportunity,
      setApplicantComment,
      setApplicantStatus,
      setApplicationNote,
      setApplicationStatus,
      setOnboarding,
      startApplication,
      state,
      toggleApplicationTask,
    }),
    [
      announcement,
      resetDemo,
      resetOnboarding,
      saveOpportunity,
      setApplicantComment,
      setApplicantStatus,
      setApplicationNote,
      setApplicationStatus,
      setOnboarding,
      startApplication,
      state,
      toggleApplicationTask,
    ],
  );

  return (
    <DemoStateContext.Provider value={value}>
      {children}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </DemoStateContext.Provider>
  );
}

export function useDemoState() {
  const context = useContext(DemoStateContext);
  if (!context) {
    throw new Error("useDemoState must be used within DemoStateProvider");
  }
  return context;
}
