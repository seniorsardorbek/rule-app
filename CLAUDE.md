# rule-app — Mobile + Web Client

Expo 54 / React Native 0.81 app for the Rule driving-license test prep platform. Same codebase ships to iOS, Android, and the web (Expo for Web / RNW). Routing is file-based via `expo-router`.

## Run

```
npm start          # expo dev server (QR + a/i/w shortcuts)
npm run web        # web only
```

API base URL is auto-derived from Expo's `hostUri` (`services/api.ts`). For local dev the API is expected at `http://<lan-ip>:4000/api`.

## Top-level layout

```
rule-app/
├── app/                  expo-router file tree (pages live here)
│   ├── _layout.tsx       Redux + React Query providers, root <Stack>
│   ├── index.tsx         splash router (auth + onboarding gate)
│   ├── (auth)/           phone login flow
│   ├── (onboarding)/     5-step onboarding
│   ├── (tabs)/           main shell — index, study, quiz, profile
│   └── quiz/             quiz player + mistakes practice + results
├── components/           reusable UI (AnimatedTabBar, PerformanceWidget)
├── services/             api client, react-query hooks, i18n, storage
├── store/                redux toolkit (in-memory only)
├── theme/colors.ts       palette for color= props
├── tailwind.config.js    palette + nativewind preset
└── global.css            tailwind directives
```

## Navigation graph (pages, modals, redirects)

### Root stack (`app/_layout.tsx`)

```
index           → splash router; redirects to one of below
(auth)          → public stack, login screen
(onboarding)    → public stack, single-screen multi-step
(tabs)          → main app shell (custom AnimatedTabBar)
quiz            → modal-style stack on top of tabs
```

### `index.tsx` redirect logic

```
checking access_token in storage
├── token + verified user
│   ├── user.onboarding present → /(tabs)
│   └── user.onboarding null    → /(onboarding)
├── no token, onboarding_completed=true → /(auth)/login
└── no token, onboarding incomplete    → /(onboarding)
```

### `(tabs)` (order matters — matches Figma)

| Route   | Title (uz)  | Icon (active / inactive)        |
| ------- | ----------- | ------------------------------- |
| `index` | AI kuzatuv  | home / home-outline             |
| `study` | Darslik     | school / school-outline         |
| `quiz`  | Test        | reader / reader-outline         |
| `profile` | Profil    | person / person-outline         |

Tab bar is custom (`components/AnimatedTabBar.tsx`) — not the default Expo bar. Active icon + label use `colors.primary`, inactive use `colors.inkMuted`. The active pill is a 80×56 white rounded rectangle with shadow. **Do not add expo-blur, reanimated, or sliding animations** — the design is intentionally a simple white pill.

### `quiz` stack

| Route             | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `quiz/[id]`       | Quiz player. Loads quiz by id, walks questions     |
| `quiz/mistakes`   | Mistakes practice player (random order, no quizId) |
| `quiz/results`    | History list of past attempts                      |

### Pages — what each does

| File                              | Role                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `app/index.tsx`                   | Splash + redirect router (above)                                                                   |
| `app/(auth)/login.tsx`            | Phone + password sign-in. On success calls `setCredentials` and stores `access_token`              |
| `app/(onboarding)/index.tsx`      | Language → gender → age → problems → daily_time → exam_date. Saves to `onboarding_data` in storage; consumed at sign-up |
| `app/(tabs)/index.tsx`            | Home: avatar+greeting, exam-countdown card, `<PerformanceWidget>`, recent quizzes (limit 4)        |
| `app/(tabs)/study.tsx`            | Lessons / theory content                                                                           |
| `app/(tabs)/quiz.tsx`             | Quiz list. Mistakes-practice CTA card + grid of all quizzes                                        |
| `app/(tabs)/profile.tsx`          | Profile: language switcher, sign-out, settings rows                                                |
| `app/quiz/[id].tsx`               | Quiz player. One question at a time. "Tekshirish" → "Keyingisi" → "Yakunlash"                       |
| `app/quiz/mistakes.tsx`           | Same player UI but pulls from `getMistakesPracticeApi`. On submit shows result modal               |
| `app/quiz/results.tsx`            | Per-quiz attempt list                                                                              |

