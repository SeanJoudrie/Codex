# Launch checklist: ways a small app gets fined or sued

Run this before anything goes public that collects data, sends messages, shows ads or charges money.
Started from a "10 ways your vibe-coded app is getting sued" video (2026-09); each item is rewritten
here with what the rule actually is. Figures are the commonly cited maximums or typical outcomes, not
what a small app would usually pay. Amounts change yearly with inflation: check before relying on them.
This is a to-do list, not legal advice. Anything that earns real money gets a quick lawyer check.

| # | Risk | The actual rule | Cost if it goes wrong | The fix |
|---|---|---|---|---|
| 1 | Marketing texts or calls without consent | TCPA (US): texts/robocalls need prior written consent | $500 per text, up to $1,500 if wilful; people can sue directly | Only text people who ticked an unticked "text me" box; keep the proof |
| 2 | No DMCA agent | Only matters if users can upload content. Registering an agent with the US Copyright Office keeps "safe harbor" | No fine; without it *you* can be sued for users' uploads | Register (about $6, renew every 3 years) and add a takedown contact page |
| 3 | Unencrypted data | FTC Act + state breach laws; health apps also fall under the FTC Health Breach Notification Rule | FTC orders, breach notices, lawsuits | HTTPS everywhere, encrypted database, no secrets in the browser, collect as little as possible |
| 4 | No AI policy | Not a law by itself; the FTC punishes misleading AI claims and hidden AI use | See #10 | Say where AI is used, what it can get wrong, and what data it sees |
| 5 | Face ID / face or voice prints without consent | Illinois BIPA (also Texas, Washington) | $1,000 per violation, $5,000 if reckless; class actions | Don't collect face or voice prints. If you must: written consent, a retention policy, deletion |
| 6 | Meta Pixel / tracking before cookie consent | California CIPA "wiretap" lawsuits; GDPR in the EU; VPPA if you show video | CIPA suits claim $5,000 per violation | No trackers until the visitor agrees; or skip third-party trackers entirely |
| 7 | No alt text / inaccessible site | ADA website lawsuits (WCAG 2.1 AA is the usual yardstick) | Demand letters and settlements, often five figures | Alt text, labels, keyboard use, contrast. Don't rely on "accessibility overlay" widgets (see #10) |
| 8 | No age gate | COPPA: collecting data from under-13s needs verified parental consent. Alcohol content needs a 21+ gate | COPPA civil penalty over $50,000 per violation | Ask age before collecting anything; block or strip data for under-13s; 21+ gate for drinking content |
| 9 | No unsubscribe in emails | CAN-SPAM: a working unsubscribe link, honoured within 10 business days, plus a postal address | Over $50,000 per email | Use an email service that adds unsubscribe automatically; never email people who opted out |
| 10 | Unprovable AI claims | FTC Act; "Operation AI Comply" is ongoing | accessiBe paid $1M (FTC, Jan 2025) for claiming its AI overlay made sites compliant; DoNotPay $193k for its "robot lawyer" | Never claim what you can't prove ("guaranteed", "compliant", "replaces a lawyer/doctor"); keep test results |

Also always: a plain privacy policy and terms page; show prices and renewals clearly before
charging, with cancellation as easy as sign-up (FTC "click to cancel" and state auto-renewal laws);
no fake reviews or testimonials; credit third-party code and data per their licences.

## Where the projects stand

What each existing project most needs to check before it earns money or grows. "Low" means
nothing on the list obviously applies today.

| Project | Watch for | Items |
|---|---|---|
| Stool | Health data: FTC Health Breach Notification Rule; keep it on-device; no trackers | 3, 6 |
| Dream Journal | Voice recordings and AI tidying: disclose AI, don't store voiceprints | 3, 4, 5 |
| Todo | Voice input and optional AI: disclose AI use | 4 |
| Curio | Photos, planned subscription: consent, clear renewal terms | 3, 6, subscriptions |
| REX | Accounts in Supabase, shareable portraits: privacy policy, secure keys | 3, 6 |
| Eventr | Planned ads and business accounts, possible notifications: consent for texts/emails | 1, 6, 9 |
| Flexyn | Accounts, AI coach, food and body data: health data rules, AI claims | 3, 4, 10 |
| Globalio | Google ads: cookie consent before ad trackers; flag games attract kids, so COPPA | 6, 7, 8 |
| Sled, DroneDome, Colorbook | Colorbook handles family photos and AI; keep processing on-device | 3, 4 (Colorbook) |
| Rap Sheet | Drinking toggle: 21+ gate; party-game content | 8 |
| Birdwatch | Real-data prototype; photos later | 3 once photos exist |
| After-Action Resume | AI rewrites service records: no "get hired" claims, no invented experience, protect uploaded records | 3, 4, 10 |
| Job Scanner, FlexChex, OCS rotation | Personal or small-group tools | Low |
| The Collection, Wake, Basic, Friendspace | Static sites; alt text on images | 7 |
| Codex | No user data; links out to others' repos | Low |
