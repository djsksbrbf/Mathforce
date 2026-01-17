features:
	user login instead of making it accessible to everyone:
		- the page consists of whether the user wants to login or signup
			- if they click signup, they fill out the particulars, (username, email, password)
			- if they click login, they fill out their username and password 
				- If the password is incorrect or username is not found, return an error message displaying Username Incorrect or Password does not match
	
	The top right contains a pointer to their profile which shows their history, number of problems solved, a pie graph showing which topics they've solved along with their rating. 

	database containing all the problems instead of manual inputting in js
		- problem contains (problem number, topic, rating, problem statement, answer key)
	an access link for users to propose problems to the admin:
		- users can first login in the login page and click the access link 
		- they then fill out the particulars (topic, problem statement, answer key)
		- they then send for approval to the admin
		- once the admin approves, the problem is placed into the problems database
	
	Once the user logs in they can see a problem and they can choose whether to continue working on the problem, randomizing their current problem or choosing a problem from the problemset

	the site can return whether the answer is correct or wrong
		- there will be a text box where the user can input the answer, and a check button they can click if they're sure
	
	users can request certain topics to fit their styles
		- a dropdown containing all available topics where users can choose from
		- once a topic has been chosen, all randomized problems will come from that topic
	
	user and problem ratings do not get lost
		- after every refresh or close tab or log out, ratings are still retained for every problem or user.

	a cleaner user interface
		- users can choose between having light or dark more
	a button for problem randomizing
		- randomizing problems are taken from topics which users have chosen
		- if users don't specify a topic, they will be given a random problem they haven't solved from the database
		- if they do, they will be given a random problem from the database with that topic, which they haven't solved
		- if users have completed all problems in that topic, return a message (You have solved all problems in that topic)
	
Technology:
1. Python - API & Business Logic
2. Database - Postgres
3. FrontEnd - React
4. Mobile friendly
5. Authentication - JWT
6. Single VM using Lighthouse AWS
7. MVP don't need Latex just use simple string




# Implementation Plan

## Scope and key decisions
- Auth flows: login/signup with JWT; return clear invalid username/password errors.
- Core entities: User, Problem, Submission, Topic, Proposal (pending approval), stats.
- Problem lifecycle: continue current, randomize, choose from problem set.
- Persistence: ratings, solves, and history stored server-side and survive logout.
- UI: light/dark mode, mobile-friendly layout.

## Data model (Postgres)
- users: id, username, email, password_hash, rating, created_at
- problems: id, number, topic_id, rating, statement, answer_key, created_at
- topics: id, name
- submissions: id, user_id, problem_id, answer, is_correct, created_at
- user_problem_state: user_id, problem_id, status, last_seen_at
- proposals: id, user_id, topic_id, statement, answer_key, status, created_at
- user_stats: user_id, total_solved, per_topic_json (or computed view)

## Backend (Python + JWT)
1. Auth
   - POST /auth/signup
   - POST /auth/login (returns JWT)
   - middleware for protected routes
2. Problems
   - GET /problems/random?topic_id=
   - GET /problems/:id
   - GET /problems (filter by topic, solved/unsolved)
   - POST /problems/:id/submit (returns correct/incorrect)
3. User/Profile
   - GET /me (history, solved count, per-topic stats, rating)
   - GET /me/current-problem
   - POST /me/current-problem (set/continue)
4. Proposals
   - POST /proposals (user submit)
   - GET /admin/proposals (admin view)
   - POST /admin/proposals/:id/approve (insert into problems)
5. Ratings
   - update user/problem ratings on correct/incorrect (define formula)

## Frontend (React + shadcn/ui)
- Setup shadcn/ui with Tailwind and class-variance-authority; use a neutral base theme and tokens for light/dark.
- Auth page: toggle login/signup using `Card`, `Tabs`, `Input`, `Button`, `Form`, `Toast` for errors.
- Main problem page:
  - current problem in `Card`, answer `Textarea`/`Input`, `Button` to check
  - randomize `Button` and topic `Select`
  - `Alert` when topic is exhausted
- Profile dropdown (top-right):
  - `DropdownMenu` + `Avatar`
  - history list in `ScrollArea`, solved count in `Badge`
  - pie chart via a lightweight chart lib and wrap in `Card`
- Problem set page (select specific problem): `Table` with filter controls and row actions.
- Proposal form (protected): `Form`, `Select`, `Textarea`, `Button`, success `Toast`.
- Navigation: `NavigationMenu`/`Sheet` for mobile; keep layout responsive.
- Light/Dark toggle using `ThemeProvider` and `ModeToggle` pattern.

## Logic details
- Random selection: unsolved first; if none, show exhausted message
- Topic filtering: applies to randomization and continue
- Continue uses user_problem_state
- Answer checking: exact string match (MVP), normalize whitespace/case
- Rating formula: define and persist server-side

## Deployment
- Single VM (Lighthouse AWS)
- Environment config for DB, JWT secret
- DB migrations + seed topics/problems
- API served behind Nginx + React static build

## Milestones
1. DB schema + migrations + seed
2. Auth endpoints + JWT middleware
3. Problems API (randomize, submit, stats)
4. Proposal flow + admin approval
5. React pages + routing + state management
6. UI polish + mobile + light/dark
7. Deploy to VM + smoke tests