### Modals

There are no native `<Modal>` overlays in steady-state UI. Modal-style screens are stacked routes (`quiz/*` over `(tabs)`), and confirmations use `Alert.alert` (e.g., sign-out confirm in profile, "no answer selected" prompt in quiz).

The mistakes-practice **result modal** (`quiz/mistakes.tsx` end-of-flow) is an inline overlay (positioned `View`) — not a `<Modal>` — showing `corrected` / `stillWrong` counts and a Close button that routes back.

## State management

### Redux Toolkit (`store/`)

```
auth   user, token, isAuthenticated, tokenLoaded
quiz   currentQuizId, answers (questionId → optionId), submitted, resultId
lang   lang ("uz" | "oz" | "ru")
```

**No `redux-persist`.** State is in-memory only. Fast-refresh, full reload, or app restart wipes Redux. Components that need `auth.user` after a navigation must tolerate it being `null`:

```ts
let userId = user?.id;
if (!userId) {
  const token = await storage.getItem("access_token");
  if (!token) { Alert.alert(...); return; }
  const verified = await verifyMeApi();
  if (verified.isLoggedIn && verified.user) {
    dispatch(setCredentials({ user: verified.user, token }));
    userId = verified.user.id;
  }
}
```

This pattern is used in `quiz/[id].tsx` and `quiz/mistakes.tsx` before submit. Reuse it anywhere a screen needs `userId` for an API call.

### TanStack Query (`services/quiz.ts`, `services/auth.ts`)

Cache keys:

| Key                                                   | Hook                                       |
| ----------------------------------------------------- | ------------------------------------------ |
| `["quizzes", params]`                                 | `useQuizzes`                               |
| `["quizzes", id]`                                     | `useQuiz`                                  |
| `["results", id]`                                     | `useResult`                                |
| `["results", "user", userId, quizId]`                 | `useUserResults`                           |
| `["results", "user", userId, "incorrect", quizId]`    | `useUserIncorrect`                         |
| `["results", "user", userId, "mistakes-practice"]`    | `useMistakesPractice`                      |
| `["results", "user", userId, "today"]`                | `useTodayPerformance`                      |
| `["auth", "verify"]`                                  | `useVerifyMe`                              |

After any submit (`useSubmitResult`, `useSubmitMistakesPractice`) we invalidate `["quizzes"]` and `["results"]` — the prefix match refreshes everything user-scoped, including `useTodayPerformance`. **Always keep this invalidation pattern when adding new submit mutations.**

### Local persistence (`services/storage.ts`)

Async key-value shim (SecureStore on native, localStorage on web). Keys in use:

| Key                      | Set by                       | Read by                          |
| ------------------------ | ---------------------------- | -------------------------------- |
| `access_token`           | login / sign-up success      | every API request, splash gate   |
| `onboarding_data`        | onboarding screen as user progresses | sign-up payload assembly      |
| `onboarding_completed`   | end of onboarding            | splash gate (pre-registration UX)|

## Data models

These are the frontend types — they mirror what the API returns.

### User & onboarding

```ts
type User = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: "BIGBOSS" | "ADMIN" | "CLIENT";
  lang: "UZ" | "EN" | "RU";
  address?: { street?, city?, country? };
  onboarding?: OnboardingData | null;  // OneToOne, eager-loaded by API
};

type OnboardingData = {
  language?: string;        // "uz" | "oz" | "ru"
  gender?: string;
  age?: string;
  problems?: string[];
  daily_time?: string;      // informational only — does NOT drive goal math
  exam_date?: string;       // ISO date — drives goal math
  completed_at?: string;
};
```

### Quiz

```ts
type Quiz = {
  id: string;
  name_uz: string; name_oz?: string; name_ru?: string;
  description?: string;
  is_active: boolean;
  questions: QuizQuestion[];
  last_result?: QuizLastResult | null;   // user's most recent attempt
  created_at; updated_at;
};

type QuizQuestion = {
  id; quiz_id; order;
  question_uz; question_oz?; question_ru?;
  topic_name_uz?; topic_name_oz?; topic_name_ru?;
  image?: { id, url, filename } | null;
  options: QuizOption[];
};

type QuizOption = {
  id; question_id;
  text_uz; text_oz?; text_ru?;
  is_correct: boolean;     // sent only after submit/check; trust the API
};
```

### Quiz result

```ts
type QuizResult = {
  id; user_id; quiz_id;
  attempt: number;             // 1-based; backend assigns next attempt #
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  created_at;
  quiz: Quiz;
  answers: QuizResultAnswer[];
};

type QuizResultAnswer = {
  id; question_id;
  is_correct: boolean;
  question: QuizQuestion;
  selected_option: QuizOption | null;   // null = unanswered
};
```

### Today performance

```ts
type TodayPerformance = {
  exam_date: string | null;
  days_until_exam: number | null;
  total_questions_in_bank: number;
  daily_time: string | null;            // pass-through, unused for math
  goal_questions: number | null;
  goal_quizzes: number | null;
  today_questions: number;
  today_attempts: number;
  today_quiz_attempts: number;
  today_mistakes_sessions: number;
  performance_percent: number | null;
};
```

## Calculation logic

### Daily goal (server: `quiz-result.service.ts#getTodayPerformance`)

```
goalQuestions = ceil(total_questions_in_bank / days_until_exam)
goalQuizzes   = max(1, round(goalQuestions / 20))   // ~20 q per quiz
performance%  = floor(today_questions / goalQuestions * 100)
```

`daily_time` from onboarding is **not** used. The exam date is the only driver. When `exam_date` is unset, `goal_questions` and `days_until_exam` are `null` and the widget renders the "set goal" CTA.

### Today's question count

```
today_questions = today_quiz_attempts.questions
                + today_mistakes_sessions.attempted
```

That is why `MistakesPracticeSession` rows exist on the API side — practice sessions count toward the daily goal even though they aren't tied to a single quiz.

### Exam countdown (home header — `app/(tabs)/index.tsx#getExamCountdown`)

```
daysLeft = max(0, ceil((exam_date - now) / MS_PER_DAY))
percent  = clamp(0..100, round((now - onboarding_started_at) / (exam_date - onboarding_started_at) * 100))
```

`percent` is `null` until onboarding has a `completed_at` to use as the start point.

### Mistakes practice flow

1. `GET /quiz/results/user/:userId/mistakes-practice` — server returns shuffled (Fisher-Yates) list of questions where the **latest attempt** for that question was wrong.
2. Player walks them like a normal quiz.
3. `POST /quiz/results/mistakes-practice` with answers → server:
   - For each correct answer, promotes the question on its quiz's latest result (decrements `incorrect_count`, increments `correct_count`) so it stops appearing in future mistakes pulls.
   - Inserts a `mistakes_practice_sessions` row so today's progress counts toward goal.
   - Returns `{ attempted, corrected, stillWrong, updatedResults }`.
4. Client shows result modal and invalidates `["results"]`.

### Quiz player state machine (`app/quiz/[id].tsx`)

```
For each question index:
  state ∈ { unanswered, answered (selected), checked (after Tekshirish) }
Transitions:
  Tap option        → answered    (writes to redux quiz.answers)
  Tekshirish (btn)  → checked     (adds index to checkedIndices)
  Keyingisi (btn)   → currentIndex++
  Last question + checked → Yakunlash (submits all)
  Last question + not checked → Baribir yuborish (submits unanswered)
```

The `checkedIndices` set is *local* component state — not Redux — because it represents UI progression, not domain data.

## Design conventions

### Palette (single source of truth)

`tailwind.config.js` (for `className=`) and `theme/colors.ts` (for `color=` props) **must stay in sync**. To add a new color: edit both.

| Token       | Hex       | When to use                          |
| ----------- | --------- | ------------------------------------ |
| `primary`   | `#0088FF` | brand, CTAs, active tab, progress    |
| `info`      | `#00C0E8` | info chips                           |
| `success`   | `#34C759` | correct answers, goal-reached, ≥100% |
| `warning`   | `#FFCC00` | low progress (<60%)                  |
| `danger`    | `#F56F72` | wrong answers, destructive           |
| `ink`       | `#100910` | primary text (`text-ink`)            |
| `ink-muted` | `#BEBEBE` | secondary text, inactive icons       |
| `surface`   | `#FFFFFF` | card backgrounds                     |

Each semantic color also exposes `-50` (tint), `-500` (default), `-600` (darker) shades. Example: `bg-success-50 border-success-500/30 text-success-600`.

**Don't hardcode hex in components.** If you need a color that isn't in the palette, ask the user before adding a new token.

### Spacing & radii

- Cards: `bg-surface rounded-2xl p-4 (or p-5) border border-gray-100`
- Page padding: `px-5 py-4`
- Buttons: `rounded-xl` (small), `rounded-2xl` (cards/pills)
- Avatar circles: `w-12 h-12 rounded-full bg-primary-50` for muted, `bg-primary` for filled
- Active tab pill: 80×56 rounded 36
- Tab bar height: 78, bottom offset: 24

### Typography scale

```
text-2xl font-bold text-ink     screen titles, big headings (greeting)
text-xl  font-bold text-ink     section / card primary value
text-lg  font-bold text-ink     section headings
text-base font-semibold text-ink card titles, list rows
text-sm  text-ink-muted         secondary lines
text-xs  text-ink-muted         meta rows
text-[11px] uppercase tracking-wide font-semibold text-ink-muted   eyebrow labels
```

### Card pattern

```tsx
<View className="bg-surface rounded-2xl p-4 border border-gray-100">
  ...
</View>
```

For interactive cards: wrap in `<TouchableOpacity activeOpacity={0.85}>` (CTA cards) or `0.7` (list rows).

### Icons

Always Ionicons. Default size 16 (inline meta), 18 (chevrons), 22 (CTA accents), 24 (tab icons), 36 (empty-state). Color is always a token from `theme/colors.ts` — never inline hex.

### Empty / loading states

Standard pattern (see home, quiz list):

```tsx
{isLoading ? (
  <View className="py-8 items-center"><ActivityIndicator color={colors.primary} /></View>
) : items.length === 0 ? (
  <View className="bg-surface rounded-2xl p-6 items-center border border-gray-100">
    <Ionicons name="..." size={36} color={colors.inkMuted} />
    <Text className="text-ink-muted mt-2">{t("noXyz")}</Text>
  </View>
) : (
  ...
)}
```

### Multilingual strings

- **UI strings**: add a key to all three `translations.uz` / `oz` / `ru` blocks in `services/i18n.ts`. Use it as `t("yourKey")`.
- **DB content**: render with `pickLang(name_uz, name_oz, name_ru)`. Falls back to `uz` when the requested locale's column is empty.

### Web-specific gotchas

- `@react-native-community/datetimepicker` is native-only. On web branch with `Platform.OS === "web"` and overlay a transparent `<input type="date">` on top of the styled pill (see `app/(onboarding)/index.tsx` for the pattern).
- For full-page scrollable screens, wrap content in **one** `<ScrollView contentContainerClassName="px-5 py-4 ...">`. Don't pad the outer view + nest a ScrollView with separate padding — RNW's measurement leaks to a different container width than native, and pages end up visibly mismatched.

## Working rules

- Edit existing files. Don't introduce new abstractions for one-off needs.
- Don't write comments that restate code. Only write a comment when the WHY is non-obvious.
- After any change to submit logic, verify the cache invalidation still hits `["results"]` so the home performance widget refreshes.
- Never assume `auth.user` is non-null after a navigation. Re-hydrate via `verifyMeApi()` if a token exists.
- Schema changes belong in the API. Don't try to mirror server-side validation in the client beyond what's needed for UX.
- When adding strings, add all three languages or it will fall back to `uz` and look broken in `oz`/`ru`.
